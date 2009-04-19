#include <v8.h>
#include <cstdio>
#include <cstdlib>
#include <unistd.h>
#include <sys/stat.h>
#include <time.h>
#include "script-reference.h"
#include "script-plugin.h"

using namespace v8;

Handle<String> ReadFile( const char *name );
bool ExecuteString( Handle<String> source, Handle<Value> name, Handle<Value>& );
void ReportException( TryCatch* try_catch );

// Expose argc, argv
int global_argc;
char **global_argv;

// Main context
Persistent<Context> context;

// Script file info
struct stat script_info;

int main(int argc, char* argv[]) 
{
    HandleScope handle_scope;
    char *filename;
    Handle<String>filehandle;

    global_argc = argc;
    global_argv = argv;

    // Check command line 
    V8::SetFlagsFromCommandLine( &argc, argv, true );
    if ( argc < 2 )
    {
        printf( "usage: %s <script>\n", argv[0] );
        exit( 0 );
    }

    // Set up script
    Handle<ObjectTemplate> global = ObjectTemplate::New();
    global->Set( String::New( "import" ), FunctionTemplate::New( Import ) );
    Handle<Context> local_context = Context::New( NULL, global );
    context = Persistent<Context>::New(local_context);
    Context::Scope context_scope( local_context );

    // Read source
    filename = argv[1];
    filehandle = String::New( filename );
    Handle<String> source = ReadFile( filename );
    if ( source.IsEmpty() )
    {
        printf( "Error reading '%s'\n", filename );
        return 1;
    }
    
    // Execute
    Handle<Value> Test;
    if ( !ExecuteString( source, filehandle, Test ) )
        return 1;

    // Clean up
    FlushCppClasses();
    CleanupPlugins();
    context.Dispose();
}

// Reads a file into a v8 string.
Handle<String> ReadFile( const char *name )
{
    // Get script information
    int file_exists = stat( name, &script_info );
    if ( file_exists == -1 )
        return Handle<String>();

    FILE* file = fopen( name, "rb" );

    // Check for null file
    if (file == NULL)
        return Handle<String>();

    // Get file size
    fseek( file, 0, SEEK_END );
    int size = ftell( file );
    rewind( file );

    // Read file
    char* chars = new char[size + 1];
    chars[size] = '\0';
    for (int i = 0; i < size;)
    {
        int read = fread( &chars[i], 1, size - i, file );
        i += read;
    }
    fclose( file );

    // Export v8 string
    Handle<String> result = String::New(chars, size);
    delete[] chars;

    return result;
}

// Executes a string within the current v8 context.
bool ExecuteString( Handle<String> source, Handle<Value> name, Handle<Value>& output )
{
    HandleScope handle_scope;
    TryCatch try_catch;

    // Compile script
    Handle<Script> script = Script::Compile( source, name );

    if ( script.IsEmpty() )
    {
        ReportException( &try_catch );
        return false;
    }

    // Run script
    Handle<Value> result = script->Run();
    if ( result.IsEmpty() )
    {
        ReportException( &try_catch );
        return false;
    }

    output = result;
    return true;
}

void ReportException( TryCatch* try_catch )
{
    HandleScope handle_scope;
    String::Utf8Value exception( try_catch->Exception() );
    Handle<Message> message = try_catch->Message();
    int start, end;

    // Check for empty error
    if ( message.IsEmpty() )
        printf( "%s\n", *exception );

    // Check for error on source
    else
    {
        String::Utf8Value sourceline( message->GetSourceLine() );
        printf( "Error on at line %d: %s where\n", message->GetLineNumber(), *exception );
        printf( "    %s\n", *sourceline );
        printf( "    " );
        start = message->GetStartColumn();
        end = message->GetEndColumn();
        for ( int i=0; i<start; i++ )
            printf( " " );
        for ( int i=start; i<end; i++ )
            printf( "^" );
        printf("\n");
    }
}
