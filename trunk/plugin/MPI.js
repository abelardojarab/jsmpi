import("cpp");

MPI = new cpp.Plugin("MPI");
with( MPI )
{
        Include("<mpi.h>");
        Include("<stdio.h>");
        Include("<stddef.h>");
        
        Extra = <% 
        #define BUFFER_COUNT 2048
        #define HEAD_BUF_SIZE 128
        #define BUFFER_SIZE 2047
        //#define BUFFER_SIZE (BUFFER_COUNT*sizeof(int))
        #define DEBUG 4

        typedef struct fragment_s
        {
            char data[BUFFER_SIZE];
            int position;
            struct fragment_s *next;
        } fragment;
        
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
        const int jsMPI_Fragment = 10;

        int jsMPI_Integer_Size;
        int jsMPI_Double_Size;
        int jsMPI_Overhead;
        
        MPI_Status rstatus;     
        int last_rcv_source=0, last_rcv_tag=0;
        int rank;
        int size;

        void ExtendBuffer( fragment **buffer )
        {
            // Mark fragment
            MPI_Pack( (int *)&jsMPI_Fragment, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );

            // Push new fragment onto list;
            fragment *frag = new fragment;
            frag->next = *buffer;
            frag->position = 0;
            *buffer = frag;
        }
        
				//*************************** jsMPI_Pack_size *******************************//
				int jsMPI_Pack_size( Handle<Value> item )
				{
					int temp=0, temp1=0;
					if ( item->IsInt32() )
					{
						MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
						temp1+=(2*temp);
					}
					else if ( item->IsString() || item->IsFunction())
					{
						// String
						String::Utf8Value Str( item->ToString() );
						MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
						temp1+=(2*temp);
						MPI_Pack_size( Str.length(), MPI_BYTE, MPI_COMM_WORLD, &temp );
						temp1+=temp;
					}
					else if ( item->IsNumber() )
					{
						// Double
						MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
						temp1+=temp;
						MPI_Pack_size( 1, MPI_DOUBLE, MPI_COMM_WORLD, &temp );
						temp1+=temp;
					}
					else if ( item->IsBoolean() )
					{
						// Boolean
						MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
						temp1+=(2*temp);
					}
					else if ( item->IsObject() || item->IsArray())
					{
						Handle<Object> Obj = item->ToObject();
						Handle<Array> ObjKeys = Obj->GetPropertyNames();
						int KeyCount = ObjKeys->Length();
						MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &temp );
						temp1+=(2*temp);
						for ( int i=0; i<ObjKeys->Length(); i++ )
						{
							HandleScope handle_scope;
							Handle<Value> Key = ObjKeys->Get( Integer::New( i ) );
							Handle<Value> Val = Obj->Get( Key );
							temp1+=jsMPI_Pack_size( Key );
							temp1+=jsMPI_Pack_size(Val);
						}
					}
					return temp1;
				}
        //*************************** jsMPI_Pack *******************************//
        void jsMPI_Pack( fragment **buffer, Handle<Value> item )
        {
            if ( item->IsInt32() )
            {
                // Integer
                if ( (*buffer)->position + jsMPI_Integer_Size + jsMPI_Overhead >= BUFFER_SIZE )
                    ExtendBuffer( buffer );

                int value = item->IntegerValue();
                MPI_Pack( (void *)&jsMPI_Integer, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                MPI_Pack( &value, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
            }
            else if ( item->IsString() || item->IsFunction())
            {
                // String
                String::Utf8Value Str( item->ToString() );
                int StrLength = Str.length();
                int MaxSize = 999999999;
                int PackLength;
                MPI_Pack_size( StrLength, MPI_BYTE, MPI_COMM_WORLD, &PackLength );
                int MpiLength = jsMPI_Overhead + jsMPI_Integer_Size*2 + PackLength;
                int est = MpiLength + (*buffer)->position;
                if ( MpiLength < BUFFER_SIZE )
                {
                    if ( (*buffer)->position + MpiLength + jsMPI_Integer_Size >= BUFFER_SIZE )
                       ExtendBuffer( buffer );
                }
                else
                    printf("Error!  String too large! %d\n", MpiLength);

                if ( item->IsString() )
                    MPI_Pack( (void *)&jsMPI_String, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                else
                    MPI_Pack((void *)&jsMPI_Function, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD);
                MPI_Pack( &StrLength, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                MPI_Pack( *Str, Str.length(), MPI_BYTE, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
            }
            else if ( item->IsNumber() )
            {
                // Double
                if ( (*buffer)->position + jsMPI_Double_Size + jsMPI_Overhead >= BUFFER_SIZE )
                    ExtendBuffer( buffer );

                double value = item->NumberValue();
                MPI_Pack( (void *)&jsMPI_Number, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                MPI_Pack( &value, 1, MPI_DOUBLE, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
            }
            else if ( item->IsBoolean() )
            {
                // Boolean
                if ( (*buffer)->position + jsMPI_Integer_Size + jsMPI_Overhead >= BUFFER_SIZE )
                    ExtendBuffer( buffer );

                int value = (int)item->BooleanValue();
                MPI_Pack( (void *)&jsMPI_Boolean, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                MPI_Pack( &value, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
            }
            else if ( item->IsObject() || item->IsArray() )
            {
                // Objects
                if ( (*buffer)->position + jsMPI_Integer_Size*2 + jsMPI_Overhead >= BUFFER_SIZE )
                    ExtendBuffer( buffer );

                Handle<Object> Obj = item->ToObject();
                Handle<Array> ObjKeys = Obj->GetPropertyNames();
                int KeyCount = ObjKeys->Length();

                if ( item->IsArray() )
                    MPI_Pack( (void *)&jsMPI_Array, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                else
                    MPI_Pack( (void *)&jsMPI_Object, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                MPI_Pack( (void *)&KeyCount, 1, MPI_INT, (*buffer)->data, BUFFER_SIZE, &(*buffer)->position, MPI_COMM_WORLD );
                for ( int i=0; i<ObjKeys->Length(); i++ )
                {
                    HandleScope handle_scope;
                    Handle<Value> Key = ObjKeys->Get( Integer::New( i ) );
                    Handle<Value> Val = Obj->Get( Key );
                    jsMPI_Pack( buffer, Key );
                    jsMPI_Pack( buffer, Val );
                }
            } else
                printf("Unrecognized element\n");
        }
        
				//*************************** jsMPI_HeadPack *******************************//
				void jsMPI_HeadPack( char *packBuf, int *pos, Handle<Value> item )
				{
					if ( item->IsInt32() )
					{
						// Integer
						int value = item->IntegerValue();
						MPI_Pack( (void *)&jsMPI_Integer, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
						MPI_Pack( &value, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
					}
					else if ( item->IsString() || item->IsFunction())
					{
						// String
						String::Utf8Value Str( item->ToString() );
						int StrLength = Str.length();
					  if ( item->IsString() )
							MPI_Pack( (void *)&jsMPI_String, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
						else
							MPI_Pack((void *)&jsMPI_Function, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD);
						MPI_Pack( &StrLength, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
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
							MPI_Pack( (void *)&jsMPI_Array, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
						}
						else
						{
							MPI_Pack( (void *)&jsMPI_Object, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
						}
						MPI_Pack( (void *)&KeyCount, 1, MPI_INT, packBuf, BUFFER_SIZE, pos, MPI_COMM_WORLD );
						for ( int i=0; i<ObjKeys->Length(); i++ )
						{
							HandleScope handle_scope;
							Handle<Value> Key = ObjKeys->Get( Integer::New( i ) );
							Handle<Value> Val = Obj->Get( Key );
							jsMPI_HeadPack( packBuf, pos, Key );
							jsMPI_HeadPack( packBuf, pos, Val );
						}
					}
				}
				
        //********************************** jsMPI_Unpack **************************************//
        Handle<Value> jsMPI_Unpack( fragment *&buffer )
        {
            Handle<Object> Obj;
            Handle<Array> ObjArr;
            Handle<Value> key;
            Handle<Value> value;
            int result;

            int jsMPI_Type ;
            int test = buffer->position;
            result = MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, &jsMPI_Type, 1, MPI_INT, MPI_COMM_WORLD );
            if (jsMPI_Type == jsMPI_Fragment)
            {
                // Move to next fragment
                fragment *oldFrag = buffer;
                buffer = buffer->next;
								result = MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, &jsMPI_Type, 1, MPI_INT, MPI_COMM_WORLD );

								delete oldFrag;
            }

            switch ( jsMPI_Type )
            {
                case jsMPI_Integer:
                    int intvalue;
                    MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, &intvalue, 1, MPI_INT, MPI_COMM_WORLD );
                    return Integer::New( intvalue );
        
                case jsMPI_String:
                case jsMPI_Function:
                    int length;
                    char str[BUFFER_SIZE];
                    MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, &length, 1, MPI_INT, MPI_COMM_WORLD );
                    MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, str, length, MPI_BYTE, MPI_COMM_WORLD );
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
                    MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, &dblvalue, 1, MPI_DOUBLE, MPI_COMM_WORLD );
                    return Number::New( dblvalue );
        
                case jsMPI_Boolean:
                    int boolvalue;
                    MPI_Unpack( buffer->data, BUFFER_SIZE, &buffer->position, &boolvalue, 1, MPI_INT, MPI_COMM_WORLD );
                    return Boolean::New( (bool) boolvalue );

                case jsMPI_Object:
                case jsMPI_Array:
                    int KeyCount,i;
                    MPI_Unpack(buffer->data, BUFFER_SIZE, &buffer->position, &KeyCount, 1, MPI_INT, MPI_COMM_WORLD);
                    Obj = Object::New();
                    ObjArr = Array::New();
                    key;
                    value;
                    for(i=0; i<KeyCount; i++)
                    {
                        key=jsMPI_Unpack(buffer);
                        value=jsMPI_Unpack(buffer);
                        if(jsMPI_Type == jsMPI_Object)
                            Obj->Set(key, value);
                        else
                            ObjArr->Set(key, value);        
                    }

                    if(jsMPI_Type == jsMPI_Object)
                        return Obj;
                    else
                        return ObjArr;
                    break;
                default:
                    printf("Unknown type: %d %d %d\n", jsMPI_Type, buffer->position, result);
                    fflush(stdout);
            }
        }
				//********************************** jsMPI_HeadUnpack **************************************//
				Handle<Value> jsMPI_HeadUnpack( char *buffer, int *position, int *IsBcast)
				{
					int jsMPI_Type ;
					MPI_Unpack( buffer, BUFFER_SIZE, position, &jsMPI_Type, 1, MPI_INT, MPI_COMM_WORLD );
					switch ( jsMPI_Type )
					{
						case jsMPI_Fragment:
							int numfrags;
							//printf("Got datatype fragment\n");
              //fflush(stdout);
							MPI_Unpack( buffer, BUFFER_COUNT-1, position, &numfrags, 1, MPI_INT, MPI_COMM_WORLD );
							//printf("Got # fragment %d\n", numfrags);
              //fflush(stdout);
							if(numfrags == 0)
								*IsBcast = 0;

							return Integer::New( numfrags );
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
						{
							int KeyCount,i;
							MPI_Unpack(buffer, BUFFER_SIZE, position, &KeyCount, 1, MPI_INT, MPI_COMM_WORLD);
							Handle<Object> Obj = Object::New();
							Handle<Array> ObjArr = Array::New();
							Handle<Value> key;
							Handle<Value> value;
							for(i=0; i<KeyCount; i++)
							{
								key=jsMPI_HeadUnpack(buffer, position, IsBcast);
								value=jsMPI_HeadUnpack(buffer, position, IsBcast);
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
							break;
            default:
                printf("Unknown type: %d \n", jsMPI_Type);
                fflush(stdout);
					}
				}
				%>
        //****************************** MPI.Init() ****************************//
            Init = <%
            MPI_Init( 0, NULL );
            MPI_Comm_size( MPI_COMM_WORLD, &size );
            MPI_Comm_rank( MPI_COMM_WORLD, &rank );

            int MaxSize = 1024;
            MPI_Pack_size( 1, MPI_DOUBLE, MPI_COMM_WORLD, &jsMPI_Double_Size );
            MPI_Pack_size( 1, MPI_INT, MPI_COMM_WORLD, &jsMPI_Integer_Size );
            jsMPI_Overhead = jsMPI_Integer_Size * 2;
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
        
        /******************************* MPI.Pack_size() **************************** //
        Functions.Pack_size = <%
            int bufsize = 0;
            bufsize = MPI_Pack_size(args[0]);
            return Integer::New(bufsize);
        %>*/
        //****************************** MPI.Send() ****************************//
        Functions.Send = <%
            int sdst, stag=0;

            // Check arguments
            if ( args.Length() < 1 )
                return False();
            
            // Get destination        
            if ( args.Length() < 2 )
                return False();
            else
                sdst = args[1]->IntegerValue();
            
            // Get tag
            if ( args.Length() >= 3 )
                stag = args[2]->IntegerValue(); 
            else 
                stag = 0;

            // Pack object into buffer
            int position = 0, bcast_frags=0;
            fragment *buffer = new fragment;
            buffer->position = 0;
            buffer->next = 0;
            jsMPI_Pack( &buffer, args[0] );

            // Count fragments
            int numFrags = 1;
            fragment *thisFrag = buffer;
            while (thisFrag->next)
            {
                numFrags++;
                thisFrag = thisFrag->next;
            }

            // Send fragment header if necessary
            if ( numFrags > 1 )
            {
                char hdrbuf[16];
                int hdrpos = 0;
                MPI_Pack( &numFrags, 1, MPI_INT, hdrbuf, 16*sizeof(char), &hdrpos, MPI_COMM_WORLD );
                MPI_Send( hdrbuf, hdrpos, MPI_PACKED, sdst, stag, MPI_COMM_WORLD);
            }

            // Send fragments
            do
            {
                MPI_Send( buffer->data, buffer->position, MPI_PACKED, sdst, stag, MPI_COMM_WORLD);
                fragment *oldFrag = buffer;
                buffer = buffer->next;
                delete oldFrag;
            } while (buffer);

            return Undefined();
        %>
				// ****************************** MPI.Bcast() **************************** //
				Functions.Bcast = <%
						int bcaster=0;

						if(args.Length() < 1)
							return False();
						else
							bcaster = args[0]->IntegerValue();
					
            int position = 0, bcast_frags=0, IsBcast = 1;
						fragment *buffer = new fragment;
						buffer->position = 0;
						buffer->next = 0;
						if(bcaster == rank)
						{
								if(jsMPI_Pack_size(args[1]) > BUFFER_SIZE)
								{
									jsMPI_Pack( &buffer, args[1]);
									//printf("Needed to be fragmented %d\n", jsMPI_Pack_size(args[1]));
									//fflush(stdout);
									// Count fragments
									int numFrags = 0;
									fragment *thisFrag = buffer;
									while (thisFrag->next)
									{
											numFrags++;
											thisFrag = thisFrag->next;
									}
									
									// Send fragment header if necessary
									if ( numFrags > 0 )
									{
											char hdrbuf[32];
											int hdrpos = 0;
											MPI_Pack( (int *)&jsMPI_Fragment, 1, MPI_INT, hdrbuf, 32*sizeof(char), &hdrpos, MPI_COMM_WORLD);
											MPI_Pack( &numFrags, 1, MPI_INT, hdrbuf, 32*sizeof(char), &hdrpos, MPI_COMM_WORLD );
											MPI_Bcast( hdrbuf, hdrpos, MPI_PACKED, bcaster, MPI_COMM_WORLD);
											//printf("\n broadcasting header of size %d frags %d\n", hdrpos, numFrags);
											//fflush(stdout);
									}
									
									// Send fragments
									do
									{
											//printf("\n %d is broadcasting pieces \n", bcaster);
											//fflush(stdout);
											MPI_Bcast( buffer->data, buffer->position, MPI_PACKED, bcaster, MPI_COMM_WORLD);
											fragment *oldFrag = buffer;
											buffer = buffer->next;
											delete oldFrag;
									} while (buffer);
									return Undefined();
								}
								else
								{
									int position=0, numFrags=0;
									char tbuf[BUFFER_SIZE];
									char hdrbuf[HEAD_BUF_SIZE];
									int hdrpos = 0;

									MPI_Pack( (void *)&jsMPI_Fragment, 1, MPI_INT, hdrbuf, HEAD_BUF_SIZE, &hdrpos, MPI_COMM_WORLD);
									MPI_Pack( (void *)&numFrags, 1, MPI_INT, hdrbuf, HEAD_BUF_SIZE, &hdrpos, MPI_COMM_WORLD );
									
									//printf("\n broadcasting header of size %d with #of fragments=%d\n", hdrpos, numFrags);
									//fflush(stdout);
									
									MPI_Bcast( hdrbuf, hdrpos, MPI_PACKED, bcaster, MPI_COMM_WORLD);
									
									//printf("\n header broadcasted\n");
									//fflush(stdout);

									jsMPI_HeadPack(tbuf, &position, args[1]);
									MPI_Bcast( tbuf, position, MPI_PACKED, bcaster, MPI_COMM_WORLD);
									
									//printf("Broadcasted data of size %d\n", position);
									//fflush(stdout);
								}
						}
						else
						{
								Handle<Value> numfrags;
								int num;
								int position=0;
								char sbuf[HEAD_BUF_SIZE];
							
								//printf("\n Recieved Header from %d\n", bcaster);
								//fflush(stdout);
								
								MPI_Bcast( sbuf, HEAD_BUF_SIZE, MPI_PACKED, bcaster, MPI_COMM_WORLD );
								
								//printf("M here %d\n", rank);
								//fflush(sTdout);
								
								numfrags = jsMPI_HeadUnpack(sbuf, &position, &IsBcast);
								num=numfrags->Int32Value();
								//printf("IsBcast=%d # of fragments %d\n", IsBcast, num);
								//fflush(stdout);
								if(IsBcast) // It was 1, If it became 0 means it wasnt a fragmented message
								{
										int i=0;
										for(i=0;i<num+1;i++)
										{
												//printf("Transmitting fragmented data\n");
												//fflush(stdout);
												MPI_Bcast( buffer->data, BUFFER_SIZE, MPI_PACKED, bcaster, MPI_COMM_WORLD );
								
												if (i != num)
												{
														fragment *newBuffer = new fragment;
														newBuffer->position = 0;
														newBuffer->next = buffer;
														buffer = newBuffer;
												}
										}
										IsBcast = 0;
										numfrags = jsMPI_Unpack(buffer);
								}
								else
								{
										position = 0;
										char rbuf[BUFFER_SIZE];
										//printf("Recieving broadcasted data\n");
										//fflush(stdout);
										MPI_Bcast( rbuf, BUFFER_SIZE, MPI_PACKED, bcaster, MPI_COMM_WORLD );
										//printf("Recieved broadcasted data\n");
										//fflush(stdout);
										numfrags = jsMPI_HeadUnpack(rbuf, &position, &IsBcast);
								}

								delete buffer;
								//delete tbuf;
								return numfrags;
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

            // Receive message                
            fragment *buffer = new fragment;
            buffer->position = 0;
            buffer->next = 0;
            int position = 0;
            int size;
            MPI_Recv( buffer->data, BUFFER_SIZE, MPI_PACKED, src, rtag, MPI_COMM_WORLD, &rstatus );

            // Check for fragmentation
            MPI_Get_count( &rstatus, MPI_PACKED, &size );
            if (size == jsMPI_Integer_Size)
            {
                int zero = 0;
                int numfrags;
                MPI_Unpack( buffer->data, BUFFER_SIZE, &zero, &numfrags, 1, MPI_INT, MPI_COMM_WORLD );

                // Get fragments
                for(int i=0; i<numfrags; i++)
                {
                    MPI_Recv( buffer->data, BUFFER_SIZE, MPI_PACKED, src, rtag, MPI_COMM_WORLD, &rstatus );
                    MPI_Get_count( &rstatus, MPI_PACKED, &size );

                    if (i != numfrags-1)
                    {
                        fragment *newBuffer = new fragment;
                        newBuffer->position = 0;
                        newBuffer->next = buffer;
                        buffer = newBuffer;
                    }
                }

            }
               
            // Unpack object
            last_rcv_tag = rstatus.MPI_TAG;
            last_rcv_source = rstatus.MPI_SOURCE;
            Handle<Value> val=jsMPI_Unpack(buffer);
            delete buffer;

            return val;
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
        
        //****************************** MPI.TSend() ****************************//
/*
 *        Functions.TSend = <%
 *            int sdst, stag=0;
 *
 *            // Check arguments
 *            if ( args.Length() < 1 )
 *                return False();
 *            
 *            // Get destination        
 *            if ( args.Length() < 2 )
 *                return False();
 *            else
 *                sdst = args[1]->IntegerValue();
 *            
 *            // Get tag
 *            if ( args.Length() >= 3 )
 *                stag = args[2]->IntegerValue(); 
 *            else 
 *                stag = 0;
 *
 *            // Pack object into buffer
 *            int position = 0, bcast_frags=0;
 *            char *tbuf;
 *            tbuf =  new char[BUFFER_HSIZE];
 *            jsMPI_HeadPack( tbuf, &position, args[0] );
 *
 *            MPI_Send( tbuf, position, MPI_PACKED, sdst, stag, MPI_COMM_WORLD);
 *            return Undefined();
 *        %>
 *        /[>***************************** MPI.TRecv() ***************************<]/
 *        Functions.TRecv = <%
 *            int src,rtag, retval=0;
 *            if ( args.Length() < 1 )
 *            {
 *                src = MPI_ANY_SOURCE;
 *                rtag = MPI_ANY_TAG;
 *            }
 *            else if (args.Length() == 1)
 *            {
 *                src = args[0]->IntegerValue();
 *                rtag = MPI_ANY_TAG;
 *            }
 *            else if (args.Length() == 2)        
 *            {
 *                src = args[0]->IntegerValue();
 *                rtag = args[1]->IntegerValue();
 *            }
 *
 *            // Receive message                
 *            char *tbuf;
 *            tbuf =  new char[BUFFER_HSIZE];
 *            int position = 0;
 *            int size;
 *            MPI_Recv( tbuf, BUFFER_HSIZE, MPI_PACKED, src, rtag, MPI_COMM_WORLD, &rstatus );
 *
 *               
 *            // Unpack object
 *            last_rcv_tag = rstatus.MPI_TAG;
 *            last_rcv_source = rstatus.MPI_SOURCE;
 *            int IsBcast = 0;
 *            Handle<Value> val=jsMPI_HeadUnpack(tbuf, &position, &IsBcast);
 *            //delete buffer;
 *
 *            return val;
 *        %>
 */
        
            Export();
}
