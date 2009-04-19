import("cpp");

MPI = new cpp.Plugin("MPI");
with( MPI )
{
		Include("<mpi.h>");
		Include("<stdio.h>");
		Include("<stddef.h>");
		
		Extra = <%
		#define BUFFER_SIZE 4096
		#define DEBUG 4
		
		bool ExecuteString( Handle<String> source, Handle<Value> name, Handle<Value>& );	
			
		const int jsMPI_Integer = 1;
		const int jsMPI_String = 2;
		const int jsMPI_Number = 3;
		const int jsMPI_Boolean = 4;
		const int jsMPI_Array = 5;
		const int jsMPI_Object = 6;
		const int jsMPI_Function = 7;
		const int jsMPI_Reduce_SUM = 8;
		const int jsMPI_Reduce_PROD = 9;
		
		MPI_Status rstatus;     
		int last_rcv_source=0, last_rcv_tag=0;
		int rank;
		int size;
		//MPI_Op add, multiply;
		//MPI_Op_create((MPI_User_function *)addition, 1 , &add);
		//MPI_Op_create((MPI_User_function *)multiplication, 1 , &multiply);
		
		//*************************** jsMPI_Pack_size *******************************//
		int jsMPI_Pack_size( Handle<Value> item )
		{
			int temp=0, temp1=0;
			if ( item->IsInt32() )
			{
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				temp1+=temp;
				//bufsize = bufsize + temp;
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//*temp2 = *bufsize + temp;
				temp1+=temp;
			}
			else if ( item->IsString() || item->IsFunction())
			{
				// String
				String::Utf8Value Str( item->ToString() );
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
				MPI_Pack_size( Str.length(), MPI_BYTE, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
			}
			else if ( item->IsNumber() )
			{
				// Double
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
				MPI_Pack_size( 1, MPI_DOUBLE, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
			}
			else if ( item->IsBoolean() )
			{
				// Boolean
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
			}
			else if ( item->IsObject() || item->IsArray())
			{
				Handle<Object> Obj = item->ToObject();
				Handle<Array> ObjKeys = Obj->GetPropertyNames();
				int KeyCount = ObjKeys->Length();
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				temp1+=temp;
				//bufsize = bufsize + temp;
				MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
				//bufsize = bufsize + temp;
				temp1+=temp;
				//printf("ObjKeys->Length() = %d \n", ObjKeys->Length());
				for ( int i=0; i<ObjKeys->Length(); i++ )
				{
					HandleScope handle_scope;
					Handle<Value> Key = ObjKeys->Get( Integer::New( i ) );
					Handle<Value> Val = Obj->Get( Key );
					//printf("Recursive pack\n");
					temp1+=jsMPI_Pack_size( Key );
					//printf("Done packing key now val\n");
					temp1+=jsMPI_Pack_size(Val);
				}
			}
			return temp1;
		}
		
		//*************************** jsMPI_Pack *******************************//
		void jsMPI_Pack( char *packBuf, int *pos, Handle<Value> item )
		{
			if ( item->IsInt32() )
			{
				// Integer
				int value = item->IntegerValue();
				//printf("packing an integer\n");
				MPI_Pack( (void *)&jsMPI_Integer, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				MPI_Pack( &value, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
			}
			else if ( item->IsString() || item->IsFunction())
			{
				// String
				String::Utf8Value Str( item->ToString() );
				int StrLength = Str.length();
				//printf("packing a string\n");
			  if ( item->IsString() )
					MPI_Pack( (void *)&jsMPI_String, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				else
					MPI_Pack((void *)&jsMPI_Function, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD);
				MPI_Pack( &StrLength, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				//printf("String being packed is %d\n", Str.length());
				MPI_Pack( *Str, Str.length(), MPI_BYTE, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
			}
			else if ( item->IsNumber() )
			{
				// Double
				double value = item->NumberValue();
				MPI_Pack( (void *)&jsMPI_Number, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				MPI_Pack( &value, 1, MPI_DOUBLE, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
			}
			else if ( item->IsBoolean() )
			{
				// Boolean
				int value = (int)item->BooleanValue();
				MPI_Pack( (void *)&jsMPI_Boolean, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				MPI_Pack( &value, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
			}
			else if ( item->IsObject() || item->IsArray())
			{
				Handle<Object> Obj = item->ToObject();
				Handle<Array> ObjKeys = Obj->GetPropertyNames();
				int KeyCount = ObjKeys->Length();
				// Objects
				if ( item->IsArray() )
				{
					//printf("packing an array\n");
					MPI_Pack( (void *)&jsMPI_Array, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				}
				else
				{
					//printf("packing an object\n");
					MPI_Pack( (void *)&jsMPI_Object, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				}
				MPI_Pack( (void *)&KeyCount, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
				//printf("ObjKeys->Length() = %d \n", ObjKeys->Length());
				for ( int i=0; i<ObjKeys->Length(); i++ )
				{
					HandleScope handle_scope;
					Handle<Value> Key = ObjKeys->Get( Integer::New( i ) );
					Handle<Value> Val = Obj->Get( Key );
					//bufsize = 0;
					//jsMPI_Pack_size = 
					//printf("Recursive pack\n");
					jsMPI_Pack( packBuf, pos, Key );
					//printf("Done packing key now val\n");
					jsMPI_Pack( packBuf, pos, Val );
				}
			}
		}
		
		//********************************** jsMPI_Unpack **************************************//
		Handle<Value> jsMPI_Unpack( char *buffer, int *position)
		{
			int jsMPI_Type ;
			MPI_Unpack( buffer, BUFFER_SIZE, position, &jsMPI_Type, 1, MPI_INT, MPI_COMM_WORLD );
			switch ( jsMPI_Type )
			{
				case jsMPI_Integer:
					int intvalue;
					MPI_Unpack( buffer, BUFFER_SIZE, position, &intvalue, 1, MPI_INT, MPI_COMM_WORLD );
					return Integer::New( intvalue );
		
				case jsMPI_String:
				case jsMPI_Function:
					int length;
					char str[BUFFER_SIZE];
					MPI_Unpack( buffer, BUFFER_SIZE, position, &length, 1, MPI_INT, MPI_COMM_WORLD );
					MPI_Unpack( buffer, BUFFER_SIZE, position, str, length, MPI_BYTE, MPI_COMM_WORLD );
					if(jsMPI_Type == jsMPI_Function)
					{
					    Handle<Value> Result;
					    ExecuteString( String::New( str, length ), String::New( "MPI.Recv Function" ), Result );
						return Result;
					}
					else
						return String::New( str, length );
		
				case jsMPI_Number:
					double dblvalue;
					MPI_Unpack( buffer, BUFFER_SIZE, position, &dblvalue, 1, MPI_DOUBLE, MPI_COMM_WORLD );
					return Number::New( dblvalue );
		
				case jsMPI_Boolean:
					int boolvalue;
					MPI_Unpack( buffer, BUFFER_SIZE, position, &boolvalue, 1, MPI_INT, MPI_COMM_WORLD );
					return Boolean::New( (bool) boolvalue );
				case jsMPI_Object:
				case jsMPI_Array:
					int KeyCount,i;
					MPI_Unpack(buffer, BUFFER_SIZE, position, &KeyCount, 1, MPI_INT, MPI_COMM_WORLD);
					Handle<Object> Obj = Object::New();
					Handle<Array> ObjArr = Array::New();
					Handle<Value> key;
					Handle<Value> value;
					for(i=0; i<KeyCount; i++)
					{
						key=jsMPI_Unpack(buffer, position);
						value=jsMPI_Unpack(buffer, position);
						if(jsMPI_Type ==  jsMPI_Object)
							Obj->Set(key, value);
						else
							ObjArr->Set(key, value);
		
					}
					if(jsMPI_Type ==  jsMPI_Object)
						return Obj;
					else
						return ObjArr;
			}
		}
		%>
		//****************************** MPI.Init() ****************************//
			Init = <%
			MPI_Init( 0, NULL );
		%>
		
		//****************************** MPI.Size() ****************************//
			Functions.Size = <%
			MPI_Comm_size( MPI_COMM_WORLD, &size );
			return Integer::New( size );
		%>
		
		//****************************** MPI.Rank() ****************************//
			Functions.Rank = <%
			MPI_Comm_rank( MPI_COMM_WORLD, &rank );
			return Integer::New( rank );
		%>
		
		//****************************** MPI.Pack_size() ****************************//
		Functions.Pack_size = <%
			int bufsize = 0;
			bufsize = jsMPI_Pack_size(args[0]);
			return Integer::New(bufsize);
		%>
		//****************************** MPI.Send() ****************************//
			Functions.Send = <%
			char *buffer;
			int position=0, bufsize;
			int sdst, stag=0;
			int bcast_pieces = 0;
			// Allocate buffer
			Handle<Value> input;
			buffer = new char[BUFFER_SIZE];
			
			// Check arguments
			if ( args.Length() < 1 )
				return False();
			
			// Get destination        
			if ( args.Length() < 2 )
				sdst = -1;
			else
				sdst = args[1]->IntegerValue();
			
			// Get tag
			if ( args.Length() >= 3 )
			{
				sdst = args[1]->IntegerValue();
				stag = args[2]->IntegerValue(); 
			}
			else 
				stag = 0;
			if(((sdst < 0) && (rank == 0)) || (sdst >= 0) )
					jsMPI_Pack( buffer, &position, args[0] );

			if(sdst < 0)
			{
				int retvali=0;
				retvali = MPI_Bcast(buffer, BUFFER_SIZE, MPI_PACKED, 0, MPI_COMM_WORLD);
				if(rank != 0)
				{
					Handle<Value> retval;
					//printf("Unpacking the broadcast of size %d\n", position);
					position=0;
					retval = jsMPI_Unpack(buffer, &position);
					//printf("Unpacked\n");
					return retval;
				}
				else
					return Integer::New(retvali);
			}
			else
			{
				int retval = 0;
				retval = MPI_Send( buffer, position, MPI_PACKED, sdst, stag, MPI_COMM_WORLD); 
				return Integer::New(retval);
			}
			%>
		
		//****************************** MPI.Recv() ****************************//
			Functions.Recv = <%
				int src,rtag, retval=0;
				if ( args.Length() < 1 )
				{
					src = MPI_ANY_SOURCE;
					rtag = MPI_ANY_TAG;
				}
				else if (args.Length() == 1)
				{
					src = args[0]->IntegerValue();
					rtag = MPI_ANY_TAG;
				}
				else if (args.Length() == 2)		
				{
					src = args[0]->IntegerValue();
					rtag = args[1]->IntegerValue();
				}
				
				char buffer[ BUFFER_SIZE ];
				int position = 0;
				Handle<Value> val;
				
				// Receive variant object
				retval=MPI_Recv( buffer, BUFFER_SIZE, MPI_PACKED, src, rtag, MPI_COMM_WORLD, &rstatus );
				last_rcv_tag = rstatus.MPI_TAG;
				last_rcv_source = rstatus.MPI_SOURCE;
				val=jsMPI_Unpack(buffer, &position);
				return val;
				// Unpacked based on type
		
		%>
		
		//****************************** MPI.Probe() ****************************//
		Functions.Probe = <%
			int src, tag,retval;
			if ( args.Length() < 1 )
			{
				src = MPI_ANY_SOURCE;
				tag = MPI_ANY_TAG;
			}
			else if(args.Length() == 1)
			{
				src = args[0]->IntegerValue();
				tag = MPI_ANY_TAG;
			}
			else if(args.Length() == 2)
			{
				src = args[0]->IntegerValue();
				tag = args[1]->IntegerValue();
			}
			retval = MPI_Probe(src, tag, MPI_COMM_WORLD,&rstatus);
			last_rcv_tag = rstatus.MPI_TAG;
			last_rcv_source = rstatus.MPI_SOURCE;
			return Integer::New(retval);
		%>
		
		//****************************** MPI.Iprobe() ****************************//
		Functions.Iprobe = <%
			int src, tag,retval,flag;
			if ( args.Length() < 1 )
			{
				src = MPI_ANY_SOURCE;
				tag = MPI_ANY_TAG;
			}
			else if(args.Length() == 1)
			{
				src = args[0]->IntegerValue();
				tag = MPI_ANY_TAG;
			}
			else if(args.Length() == 2)
			{
				src = args[0]->IntegerValue();
				tag = args[1]->IntegerValue();
			}
			retval = MPI_Iprobe(src, tag, MPI_COMM_WORLD, &flag, &rstatus);
			last_rcv_tag = rstatus.MPI_TAG;
			last_rcv_source = rstatus.MPI_SOURCE;
			return Integer::New(flag);
		%>
		
		//****************************** MPI.Tag() ****************************//
		Functions.Tag = <%
			return Integer::New(last_rcv_tag); 
		%>
		
		//****************************** MPI.Source() ****************************//
		Functions.Source = <%
			return Integer::New(last_rcv_source); 
		%>
		
		//****************************** MPI.Reduce() ****************************//
		Functions.Reduce = <%
			int src,retval;
			if ( args.Length() < 3 )
			{
				printf("ERROR::Usage of Reduce(sendbuffer, size, operation_to_perform), reduce alwyas done on rank=0\n");
				// Size parameter is not used for now
				return False();
			}
			char sbuf[BUFFER_SIZE], rbuf[BUFFER_SIZE];
			int position = 0;
			
			if ( args[0]->IsInt32() )
			{
				// Integer
				int value = args[0]->IntegerValue(); // Pack array here
				int result ;
				//MPI_Pack( (void *)&jsMPI_Integer, 1, MPI_INT, buffer, BUFFER_SIZE, &position, MPI_COMM_WORLD );
				//MPI_Pack(&value, 1, MPI_INT, sbuf, BUFFER_SIZE, &position, MPI_COMM_WORLD );
				switch(args[2]->IntegerValue())
				{
					case 0:
						//MPI_Reduce(sbuf, rbuf, position, MPI_INT, add, 0, MPI_COMM_WORLD);
						result = 0;
						retval=MPI_Reduce(&value, &result, 1, MPI_INT, MPI_SUM, 0, MPI_COMM_WORLD);
						//MPI_Unpack(rbuf, BUFFER_SIZE, &position, &value, 1, MPI_INT, MPI_COMM_WORLD);
						break;
					case 1:
						//MPI_Reduce(sbuf, rbuf, position, MPI_INT, multiply, 0, MPI_COMM_WORLD);
						result = 1;
						retval=MPI_Reduce(&value, &result, 1, MPI_INT, MPI_PROD, 0, MPI_COMM_WORLD);
						//MPI_Unpack(rbuf, BUFFER_SIZE, &position, &value, 1, MPI_INT, MPI_COMM_WORLD);
						break;
					default:
						printf("ERROR:: Unsupported function in Reduce. Exiting\n");
						return Null();
				}
				return Integer::New(result);
			}
			else
				return Null();
		%>
		
		//****************************** MPI.Wtick() ****************************//
			Functions.Wtick = <%
			double time;
		time = MPI_Wtick();
		return Number::New(time);
		%>		
		
		//****************************** MPI.Wtime() ****************************//
			Functions.Wtime = <%
				double time;
				time = MPI_Wtime();
				return Number::New(time);
		%>	
		
		//****************************** MPI.Exit() ****************************//
			Exit = <%
			MPI_Finalize();
		%>
		
			Export();
}
