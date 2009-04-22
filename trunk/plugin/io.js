import("cpp");

io = new cpp.Plugin("io");
with (io)
{
    Include("<stdio.h>");
    Include("<string.h>");
    Include("<unistd.h>");
    Include("<sys/stat.h>");
    Include("<time.h>");
    Include("<pwd.h>");
    Include("<grp.h>");

    Extra = <%
        enum
        {
            JSFILE_BIG_ENDIAN,
            JSFILE_LITTLE_ENDIAN
        };

        extern int global_argc;
        extern char **global_argv;
        extern Persistent<Context> context;

        Persistent<Array> jsArgs;
        bool ExecuteString( Handle<String> source, Handle<Value> name, Handle<Value>& );
        Handle<String> ReadFile( const char *name );
        void SetDateTime( Handle<Date> d, time_t t );

        const char *JSFN_CHOMP = "function () { return this.replace(/(\\n|\\r)+$/, '') }";

        Handle<Value> jsFileLoad ( const Arguments& args )
        {
            bool badArgument = false;
            if ( args.Length() == 0 )
                badArgument = true;
            if ( !args[0]->IsString() )
                badArgument = true;
            if ( badArgument )
                return ThrowException( String::New( "Expected filename" ) );

            // Load file into string
            String::Utf8Value Filename( args[0]->ToString() );
            Handle<String> contents = ReadFile( *Filename );
            if ( contents.IsEmpty() )
                return ThrowException( String::New( "Error reading file" ) );

            return contents;
        }

        Handle<Value> jsFileExists ( const Arguments& args )
        {
            bool badArgument = false;
            if ( args.Length() == 0 )
                badArgument = true;
            if ( !args[0]->IsString() )
                badArgument = true;
            if ( badArgument )
                return ThrowException( String::New( "Expected filename" ) );

            // Check file's existence with access()
            String::Utf8Value Filename( args[0]->ToString() );
            if ( access( *Filename, F_OK ) == 0 )
                return True();
            else
                return False();
        };

        Handle<Value> jsFileInfo ( const Arguments& args )
        {
            bool badArgument = false;
            if ( args.Length() == 0 )
                badArgument = true;
            if ( !args[0]->IsString() )
                badArgument = true;
            if ( badArgument )
                return ThrowException( String::New( "Expected filename" ) );

            // Check file's existence with access()
            struct stat cInfo;
            String::Utf8Value cFilename( args[0]->ToString() );
            int result = stat( *cFilename, &cInfo );
            if ( result == -1 )
                return Null();
            int mode = cInfo.st_mode;

            // File type
            Handle<Object> Info = Object::New();
            Handle<String> TypeStr = String::New("Type");
            if ( S_ISDIR(mode) )
                Info->Set( TypeStr, String::New("Dir") );
            else if ( S_ISCHR(mode) )
                Info->Set( TypeStr, String::New("Character device") );
            else if ( S_ISBLK(mode) )
                Info->Set( TypeStr, String::New("Block device") );
            else if ( S_ISREG(mode) )
                Info->Set( TypeStr, String::New("File") );
            else if ( S_ISFIFO(mode) )
                Info->Set( TypeStr, String::New("Pipe") );
            else if ( S_ISLNK(mode) )
                Info->Set( TypeStr, String::New("Link") );
            else if ( S_ISSOCK(mode) )
                Info->Set( TypeStr, String::New("Socket") );
            else
                Info->Set( TypeStr, String::New("Unknown") );

            // Size
            Info->Set( String::New("Size"), Integer::New( (int)cInfo.st_size ) );
            
            // User
            struct passwd *pwd = getpwuid(cInfo.st_uid);
            if ( pwd )
                Info->Set( String::New("User"), String::New( pwd->pw_name ) );

            // Group
            struct group *grp = getgrgid(cInfo.st_gid);
            if ( grp )
                Info->Set( String::New("Group"), String::New( grp->gr_name ) );

            // Last accessed
            Info->Set( String::New("Accessed"), Date::New( (double)cInfo.st_atime * 1000.0 ) );

            // Last modified
            Info->Set( String::New("Modified"), Date::New( (double)cInfo.st_mtime * 1000.0 ) );

            // Last status changed
            Info->Set( String::New("Changed"), Date::New( (double)cInfo.st_ctime * 1000.0 ) );

            // Permissions
            char perm[4];
            int pperm = 0;
            Handle<Object> Permissions = Object::New();
            Info->Set( String::New("Permissions"), Permissions );

            // Owner
            if ( mode & S_IRUSR )
            {
                perm[pperm] = 'r';
                pperm++;
            }
            if ( mode & S_IWUSR )
            {
                perm[pperm] = 'w';
                pperm++;
            }
            if ( mode & S_IXUSR )
            {
                perm[pperm] = 'x';
                pperm++;
            }
            perm[pperm] = '\0';
            Permissions->Set( String::New("Owner"), String::New( perm, pperm ) );

            // Group
            pperm = 0;
            if ( mode & S_IRGRP )
            {
                perm[pperm] = 'r';
                pperm++;
            }
            if ( mode & S_IWGRP )
            {
                perm[pperm] = 'w';
                pperm++;
            }
            if ( mode & S_IXGRP )
            {
                perm[pperm] = 'x';
                pperm++;
            }
            perm[pperm] = '\0';
            Permissions->Set( String::New("Group"), String::New( perm, pperm ) );

            // Others
            pperm = 0;
            if ( mode & S_IROTH )
            {
                perm[pperm] = 'r';
                pperm++;
            }
            if ( mode & S_IWOTH )
            {
                perm[pperm] = 'w';
                pperm++;
            }
            if ( mode & S_IXOTH )
            {
                perm[pperm] = 'x';
                pperm++;
            }
            perm[pperm] = '\0';
            Permissions->Set( String::New("Others"), String::New( perm, pperm ) );

            return Info;
        };


        Handle<Value> jsFprintf( FILE *f, const Arguments& args )
        {
            String::Utf8Value format_utf8( args[0] );
            char *format_str = (char *)*format_utf8;
            char *c = format_str;
            char arg_str[16];
            char *arg_ptr;
            int arg_index = 1;
            bool keepgoing;
            String::Utf8Value arg_utf8( args[arg_index]->ToString() );
    
            while ( *c )
            {
                HandleScope handle_scope;
    
                // Check for arguments
                if ( *c == '%' )
                {
                    arg_ptr = arg_str;
                    keepgoing = true;
                    do
                    {
                        // Check for terminating flag
                        *arg_ptr = *c;
                        arg_ptr++;
                        c++;
                        switch( *c )
                        {
                            case '%':
                                putc( '%', stdout );
                                keepgoing = false;
                                break;
    
                            case 'c':
                                *arg_ptr = *c;
                                arg_ptr++;
                                c++;
                                *arg_ptr = 0;
                                if ( args[arg_index]->IsNumber() )
                                    fprintf( f, arg_str, (char)args[arg_index]->ToInteger()->Value() );
                                else
                                {
    
                                    char *arg_c = *arg_utf8;
                                    fprintf( f, arg_str, arg_c[0] );
                                }
                                keepgoing = false;
                                break;
    
                            case 'd':
                            case 'i':
                                *arg_ptr = *c;
                                arg_ptr++;
                                c++;
    
                                *arg_ptr = 0;
                                fprintf( f, arg_str, (int)args[arg_index]->ToInteger()->Value() );
                                keepgoing = false;
                                break;
    
                            case 's':
                                *arg_ptr = *c;
                                arg_ptr++;
                                c++;
    
                                *arg_ptr = 0;
                                fprintf( f, arg_str, *arg_utf8 );
                                keepgoing = false;
                                break;
    
                            case 'u':
                            case 'x':
                            case 'X':
                            case 'o':
                                *arg_ptr = *c;
                                arg_ptr++;
                                c++;
    
                                *arg_ptr = 0;
                                fprintf( f, arg_str, (unsigned int)args[arg_index]->ToInteger()->Value() );
                                keepgoing = false;
                                break;
    
                            case 'e':
                            case 'E':
                            case 'f':
                            case 'F':
                            case 'g':
                            case 'G':
                                *arg_ptr = *c;
                                arg_ptr++;
                                c++;
    
                                *arg_ptr = 0;
                                fprintf( f, arg_str, (double)args[arg_index]->ToNumber()->Value() );
                                keepgoing = false;
                                break;
    
                            // Not supported...
                            case 'n':
                            case 'p':
                            default:
                                break;
                                //c++;
                                
                        }
    
                    } while (keepgoing && *c);
                    arg_index++;
                    c--;
                }
                else putc( *c, stdout );
    
                c++;
            }

            return Undefined();
        }
    %>

    // *COMMAND LINE*
    Init = <%
        jsArgs = Persistent<Array>::New( Array::New() );
        for ( int i=0; i<global_argc; i++ )
            jsArgs->Set( Int32::New(i), String::New(global_argv[i]) );
        obj->Set( String::New( "Args" ), jsArgs );

        // Add chomp
        Handle<Value> jsChomp;
        ExecuteString( String::New( JSFN_CHOMP ), String::New( "Chomp" ), jsChomp );
        Handle<Value> StrValue = context->Global()->Get( String::New("String") );
        Handle<Object> StrProto = StrValue->ToObject()->Get( String::New("prototype") )->ToObject();        
        StrProto->Set( String::New("Chomp"), jsChomp );

        // Static functions - add to cpp!!
        Handle<Object> jsFileObj = obj->Get( String::New("File") )->ToObject();
        jsFileObj->Set( String::New( "Load" ), FunctionTemplate::New( jsFileLoad )->GetFunction() );
        jsFileObj->Set( String::New( "Exists" ), FunctionTemplate::New( jsFileExists )->GetFunction() );
        jsFileObj->Set( String::New( "Info" ), FunctionTemplate::New( jsFileInfo )->GetFunction() );
    %>

    Exit = <%
        jsArgs.Dispose();
        jsArgs.Clear();
    %>

    // *PRINTING FUNCTIONS*
    Functions.print = <%
        bool first = true;
        for (int i = 0; i < args.Length(); i++)
        {
            HandleScope handle_scope;

            if ( first )
                first = false;
            else
						{
                printf(" ");
						}
        
            String::Utf8Value str( args[i] );
            fputs( *str, stdout );
        }
        fputc( '\n', stdout );
        fflush( stdout );
        
        return Undefined();
    %>;

    Functions.printf = <%
        return jsFprintf( stdout, args );
    %>;

    // *FILE HANDLING*
    Classes.File = new io.Class( "File", 2 );
    with( Classes.File )
    {
        Constructor = <%
            Handle<Value> OpenArgs[2];

            // Static functions - need to add to cpp!
            

            // Check arguments - pass to open if necessary
            if ( args.Length() > 0 )
            {
                Handle<Function> OpenFn = Handle<Function>::Cast( args.This()->Get( String::New( "Open" ) ) );

                // Check arguments
                OpenArgs[0] = args[0];
                if ( args.Length() > 1 )
                    OpenArgs[1] = args[1];
                else
                {
                    Handle<Value> Mode = String::New( "r" );
                    OpenArgs[1] = Mode;
                }

                // Call "open"
                OpenFn->Call( args.This(), 2, OpenArgs );                
            }
            else
            {
                args.This()->SetInternalField( 0, External::New( NULL ) );
                args.This()->SetInternalField( 1, False() );
            }

            return Undefined();
        %>

        Methods.Open = <%
            Handle<String> Filename;
            Handle<String> Mode;

            // Check arguments
            if ( args.Length() < 1 )
                return ThrowException( String::New( "Expected filename" ) );
            else if ( !args[0]->IsString() )
                return ThrowException( String::New( "Expected string for filename" ) );

            Filename = args[0]->ToString();
            if ( args.Length() == 1 )
                Mode = String::New("r");
            else if ( args[1]->IsString() )
                Mode = args[1]->ToString();
            else
                return ThrowException( String::New( "Expected string for mode" ) );
                
            String::Utf8Value cFilename( Filename );
            String::Utf8Value cMode( Mode );

            // Open file
            FILE *f = fopen( *cFilename, *cMode );
            args.This()->SetInternalField( 0, External::New( f ) );

            // Set isBinary flag
            args.This()->SetInternalField( 1, False() );
            if ( f != NULL )
                if ( memchr( *cFilename, 'b', strlen(*cFilename) ) != NULL )
                    args.This()->SetInternalField( 1, True() );

            return Undefined();
        %>

        Methods.Close = <%
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            if ( f != NULL )
            {
                fclose( f );
                args.This()->SetInternalField( 0, External::New( NULL ) );
            }

            return Undefined();
        %>

        Getters.IsEof = <%
            FILE *f = (FILE *)Handle<External>::Cast( info.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return True();
            else
                return Boolean::New( (bool)feof( f ) );
        %>

        Methods.IsOpen = <%
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            
            return Boolean::New( f != NULL );
        %>

        Methods.Write = <%
            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Int32::New(0);

            // Print arguments to file
            int totalWritten = 0;
            bool first = true;
            bool isBinary = args.This()->GetInternalField( 1 )->BooleanValue();
            for ( int i=0; i<args.Length(); i++ )
            {
                HandleScope handle_scope;
        
                // Add comma separators if not in binary mode
                if ( first )
                    first = false;
                else if ( !isBinary )
                    totalWritten += fprintf( f, " " );

                String::Utf8Value cArg( args[i]->ToString() );
                totalWritten += fprintf( f, "%s", *cArg );
            }

            // Print newline if not in binary mode
            if ( !isBinary )
                totalWritten += fprintf( f, "\n" );

            return Int32::New( totalWritten );
        %>

        Methods.Read = <%
            bool isEOF = false;

            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Int32::New(0);

            int size = 0;
            if ( args.Length() > 0 )
            {
                // Integer argument - read x characters
                if ( args[0]->IsInt32() )
                    size = args[0]->Int32Value();
                if ( size == 0 )
                    return Null();
            }
            else
            {
                int c;

                // No argument - read line
                int currentPosition = ftell(f);
                for(; !feof(f) && c != '\n'; size++ )
                    c = fgetc(f);

                if ( c == EOF && size == 1 )
                    return String::New("");
                else
                    if ( fgetc(f) == EOF )
                        isEOF = true;

                fseek( f, currentPosition, SEEK_SET );
            }

            // Read bytes
            char *bytes = new char[size+1];
            int loaded;
            for ( loaded=0; loaded<size && !feof(f); )
                loaded += fread( &bytes[loaded], 1, size-loaded, f );
            bytes[loaded] = '\0';

            // Real end of file check
            if ( isEOF )
                fgetc(f);

            Handle<String> Result = String::New(bytes, loaded);
            delete[] bytes;
            return Result;
        %>

        Getters.Position = <%
            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( info.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Null();

            return Int32::New( ftell(f) );
        %>

        Setters.Position = <%
            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( info.This()->GetInternalField( 0 ) )->Value();
            if ( f != NULL )
            {
                int position = value->IntegerValue();
                if ( position < 0 )
                    fseek( f, -position, SEEK_END );
                else
                    fseek( f, position, SEEK_SET );
            }
        %>

        Getters.Size = <%
            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( info.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Null();

            int currentPosition = ftell(f);
            fseek( f, 0, SEEK_END );
            int FileSize = ftell(f);
            fseek( f, currentPosition, SEEK_SET );

            return Integer::New( FileSize );
        %>

        Methods.Pack = <%
            // Check arguments
            if ( args.Length() == 0 )
                return ThrowException( String::New( "Expected format" ) );
            else if ( !args[0]->IsString() )
                return ThrowException( String::New( "Format must be string" ) );

            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Undefined();

            // Pack data into file
            Handle<Value> Output = Null();
            int currentIndex = 0;
            int currentArg = 1;
            int currentEndian = JSFILE_LITTLE_ENDIAN;
            String::Utf8Value Format( args[0]->ToString() );
            char *cFormat = *Format;
            for ( int i=0; i<Format.length(); i++ )
            { 
                int intValue;
                short shortValue;
                char charValue;
                unsigned int uintValue;
                unsigned short ushortValue;
                unsigned char ucharValue;
                float floatValue;
                double doubleValue;
                long long int longlongValue;
                char *strValue;
                int numRepeat;

                // Check for repeats
                char buf[16] = "";
                int j = 0;
                for ( j=0; cFormat[i] >= '0' && cFormat[i] <= '9'; j++ )
                {
                    buf[j] = cFormat[i];
                    i++;
                }
                buf[j] = '\0';
                int numBytes = sscanf (buf, "%d", &numRepeat);
                if ( numBytes <= 0 )
                    numRepeat = 1;

                // Check variable type
                while ( numRepeat > 0 )
                {
                    if ( currentArg == args.Length() )
                        return ThrowException( String::New( "Not enough arguments" ) );

                    String::Utf8Value CharArg( args[currentArg]->ToString() );

                    numRepeat--;
                    switch( cFormat[i] )
                    {
                        case 'x':
                            fseek( f, 1, SEEK_CUR );
                            break;

                        case '!':
                        case '>':
                            currentEndian = JSFILE_BIG_ENDIAN;
                            break;
        
                        case '=':
                        case '<':
                            currentEndian = JSFILE_LITTLE_ENDIAN;
                            break;
    
                        case 'i':
                        case 'l':
                            intValue = args[currentArg]->Int32Value();
                            fwrite( &intValue, 1, sizeof(int), f );
                            break;
    
                        case 'I':
                        case 'L':
                            uintValue = args[currentArg]->Uint32Value();
                            fwrite( &intValue, 1, sizeof(unsigned int), f );
                            break;
    
                        case 'h':
                            shortValue = (short)args[currentArg]->Int32Value();
                            fwrite( &shortValue, 1, sizeof(short), f );
                            break;
    
                        case 'H':
                            ushortValue = (unsigned short)args[currentArg]->Uint32Value();
                            fwrite( &ushortValue, 1, sizeof(unsigned short), f );
                            break;
    
                        case 'b':
                            charValue = (char)args[currentArg]->Int32Value();
                            fwrite( &charValue, 1, sizeof(char), f );
                            break;

                        case 'c':
                            char *cCharArg = *CharArg;
                            fwrite( cCharArg, 1, sizeof(char), f );
                            break;
    
                        case 'B':
                            ucharValue = (unsigned char)args[currentArg]->Uint32Value();
                            fwrite( &ucharValue, 1, sizeof(unsigned char), f );
                            break;
    
                        case 'f':
                            floatValue = (float)args[currentArg]->NumberValue();
                            fwrite( &floatValue, 1, sizeof(float), f );
                            break;
    
                        case 'd':
                            doubleValue = args[currentArg]->NumberValue();
                            fwrite( &doubleValue, 1, sizeof(double), f );
                            break;

                        case 'q':
                            longlongValue = args[currentArg]->IntegerValue();
                            fwrite( &longlongValue, 1, sizeof(long long int), f );
                            break;

                        case 's':
                            String::Utf8Value cStrArg( args[currentArg]->ToString() );
                            int numBytesToCopy = cStrArg.length();
                            if ( numRepeat+1 < numBytesToCopy )
                                numBytesToCopy = numRepeat+1;
                            fwrite( *cStrArg, 1, numBytesToCopy, f );
                            numRepeat = 0;
                            break;
                    }
                    currentArg++;
                }
            }

            return Undefined();
        %>

        Methods.Unpack = <%
            // Check arguments
            if ( args.Length() == 0 )
                return ThrowException( String::New( "Expected format" ) );
            else if ( !args[0]->IsString() )
                return ThrowException( String::New( "Format must be string" ) );

            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Undefined();

            // Unpack data from file
            Handle<Value> Output = Null();
            int currentIndex = 0;
            int currentEndian = JSFILE_LITTLE_ENDIAN;
            String::Utf8Value Format( args[0]->ToString() );
            char *cFormat = *Format;
            for ( int i=0; i<Format.length(); i++ )
            {
                int intValue;
                short shortValue;
                char charValue;
                unsigned int uintValue;
                unsigned short ushortValue;
                unsigned char ucharValue;
                float floatValue;
                double doubleValue;
                char *strValue;
                long long int longlongValue;
                int numRepeat;
                Handle<Value> Result;

                // Check for repeats
                char buf[16] = "";
                int j = 0;
                for ( j=0; cFormat[i] >= '0' && cFormat[i] <= '9'; j++ )
                {
                    buf[j] = cFormat[i];
                    i++;
                }
                buf[j] = '\0';
                int numBytes = sscanf (buf, "%d", &numRepeat);
                if ( numBytes <= 0 )
                    numRepeat = 1;

                // Check variable type
                while ( numRepeat > 0 )
                {
                    numRepeat--;
                    Result = Null();

                    switch( cFormat[i] )
                    {
                        case 'x':
                            fseek( f, 1, SEEK_CUR );
                            break;

                        case '!':
                        case '>':
                            currentEndian = JSFILE_BIG_ENDIAN;
                            break;
        
                        case '=':
                        case '<':
                            currentEndian = JSFILE_LITTLE_ENDIAN;
                            break;
    
                        case 'i':
                        case 'l':
                            numBytes = fread( &intValue, 1, sizeof(int), f );
                            if ( numBytes == sizeof(int) )
                                Result = Int32::New( intValue );
                            break;
    
                        case 'I':
                        case 'L':
                            numBytes = fread( &uintValue, 1, sizeof(unsigned int), f );
                            if ( numBytes == sizeof(unsigned int) )
                                Result = Uint32::New( uintValue );
                            break;
    
                        case 'h':
                            numBytes = fread( &shortValue, 1, sizeof(short), f );
                            if ( numBytes == sizeof(short) )
                                Result = Int32::New( (int)shortValue );
                            break;
    
                        case 'H':
                            numBytes = fread( &ushortValue, 1, sizeof(unsigned short), f );
                            if ( numBytes == sizeof(unsigned short) )
                                Result = Uint32::New( (unsigned int)ushortValue );
                            break;
    
                        case 'b':
                        case 'c':
                            numBytes = fread( &charValue, 1, sizeof(char), f );
                            if ( numBytes == sizeof(char) )
                                if ( cFormat[i] == 'b' )
                                    Result = Int32::New( (int)charValue );
                                else
                                    Result = String::New( &charValue, 1 );
                            break;
    
                        case 'B':
                            numBytes = fread( &ucharValue, 1, sizeof(unsigned char), f );
                            if ( numBytes == sizeof(unsigned char) )
                                Result = Uint32::New( (unsigned int)ucharValue );
                            break;
    
                        case 'f':
                            numBytes = fread( &floatValue, 1, sizeof(float), f );
                            if ( numBytes == sizeof(float) )
                                Result = Number::New( (double)floatValue );
                            break;
    
                        case 'd':
                            numBytes = fread( &doubleValue, 1, sizeof(double), f );
                            if ( numBytes = sizeof(double) )
                                Result = Number::New( doubleValue );
                            break;

                        case 'q':
                            numBytes = fread( &longlongValue, 1, sizeof(long long int), f );
                            if ( numBytes == sizeof(long long int) )
                                Result = Integer::New( longlongValue );
                            break;

                        case 's':
                            strValue = new char[numRepeat+2];
                            strValue[numRepeat+1] = '\0';
                            numBytes = fread( strValue, 1, numRepeat+1, f );
                            if ( numBytes == numRepeat+1 )
                                Result = String::New( strValue, numRepeat+1 );
                            delete[] strValue;
                            numRepeat = 0;
                            break;
                    }

                    if ( Result == Null() )
                        return ThrowException( String::New( "Error reading file" ) );

                    if ( Output->IsNull() )
                        Output = Result;
                    else if ( !Output->IsArray() )
                    {
                        Handle<Array> NewArray = Array::New();
                        NewArray->Set( Int32::New( 0 ), Output );
                        NewArray->Set( Int32::New( 1 ), Result );
                        Output = NewArray;
                        currentIndex = 2;
                    }
                    else
                    {
                        Output->ToObject()->Set( Int32::New( currentIndex ), Result );
                        currentIndex++;
                    }
                }
            }

            return Output;
        %>

        Methods.Printf = <%
            // Check for open file
            FILE *f = (FILE *)Handle<External>::Cast( args.This()->GetInternalField( 0 ) )->Value();
            if ( f == NULL )
                return Undefined();

            return jsFprintf( f, args );
        %>
    }

    Export();
}
