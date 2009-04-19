import("cpp");

MPI = new cpp.Plugin("MPIdebug");
with( MPI )
{
    Include("<mpi.h>");
    Include("<stdio.h>");
    Include("<stddef.h>");

    Extra = <%
        const int jsMPI_Integer = 1;
        const int jsMPI_String = 2;
        const int jsMPI_Number = 3;
        const int jsMPI_Boolean = 4;

        #define NUM_JSMPI_OPS 2
        enum jsMPI_Ops
        {
            JSMPI_OP_SEND = 0,
            JSMPI_OP_RECV
        };

        MPI_Status status;

        // MPI profiling statistics
        typedef struct stats_s
        {
            int count[NUM_JSMPI_OPS];
            double time[NUM_JSMPI_OPS];
        } stats_t;
        stats_t stats;
        double runstart;
    %>
    
    Init = <%
        MPI_Init( 0, NULL );

        // Clear statistics
        for ( int i=0; i<NUM_JSMPI_OPS; i++ )
        {
            stats.count[i] = 0;
            stats.time[i] = 0.0;
        }
        runstart = MPI_Wtime();
    %>

    Functions.Size = <%
        int size;
        MPI_Comm_size( MPI_COMM_WORLD, &size );
        return Integer::New( size );
    %>

    Functions.Rank = <%
        int rank;
        MPI_Comm_rank( MPI_COMM_WORLD, &rank );
        return Integer::New( rank );
    %>

    Functions.Send = <%
        double start = MPI_Wtime();

        if ( args.Length() < 2 )
            return False();

        char buffer[256];
        int position = 0;
        static int tag = 0;

        if ( args[0]->IsInt32() )
        {
            // Integer
            int value = args[0]->IntegerValue();
            MPI_Pack( (void *)&jsMPI_Integer, 1, MPI_INT, buffer, 256, &position, MPI_COMM_WORLD );
            MPI_Pack( &value, 1, MPI_INT, buffer, 256, &position, MPI_COMM_WORLD );
        }
        else if ( args[0]->IsString() )
        {
            // String
            String::Utf8Value Str( args[0]->ToString() );
            int StrLength = Str.length();
            MPI_Pack( (void *)&jsMPI_String, 1, MPI_INT, &buffer, 256, &position, MPI_COMM_WORLD );
            MPI_Pack( &StrLength, 1, MPI_INT, buffer, 256, &position, MPI_COMM_WORLD );
            MPI_Pack( *Str, Str.length(), MPI_BYTE, buffer, 256, &position, MPI_COMM_WORLD );
        }
        else if ( args[0]->IsNumber() )
        {
            // Double
            double value = args[0]->NumberValue();
            MPI_Pack( (void *)&jsMPI_Number, 1, MPI_INT, &buffer, 256, &position, MPI_COMM_WORLD );
            MPI_Pack( &value, 1, MPI_DOUBLE, &buffer, 256, &position, MPI_COMM_WORLD );
        }
        else if ( args[0]->IsBoolean() )
        {
            // Boolean
            int value = (int)args[0]->BooleanValue();
            MPI_Pack( (void *)&jsMPI_Boolean, 1, MPI_INT, &buffer, 256, &position, MPI_COMM_WORLD );
            MPI_Pack( &value, 1, MPI_INT, &buffer, 256, &position, MPI_COMM_WORLD );
        }
        else
            return Null();

        // Send variant objectf
        MPI_Send( &buffer, position, MPI_PACKED, args[1]->IntegerValue(), tag, MPI_COMM_WORLD );
        tag++;

        // Record statistics
        stats.time[JSMPI_OP_SEND] += ( MPI_Wtime() - start );
        stats.count[JSMPI_OP_SEND]++;

        return True();
    %>

    Functions.Recv = <%
        Handle<Value> result;
        double start = MPI_Wtime();

        int src;
        if ( args.Length() < 1 )
            src = MPI_ANY_SOURCE;
        else
            src = args[0]->IntegerValue();

        char buffer[ 256 ];
        int position = 0;

        // Receive variant object
        MPI_Recv( buffer, 256, MPI_PACKED, MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status );

        // Unpacked based on type
        int jsMPI_Type;
        MPI_Unpack( buffer, 256, &position, &jsMPI_Type, 1, MPI_INT, MPI_COMM_WORLD );
        switch ( jsMPI_Type )
        {
            case jsMPI_Integer:
                int intvalue;
                MPI_Unpack( &buffer, 256, &position, &intvalue, 1, MPI_INT, MPI_COMM_WORLD );
                result = Integer::New( intvalue );
                break;

            case jsMPI_String:
                int length;
                char str[256];
                MPI_Unpack( &buffer, 256, &position, &length, 1, MPI_INT, MPI_COMM_WORLD );
                MPI_Unpack( &buffer, 256, &position, str, length, MPI_BYTE, MPI_COMM_WORLD );
                result = String::New( str, length );
                break;

            case jsMPI_Number:
                double dblvalue;
                MPI_Unpack( &buffer, 256, &position, &dblvalue, 1, MPI_DOUBLE, MPI_COMM_WORLD );
                result = Number::New( dblvalue );
                break;

            case jsMPI_Boolean:
                int boolvalue;
                MPI_Unpack( &buffer, 256, &position, &boolvalue, 1, MPI_INT, MPI_COMM_WORLD );
                result = Boolean::New( (bool) boolvalue );
                break;

            default:
                result = Null();
        }

        stats.time[JSMPI_OP_RECV] += ( MPI_Wtime() - start );
        stats.count[JSMPI_OP_RECV]++;
        return result;

    %>

    Exit = <%
        // Record program run-time
        double runtime = MPI_Wtime() - runstart;

        MPI_Barrier( MPI_COMM_WORLD );

        // Calculate size, rank
        int size, rank;
        MPI_Comm_size( MPI_COMM_WORLD, &size );
        MPI_Comm_rank( MPI_COMM_WORLD, &rank );

        // Define statistics structure for MPI
        int blocklens[2] = {NUM_JSMPI_OPS, NUM_JSMPI_OPS};
        MPI_Aint indices[2] = { offsetof(stats_s, count), offsetof(stats_s, time) };
        MPI_Datatype oldTypes[2] = { MPI_INT, MPI_DOUBLE };
        MPI_Datatype statType;
        MPI_Type_struct( 2, blocklens, indices, oldTypes, &statType );
        MPI_Type_commit( &statType );

        // Send statistics to node zero
        if ( rank != 0 )
            MPI_Send( &stats, 1, statType, 0, 0, MPI_COMM_WORLD );

        // Record logs to file
        else
        {
            // Statistics totals
            stats_t total;
            for ( int i=0; i<NUM_JSMPI_OPS; i++ )
            {
                total.count[i] = 0;
                total.time[i] = 0.0;
            }

            // Receive statistics 
            MPI_Status status;
            stats_t *nodeStats = new stats_t[size];
            memcpy( &nodeStats[0], &stats, sizeof( stats_t ) );
            for ( int i=1; i<size; i++ )
                MPI_Recv( &nodeStats[i], 1, statType, i, 0, MPI_COMM_WORLD, &status );

            // Tally totals
            for ( int i=0; i<size; i++ )
            {
                for ( int j=0; j<NUM_JSMPI_OPS; j++ )
                {
                    total.count[j] += nodeStats[i].count[j];
                    total.time[j] += nodeStats[i].time[j];
                }
            }
            
            // Write to file
            FILE *f = fopen( "jsMPI.log", "w" );
            if ( f == NULL )
                return ThrowException( String::New( "Could not open logfile" ) );

            fprintf( f, "MPI.Send: %fs (%.2f%%)\n", total.time[JSMPI_OP_SEND], total.time[JSMPI_OP_SEND] / ( runtime*size ) * 100.0 );
            for ( int i=0; i<size; i++ )
                fprintf( f, "    Node %d: %fs (%.2f%%)\n", i, nodeStats[i].time[JSMPI_OP_SEND], nodeStats[i].time[JSMPI_OP_SEND] / runtime * 100.0 );
            fprintf( f, "\n" );

            fprintf( f, "MPI.Recv: %fs (%f%%)\n", total.time[JSMPI_OP_RECV], total.time[JSMPI_OP_RECV] / ( runtime*size ) * 100.0 );
            for ( int i=0; i<size; i++ )
                fprintf( f, "    Node %d: %fs (%.2f%%)\n", i, nodeStats[i].time[JSMPI_OP_RECV], nodeStats[i].time[JSMPI_OP_RECV] / runtime * 100.0 );
            fprintf( f, "\n" );

            fclose( f );            
        }

        MPI_Finalize();
    %>

    Export();
}
