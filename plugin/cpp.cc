#include <v8.h>
#include <cstdio>
#include <string>
#include <map>
#include <unistd.h>
#include <sys/wait.h> 
#include <sys/stat.h> 
#include <dlfcn.h>
#include "../src/v8tools.h"

#define OUTPUT_FILENAME false

enum
{
    JS_SRC_PLUGIN,
    JS_SRC_EMBED
};

typedef struct loadedKernel_s
{
    void *obj;
    Persistent<Function> fn;
} loadedKernel;

using namespace v8;

extern "C" Handle<Value> LoadJSFunctions( Handle<Object>obj );
extern "C" Handle<Value> UnloadJSFunctions( Handle<Object>obj );

extern int global_argc;
extern char **global_argv;

// Javascript API
Handle<Value> jsPlugin( const Arguments& args );
Handle<Value> jsInclude( const Arguments& args );
Handle<Value> jsExport( const Arguments& args );
Handle<Value> jsClass( const Arguments& args );
Handle<Value> jsLink( const Arguments& args );
Handle<Value> jsEmbed( const Arguments& args );

// Plugin building functions
Handle<Value> buildPlugin( char *filename, char *modname, Handle<Object> obj, Handle<String>& OutfileStr, int srcType );
Handle<Value> generatePlugin( const Arguments& args, char **filename, int srcType );
int reportError( int lineNumber, const char *msg, Handle<Object>SectionData );

// Section dictionary functions
int countNewLines( const char*text );
void ContinueSection( Handle<Object>Obj, const char*body  );
void StartSection( Handle<Object>Obj, const char*body, const char*SectionType, const char*SectionId );
void StartClassSection( Handle<Object>Obj, const char*body, const char*SectionType, const char*SectionId, const char*ClassId );

// Code generation functions
void ExportIncludes( Handle<Object> CodeData, Handle<Object> Parent, int srcType );
void ExportCode( Handle<Object> CodeData, Handle<Object> Parent, char *CodeName, char *CodeNickname );
void ExportGroup( Handle<Object> CodeData, Handle<Object> Parent, const char *GroupTemplate, const char *GroupNameTemplate, char *GroupName, char *GroupNickName );
void ExportConstructor( Handle<Object> CodeData, Handle<Object> ClassObj );
void ExportSection( Handle<Object> CodeData, Handle<Object> Parent, const char *SectionTemplate, const char *SectionNameTemplate, char *SectionName, char *SectionNickname, bool ReturnUndefined=false );
void ExportClass( Handle<Object> CodeData, Handle<Object> ClassObj );
void ExportFunctionHeaders( Handle<Object> CodeData, Handle<Object> Parent );
void ExportClassHeaders( Handle<Object> CodeData, Handle<Object> ClassParent );
void ExportSingleClassHeader( Handle<Object> CodeData, Handle<Object> ClassObj );
void ExportClass( Handle<Object> CodeData, Handle<Object> ClassObj );

// Extern from main program... needed for now
bool ExecuteString( Handle<String> source, Handle<Value> name, Handle<Value>& );
extern Persistent<Context> context;
extern struct stat script_info;

// Class symbol templates
const char *PT_FUNCTION_NAME    = "__js_function_%s_%s__";
const char *PT_METHOD_NAME      = "__js_method_%s_%s__";
const char *PT_CONSTRUCTOR_NAME = "__js_constructor_%s__";
const char *PT_DESTRUCTOR_NAME  = "__js_destructor_%s__";
const char *PT_GETTER_NAME      = "__js_getter_%s_%s__";
const char *PT_SETTER_NAME      = "__js_setter_%s_%s__";
const char *PT_NAMED_GETTER_NAME= "__js_named_getter_%s__";
const char *PT_NAMED_SETTER_NAME= "__js_named_setter_%s__";
const char *PT_INDEX_GETTER_NAME= "__js_indexed_getter_%s__";
const char *PT_INDEX_SETTER_NAME= "__js_indexed_setter_%s__";
const char *PT_INIT_NAME        = "__js_init_%s__";
const char *PT_EXIT_NAME        = "__js_exit_%s__";
const char *PT_PLUGIN_FILE      = "lib/lib%s.so";
const char *PT_EMBED_FILE    = "cache/k%s.so";

// C++ declaration templates
const char *PT_INCLUDE_V8       = "#include <v8.h>\n";
const char *PT_INCLUDE_REF      = "#include \"../src/script-reference.h\"\n";
const char *PT_INCLUDE_START    = "#include ";
const char *PT_USING_V8         = "using namespace v8;\n";
const char *PT_DECLARE_LOAD     = "extern \"C\" Handle<Value> LoadJSFunctions( Handle<Object>obj );\n";
const char *PT_DECLARE_UNLOAD   = "extern \"C\" Handle<Value> UnloadJSFunctions( Handle<Object>obj );\n";
const char *PT_DECLARE_EMBED    = "extern \"C\" Handle<Value> JSKernel( Arguments& args );\n";

// C++ code templates
const char *PT_LOAD_START       = "Handle<Value> LoadJSFunctions( Handle<Object>obj ) {\n";
const char *PT_UNLOAD_START     = "Handle<Value> UnloadJSFunctions( Handle<Object>obj ) {\n";
const char *PT_EMBED_START      = "Handle<Value> JSKernel( Arguments& args ) {\n";
const char *PT_FUNCTION         = "Handle<Value> %s ( const Arguments& args ) {\n";
const char *PT_GETTER           = "Handle<Value> %s (Local<String> property, const AccessorInfo& info) {\n";
const char *PT_SETTER           = "void          %s (Local<String> property, Local<Value> value,const AccessorInfo& info) {\n";
const char *PT_NAMED_SETTER     = "Handle<Value> %s (Local<String> property, Local<Value> value,const AccessorInfo& info) {\n";
const char *PT_INDEXED_GETTER   = "Handle<Value> %s (uint32_t index, const AccessorInfo& info) {\n";
const char *PT_INDEXED_SETTER   = "Handle<Value> %s (uint32_t index, Local<Value> value,const AccessorInfo& info) {\n";
const char *PT_DESTRUCTOR       = "void %s ( Persistent<Object> obj ) {";
const char *PT_HANDLE_SCOPE     = "HandleScope handle_scope; \n";
const char *PT_SET_FUNCTION     = "obj->Set( String::New(\"%s\"), FunctionTemplate::New( %s )->GetFunction() );\n";
const char *PT_SET_CLASS        = "Handle<FunctionTemplate> __newClass_%s__ = FunctionTemplate::New( %s );\n";
const char *PT_SET_INSTANCE     = "Handle<ObjectTemplate> __newClassInstance_%s__ = __newClass_%s__->InstanceTemplate();\n";
const char *PT_SET_METHOD       = "__newClassInstance_%s__->Set( \"%s\", FunctionTemplate::New( %s ) );\n";
const char *PT_SET_GETTER       = "__newClassInstance_%s__->SetAccessor( String::New(\"%s\"), %s, %s );\n";
const char *PT_SET_NAMED_GETTER = "__newClassInstance_%s__->SetNamedPropertyHandler( %s, %s );\n";
const char *PT_SET_INDEX_GETTER = "__newClassInstance_%s__->SetIndexedPropertyHandler( %s, %s );\n";
const char *PT_SET_INTERNAL     = "__newClassInstance_%s__->SetInternalFieldCount( %d );\n";
const char *PT_SET_OBJECT       = "obj->Set( String::New( \"%s\" ), __newClass_%s__->GetFunction() );\n";
const char *PT_RETURN_TRUE      = "return True();\n";
const char *PT_RETURN_UNDEFINED = "return Undefined();\n";
const char *PT_SET_DESTRUCTOR   = "AddCppClassInstance( args.This(), %s );";
const char *PT_END              = "}\n";

// Javascript regex functions
const char *JS_PARSE_OUTPUT = "\
function ( filename, str )\n\
{\n\
    regex = new RegExp(filename + \"\\:([0-9]+)\\: error\\:\\ (.+)\\n\", \"g\");\n\
    results = new Array();\n\
    do\n\
    {\n\
        result = regex.exec( str );\n\
        if ( result != null )\n\
            results.push( [result[1], result[2]] );\n\
    } while( result != null );\n\
\n\
    if ( results.length == 0 ) return null;\n\
\n\
    return results;\n\
}";

const char *JS_CHECK_SYMBOL = "function ( str ) { return str.search( /[a-z][a-z0-9]*/ ) == 0 }";

// Handle to Class object template
Persistent<FunctionTemplate> classObj;
Persistent<FunctionTemplate> pluginObj;

// Embedded class dictionary
Persistent<Object> CppCodeData;
std::map<std::string, loadedKernel *> kernels;
Persistent<Array> includes;
Persistent<Array> links;
Persistent<Function> ParseOutput;

// PLUGIN LOAD/UNLOAD FUNCTIONS
Handle<Value> LoadJSFunctions( Handle<Object>obj )
{
    HandleScope handle_scope;

    // Plug-in object
    pluginObj = Persistent<FunctionTemplate>::New( FunctionTemplate::New( jsPlugin ) );
    Handle<ObjectTemplate> pluginInstance = pluginObj->InstanceTemplate();
    pluginInstance->SetInternalFieldCount(5);
    pluginInstance->Set( "Include", FunctionTemplate::New( jsInclude ) );
    pluginInstance->Set( "Link", FunctionTemplate::New( jsLink ) );
    pluginInstance->Set( "Export", FunctionTemplate::New( jsExport ) );
    pluginInstance->Set( "Classes", ObjectTemplate::New() );
    pluginInstance->Set( "Functions", ObjectTemplate::New() );
    pluginInstance->Set( "Constants", ObjectTemplate::New() );
    pluginInstance->Set( "Init", Null() );
    pluginInstance->Set( "Exit", Null() );
    pluginInstance->Set( "Extra", Null() );
    pluginInstance->Set( "Compiler", Null() );

    // Class structure
    classObj = Persistent<FunctionTemplate>::New( FunctionTemplate::New( jsClass ) );
    Handle<ObjectTemplate> classInstance = classObj->InstanceTemplate();
    classInstance->SetInternalFieldCount(2);
    classInstance->Set( "Getters", ObjectTemplate::New() );
    classInstance->Set( "Setters", ObjectTemplate::New() );
    classInstance->Set( "Methods", ObjectTemplate::New() );
    classInstance->Set( "Constructor", Null() );
    classInstance->Set( "Destructor", Null() );
    classInstance->Set( "NamedGetter", Null() );
    classInstance->Set( "NamedSetter", Null() );
    classInstance->Set( "IndexedGetter", Null() );
    classInstance->Set( "IndexedSetter", Null() );
    pluginInstance->Set( "Class", classObj->GetFunction() );
    obj->Set( String::New("Plugin"), pluginObj->GetFunction() );

    // Embedding tools
    obj->Set( String::New("Include"), FunctionTemplate::New( jsInclude )->GetFunction() );
    obj->Set( String::New("Embed"), FunctionTemplate::New( jsExport )->GetFunction() );
    includes = Persistent<Array>::New( Array::New() );
    links = Persistent<Array>::New( Array::New() );

    // ParseOutput() Javascript function
    Handle<Value> Result;
    Handle<Function> ParseOutputFn;
    ExecuteString( String::New( JS_PARSE_OUTPUT ), String::New( "ParseOutput" ), Result );
    ParseOutputFn = Handle<Function>::Cast( Result );
    ParseOutput = Persistent<Function>::New( ParseOutputFn );
    
    return True();
}

Handle<Value> UnloadJSFunctions( Handle<Object>obj )
{
    // Clean up loaded kernels
    std::map<std::string, loadedKernel*>::iterator it;
    for ( it=kernels.begin(); it!= kernels.end(); it++ )
    {
        loadedKernel *kernel = it->second;
        kernel->fn.Dispose();
        kernel->fn.Clear();
        dlclose( kernel->obj );
        delete kernel;
    }

    // Clear function templates
    classObj.Dispose();
    classObj.Clear();
    pluginObj.Dispose();
    pluginObj.Clear();
    ParseOutput.Dispose();
    ParseOutput.Clear();

    // Clear embedding dictionaries
    includes.Dispose();
    includes.Clear();
    links.Dispose();
    links.Clear();
}

// JAVASCRIPT API
Handle<Value> jsClass( const Arguments& args )
{
    // Check arguments
    if ( args.Length() < 1 )
        return ThrowException( String::New( "Expected class name" ) );  
    if ( !args[0]->IsString() )
        return ThrowException( String::New( "Class name must be a string" ) );  

    // Set class's number of internal fields
    args.This()->SetInternalField( 1, Integer::New( 0 ) );
    if ( args.Length() >= 2 )
        if ( args[1]->IsInt32() )
            args.This()->SetInternalField( 1, args[1] );

    // Set class name
    args.This()->SetInternalField( 0, args[0] );

    return Undefined();
}

Handle<Value> jsPlugin( const Arguments& args )
{
    HandleScope handle_scope;
    Handle<Value> Result;

    // Check arguments
    if ( args.Length() < 1 )
            return ThrowException( String::New( "Expected plugin name" ) );  
    if ( !args[0]->IsString() )
            return ThrowException( String::New( "Plugin name must be a string" ) );  

    // Create plugin internal data
    args.This()->SetInternalField( 0, args[0] );
    args.This()->SetInternalField( 1, Array::New() );
    args.This()->SetInternalField( 4, Array::New() );

    return Undefined();
}

Handle<Value> jsInclude( const Arguments& args )
{
    HandleScope handle_scope;
    static int i = 0;

    // Check argument
    if ( args.Length() == 0 )
        return ThrowException( String::New( "Expected include file" ) );  

    // Plugin or not?
    Handle<Object> IncludeFiles;
    if ( pluginObj->HasInstance( args.This() ) )
        IncludeFiles = args.This()->GetInternalField(1)->ToObject();
    else
        IncludeFiles = includes;

    // Push string onto end of array
    for ( int j=0; j<args.Length(); j++ )
    {
        IncludeFiles->Set( Integer::New( i ), args[j] );
        i++;
    }

    return Undefined();
}

Handle<Value> jsLink( const Arguments& args )
{
    HandleScope handle_scope;
    static int i = 0;

    // Check argument
    if ( args.Length() == 0 )
        return ThrowException( String::New( "Expected include file" ) );  

    // Plugin or not?
    Handle<Array> Links;
    if ( pluginObj->HasInstance( args.This() ) )
        Links = Handle<Array>::Cast( args.This()->GetInternalField(4) );
    else
        Links = links;

    // Push link arguments
    for ( int j=0; j<args.Length(); j++ )
    {
        Links->Set( Integer::New( i ), args[j] );
        i++;
    }

    return Undefined();
}

Handle<Value> jsExport( const Arguments& args )
{
    HandleScope handle_scope;    
    Handle<Value> ErrorMsg;
    Handle<String> OutFile;

    // Are we calling Export() or Embed()?
    bool isPlugin = pluginObj->HasInstance( args.This() );
    int srcType = isPlugin ? JS_SRC_PLUGIN : JS_SRC_EMBED;

    // Check arguments
    if ( !isPlugin )
    {
        if ( args.Length() < 2 )
            return ThrowException( String::New( "Expected kernel name and source\n" ) );
        if ( !args[0]->IsString() )
            return ThrowException( String::New( "Kernel name must be string\n" ) );
        if ( !args[1]->IsString() )
            return ThrowException( String::New( "Kernel source must be string\n" ) );
    }

    // Check for already loaded object
    String::Utf8Value KernelName( args[0]->ToString() );
    if ( !isPlugin )
        if ( kernels.find( *KernelName ) != kernels.end() )
            return kernels[*KernelName]->fn;

    // Check for cached object
    bool doCompile = true;
    if ( !isPlugin )
    {
        char out_filename[256];

        sprintf( out_filename, PT_EMBED_FILE, *KernelName );

        struct stat cache_info;
        int result = stat( out_filename, &cache_info );
        if ( cache_info.st_mtime > script_info.st_mtime )
        {
            doCompile = false;
            OutFile = String::New( out_filename );
        }
    }

    if ( doCompile )
    {
        // Build file
        char *filename;
        ErrorMsg = generatePlugin( args, &filename, srcType );
        if ( ErrorMsg->IsString() )
            return ThrowException( ErrorMsg->ToString() );
    
        // Compile file
        char *outname;
        Handle<String> PluginName;
        if ( isPlugin )
            PluginName = args.This()->GetInternalField( 0 )->ToString();
        else
            PluginName = args[0]->ToString();
        String::Utf8Value pluginStr( PluginName );
        ErrorMsg = buildPlugin( filename, *pluginStr, args.This(), OutFile, srcType );
    
        // Check for errors
        if ( ErrorMsg->IsString() )
        {
            // Cycle through errors
            Handle<Value> ParseOutputArgs[] = { String::New( filename ), ErrorMsg };
            Local<Value> Result = ParseOutput->Call( args.This(), 2, ParseOutputArgs );
            if ( Result->IsArray() )
            {
                Local<Array> Errors = Local<Array>::Cast( Result );
        
                for( int i=0; i<Errors->Length(); i++ )
                {
                    HandleScope handle_scope;
        
                    // Extract line number and error message
                    Local<Array> ThisError = Local<Array>::Cast( Errors->Get( Integer::New( i ) ) );
                    int LineNumber = ThisError->Get( Integer::New( 0 ) )->IntegerValue() - 1;
                    Handle<String> ErrorStr = ThisError->Get( Integer::New( 1 ) )->ToString();
                    String::Utf8Value str( ErrorStr );
        
                    // Map error message to JS file and report
                    Handle<Object> CodeData;
                    if ( isPlugin )
                        CodeData = args.This()->GetInternalField( 2 )->ToObject();
                    else
                        CodeData = CppCodeData;
                    Handle<Object> SectionData = CodeData->Get( Integer::New( 2 ) )->ToObject();
                    reportError( LineNumber, *str, SectionData );
                }
            }
    
            CppCodeData.Dispose();
            CppCodeData.Clear();
            return ThrowException( String::New("C++ compilation failed") );
        }
    }

    // Load kernel if calling Embed()
    if ( isPlugin )
        return Undefined();
    else
    {
        // Clean up compile data
        CppCodeData.Dispose();
        CppCodeData.Clear();

        // Load shared object
        loadedKernel *kernel = new loadedKernel;
        String::Utf8Value OutFileStr( OutFile );
        kernel->obj = dlopen( *OutFileStr, RTLD_NOW );
        if ( kernel->obj == NULL )
        {
            printf( "%s\n", dlerror() );
            return ThrowException( String::New( "Error loading embedded code" ) );
        }

        // Extract function
        Handle<Value> (*fnsym) ( const Arguments& args );
        *(void **)(&fnsym) = dlsym( kernel->obj, "JSKernel" );
        if ( fnsym == NULL )
        {
            printf( "%s\n", dlerror() );
            return ThrowException( String::New( "Error in compiled embedded code\n" ) );
        }

        // Return function
        kernel->fn = Persistent<Function>::New( FunctionTemplate::New( fnsym )->GetFunction() );
        kernels[*KernelName] = kernel;

        return kernel->fn;
    }
}

// COMPILER EXECUTION FUNCTIONS
Handle<Value> buildPlugin( char *filename, char *modname, Handle<Object> obj, Handle<String>& OutfileStr, int srcType )
{
    int commpipe[2];
    int result;
    char *ccname = "gcc";
    char argbuffer[32][64];
    char *args[40];

    // Check parameters
    if ( srcType == JS_SRC_PLUGIN )
    {
        Handle<String> ccString;
        if ( GetString( obj, "Compiler", ccString ) )
        {
            String::Utf8Value cccstr( ccString );
            ccname = *cccstr;
        }
    }

    // Check for plugin
    Handle<Array> Links;
    if ( srcType == JS_SRC_PLUGIN )
        Links = Handle<Array>::Cast( obj->GetInternalField(4) );
    else
        Links = links;

    // Determine output name
    char outfile[256];
    if ( srcType == JS_SRC_PLUGIN )
        sprintf( outfile, PT_PLUGIN_FILE, modname );
    else
        sprintf( outfile, PT_EMBED_FILE, modname );
    OutfileStr = String::New( outfile );    

    // Record links
    char cmd_buffer[256];
    int cmd_pos = sprintf( cmd_buffer, "%s -xc++ -shared -m32 -Isrc %s -o %s", ccname, filename, outfile );
    int i;
    Handle<Array> Indices = Links->GetPropertyNames();
    for ( i=0; i<Indices->Length(); i++ )
    {
        Handle<Value> Index = Indices->Get( Integer::New(i) );
        String::Utf8Value LinkName( Links->Get( Index )->ToString() );
        cmd_pos += sprintf( &cmd_buffer[cmd_pos], " -l%s", *LinkName );
    }
    cmd_pos += sprintf( &cmd_buffer[cmd_pos], " 2>&1" );

    // Compile
    fflush( stdout );
    FILE *p = popen( cmd_buffer, "r" );
    if ( p == 0 )
        return String::New( "Could not compile source" );

    // Get result back
    char output_buffer[32768];
    int output_pos = 0;
    while ( !feof( p ) )
        output_pos += fread( &output_buffer[output_pos], 1, 1024, p );
    output_buffer[output_pos] = '\0';

    // Check exit status
    int stat = pclose( p );
    if ( stat != 0 )
        return String::New( output_buffer );
    else
        return Undefined();        
}

int reportError( int lineNumber, const char *msg, Handle<Object>SectionData )
{
    HandleScope handle_scope;
    
    Local<Array> Indices = SectionData->GetPropertyNames();
    for( int i=0; i<Indices->Length(); i++ )
    {
        // Get section range
        int SectionStart = Indices->Get( Integer::New( i ) )->IntegerValue();
        int SectionEnd;
        if ( i + 1 < Indices->Length() )
            SectionEnd = Indices->Get( Integer::New( i+1 ) )->IntegerValue() - 1;
        else
            SectionEnd = 999999999;

        // Get true line:
        if ( ( lineNumber >= SectionStart ) and ( lineNumber <= SectionEnd ) )
        {
            Handle<String> ErrorSection = SectionData->Get( Indices->Get( Integer::New( i ) ) )->ToString();
            String::Utf8Value str( ErrorSection );
            printf( "Error at line %d of %s: %s\n", lineNumber - SectionStart + 1, *str, msg );
        }
    }

    return -1;
}

// SECTION BUILDING CODE
void StartClassSection( Handle<Object>Obj, const char*body, const char*SectionType, const char*SectionId, const char*ClassId )
{
    char buffer[256];

    snprintf( buffer, 256, "%s of class %s", SectionId, ClassId );
    StartSection( Obj, body, SectionType, buffer );
}

void StartSection( Handle<Object>Obj, const char*body, const char*SectionType, const char*SectionId )
{
    HandleScope handle_scope;
    char SectionText[256];

    // Get file descriptor, current line count and sections dictionary
    Local<External> FilePointer = Local<External>::Cast( Obj->Get( Integer::New( 0 ) ) );
    FILE *fp = (FILE *)FilePointer->Value();
    int curLineCount = Obj->Get( Integer::New( 1 ) )->ToInteger()->Value();
    Handle<Object> OutputSections = Obj->Get( Integer::New( 2 ) )->ToObject();

    // Write text to file and update section dictionary
    fputs( body, fp );
    sprintf( SectionText, "%s %s", SectionType, SectionId );
    OutputSections->Set( Integer::New( curLineCount ), String::New( SectionText ) );

    // Update line count
    curLineCount += countNewLines( body );
    Obj->Set( Integer::New( 1 ), Integer::New( curLineCount ) );
}

void ContinueSection( Handle<Object>Obj, const char*body  )
{
    HandleScope handle_scope;

    // Get file descriptor, current line count and sections dictionary
    Local<External> FilePointer = Local<External>::Cast( Obj->Get( Integer::New( 0 ) ) );
    FILE *fp = (FILE *)FilePointer->Value();
    int curLineCount = Obj->Get( Integer::New( 1 ) )->ToInteger()->Value();

    // Write text to file and update line count
    fputs( body, fp );
    curLineCount += countNewLines( body );
    Obj->Set( Integer::New( 1 ), Integer::New( curLineCount ) );
}

int countNewLines( const char*text )
{
    int numLines = 0;
    const char *thisChar = text;

    // Count newlines
    while ( *thisChar )
    {
        if ( *thisChar == '\n' )
            numLines++;
        thisChar++;
    }

    return numLines;
}

// GENERATE PLUGIN
Handle<Value> generatePlugin( const Arguments& args, char **filename, int srcType )
{
    HandleScope handle_scope;    
    FILE *fp;
    fflush( stdout );

    // Open file
    *filename = tmpnam( NULL );
    fp = fopen( *filename, "w" );
    if ( fp == NULL )
        return String::New( "Could not open temporary file" );

    if ( OUTPUT_FILENAME )
        printf( "%s\n", *filename );

    for (int i=0; i<global_argc; i++)
        if (!strcmp(global_argv[i], "-dumpfile"))
            printf("%s\n", *filename);

    // Update line count to keep track of lines
    Handle<Object> CodeData = Object::New();
    CodeData->Set( Integer::New( 0 ), External::New( (void *)fp ) );    // Plugin name
    CodeData->Set( Integer::New( 1 ), Integer::New( 1 ) );              // Current Line
    CodeData->Set( Integer::New( 2 ), Object::New( ) );                 // Section Info
    if ( srcType == JS_SRC_PLUGIN )
        args.This()->SetInternalField( 2, CodeData );
    else
        CppCodeData = Persistent<Object>::New( CodeData );

    // Export includes
    ExportIncludes( CodeData, args.This(), srcType );

    if ( srcType == JS_SRC_PLUGIN )
    {
        // Export support code
        ExportCode( CodeData, args.This(), "Extra", "extra" );
    
        // Export functions
        ExportGroup( CodeData, args.This(), PT_FUNCTION, PT_FUNCTION_NAME, "Functions", "function" );
    
        // Export Classes
        Handle<Object> ClassObject;
        if ( GetObject( args.This(), "Classes", ClassObject ) )
        {
            Handle<Array>ClassKeys = ClassObject->GetPropertyNames();
            for ( int i=0; i<ClassKeys->Length(); i++ )
            {
                HandleScope handle_scope;
    
                Handle<Value> ThisClass = ClassObject->Get( ClassKeys->Get( Integer::New( i ) ) );
                ExportClass( CodeData, ThisClass->ToObject() );
            }
        }
    
        // Export declaration headers
        ContinueSection( CodeData, PT_DECLARE_LOAD );
        ContinueSection( CodeData, PT_LOAD_START );
        ContinueSection( CodeData, PT_HANDLE_SCOPE );
        ExportFunctionHeaders( CodeData, args.This() );
        ExportClassHeaders( CodeData, args.This() );
        ExportCode( CodeData, args.This(), "Init", "init" );
        ContinueSection( CodeData, PT_RETURN_TRUE );
        ContinueSection( CodeData, PT_END );
    
        // Exit code
        ContinueSection( CodeData, PT_DECLARE_UNLOAD );
        ContinueSection( CodeData, PT_UNLOAD_START );
        ContinueSection( CodeData, PT_HANDLE_SCOPE );
        ExportCode( CodeData, args.This(), "Exit", "exit" );
        ContinueSection( CodeData, "\n" );
        ContinueSection( CodeData, PT_END );
    }
    else
    {
        // Single function for embedding
        ContinueSection( CodeData, PT_DECLARE_EMBED );
        ContinueSection( CodeData, PT_EMBED_START );
        ContinueSection( CodeData, PT_HANDLE_SCOPE );
        String::Utf8Value SrcBody( args[1]->ToString() );
        String::Utf8Value SrcName( args[0]->ToString() );
        StartSection( CodeData, *SrcBody, "kernel", *SrcName );
        ContinueSection( CodeData, PT_END );
    }

    fclose( fp );
    
    return Undefined();
}

// CODE GENERATION SUPPORT FUNCTIONS
void ExportIncludes( Handle<Object> CodeData, Handle<Object> Parent, int srcType )
{
    HandleScope handle_scope;
    StartSection( CodeData, PT_INCLUDE_V8, "include", "v8.h" );
    StartSection( CodeData, PT_INCLUDE_REF, "include", "script-references.h" );

    // Iterate through internal array
    Handle<Array> IncludeNames;
    if ( srcType == JS_SRC_PLUGIN )
        IncludeNames = Handle<Array>::Cast( Parent->GetInternalField(1) );
    else
        IncludeNames = includes;
    for ( int i=0; i<IncludeNames->Length(); i++ )
    {
        HandleScope handle_scope;

        // Write include metacommand
        Handle<Value> IncludeValue = IncludeNames->Get( Integer::New(i) );
        String::Utf8Value IncludeStr( IncludeValue->ToString() );
        StartSection( CodeData, PT_INCLUDE_START, "include", *IncludeStr );        
        if ( (*IncludeStr)[0] != '<' ) ContinueSection( CodeData, "\"" );
        ContinueSection( CodeData, *IncludeStr );
        if ( (*IncludeStr)[0] != '<' ) ContinueSection( CodeData, "\"" );
        ContinueSection( CodeData, "\n" );
    }
    StartSection( CodeData, PT_USING_V8, "namespace", "v8.h" );
}

void ExportCode( Handle<Object> CodeData, Handle<Object> Parent, char *CodeName, char *CodeNickname )
{
    HandleScope handle_scope;

    Handle<String> CodeStr;
    if ( GetString( Parent, CodeName, CodeStr ) )
    {
        String::Utf8Value cCodeStr( CodeStr );
        StartSection( CodeData, *cCodeStr, CodeNickname, "code" );
        ContinueSection( CodeData, "\n" );
    }
}

void ExportGroup( Handle<Object> CodeData, Handle<Object> Parent, const char *GroupTemplate, const char *GroupNameTemplate, char *GroupName, char *GroupNickName )
{
    HandleScope handle_scope;
    char cItemSymbol[256];
    char cItemOpen[256];

    // Check for class parent
    bool isClass = classObj->HasInstance( Parent );
    String::Utf8Value cParentName( Parent->GetInternalField( 0 )->ToString() );

    // Get group object
    Handle<Object> GroupObj;
    if ( GetObject( Parent, GroupName, GroupObj ) )
    {
        // Iterate through group object
        Handle<Array> GroupKeys = GroupObj->GetPropertyNames();

        for ( int i=0; i<GroupKeys->Length(); i++ )
        {
            HandleScope handle_scope;

            // Extract item name and body
            Handle<String> ItemBody;
            Handle<String> ItemName = GroupKeys->Get( Integer::New(i) )->ToString();
            if ( GetString( GroupObj, ItemName, ItemBody ) )
            {
                String::Utf8Value cItemName( ItemName );
                String::Utf8Value cItemBody( ItemBody );

                // Write to file
                if ( isClass )
                {
                    sprintf( cItemSymbol, GroupNameTemplate, *cParentName, *cItemName );
                    sprintf( cItemOpen, GroupTemplate, cItemSymbol );
                    ContinueSection( CodeData, cItemOpen );
                    ContinueSection( CodeData, PT_HANDLE_SCOPE );
                    StartClassSection( CodeData, *cItemBody, GroupNickName, *cItemName, *cParentName );
                }
                else
                {
                    sprintf( cItemSymbol, GroupNameTemplate, "", *cItemName );
                    sprintf( cItemOpen, GroupTemplate, cItemSymbol );
                    ContinueSection( CodeData, cItemOpen );
                    ContinueSection( CodeData, PT_HANDLE_SCOPE );
                    StartSection( CodeData, *cItemBody, GroupNickName, *cItemName );
                }
                ContinueSection( CodeData, PT_END );
            }

        }
    }
}

void ExportSection( Handle<Object> CodeData, Handle<Object> Parent, const char *SectionTemplate, const char *SectionNameTemplate, char *SectionName, char *SectionNickname, bool ReturnUndefined )
{
    HandleScope handle_scope;

    char cSectionSymbol[256];
    char cSectionOpen[256];

    // Check for class parent
    bool isClass = classObj->HasInstance( Parent );
    String::Utf8Value cParentName( Parent->GetInternalField( 0 )->ToString() );

    Handle<String> SectionBody;
    if ( GetString( Parent, SectionName, SectionBody ) )
    {
        String::Utf8Value cSectionBody( SectionBody );
        if ( isClass )
        {
            sprintf( cSectionSymbol, SectionNameTemplate, *cParentName );
            sprintf( cSectionOpen, SectionTemplate, cSectionSymbol );
            ContinueSection( CodeData, cSectionOpen );
            ContinueSection( CodeData, PT_HANDLE_SCOPE );
            StartClassSection( CodeData, *cSectionBody, SectionNickname, SectionName, *cParentName );
        }
        else
        {
            sprintf( cSectionOpen, SectionNameTemplate, "" );
            sprintf( cSectionOpen, SectionTemplate, cSectionSymbol );
            ContinueSection( CodeData, cSectionOpen );
            ContinueSection( CodeData, PT_HANDLE_SCOPE );
            StartSection( CodeData, *cSectionBody, SectionNickname, SectionName );
        }
        if ( ReturnUndefined )
            ContinueSection( CodeData, PT_RETURN_UNDEFINED );
        ContinueSection( CodeData, PT_END );
    }
}

void ExportConstructor( Handle<Object> CodeData, Handle<Object> ClassObj )
{
    HandleScope handle_scope;
    char cConstructorSymbol[256];
    char cConstructorOpen[256];

    String::Utf8Value cClassName( ClassObj->GetInternalField( 0 )->ToString() );

    // Export destructor
    bool hasDestructor = false;
    Handle<String> DestructorBody;
    if ( GetString( ClassObj, "Destructor", DestructorBody ) )
    {
        hasDestructor = true;
        String::Utf8Value cDestructorBody( DestructorBody );
        sprintf( cConstructorSymbol, PT_DESTRUCTOR_NAME, *cClassName );
        sprintf( cConstructorOpen, PT_DESTRUCTOR, cConstructorSymbol );
        ContinueSection( CodeData, cConstructorOpen );
        StartClassSection( CodeData, *cDestructorBody, "destructor", "Destructor", *cClassName );
        ContinueSection( CodeData, "\n" );
        ContinueSection( CodeData, PT_END );
    }

    // Export constructor
    Handle<String> ConstructorBody;
    if ( !GetString( ClassObj, "Constructor", ConstructorBody ) )
        ConstructorBody = String::New( "" );

    String::Utf8Value cConstructorBody( ConstructorBody );
    sprintf( cConstructorSymbol, PT_CONSTRUCTOR_NAME, *cClassName );
    sprintf( cConstructorOpen, PT_FUNCTION, cConstructorSymbol );
    ContinueSection( CodeData, cConstructorOpen );
    ContinueSection( CodeData, PT_HANDLE_SCOPE );

    // Turn instance into a weak persistent handle to call destructor
    if ( hasDestructor )
    {
        sprintf( cConstructorSymbol, PT_DESTRUCTOR_NAME, *cClassName );
        sprintf( cConstructorOpen, PT_SET_DESTRUCTOR, cConstructorSymbol );
        ContinueSection( CodeData, cConstructorOpen );
    }

    StartClassSection( CodeData, *cConstructorBody, "constructor", "Constructor", *cClassName );
    ContinueSection( CodeData, "\n" );
    ContinueSection( CodeData, PT_RETURN_UNDEFINED );
    ContinueSection( CodeData, PT_END );

}

void ExportClass( Handle<Object> CodeData, Handle<Object> ClassObj )
{
    HandleScope handle_scope;

    char buf[256];
    String::Utf8Value cClassName( ClassObj->GetInternalField( 0 )->ToString() );

    // Write optional class components
    ExportConstructor( CodeData, ClassObj );
    ExportSection( CodeData, ClassObj, PT_GETTER,   PT_NAMED_GETTER_NAME, "NamedGetter", "named property getter" );
    ExportSection( CodeData, ClassObj, PT_NAMED_SETTER,   PT_NAMED_SETTER_NAME, "NamedSetter", "named property setter" );
    ExportSection( CodeData, ClassObj, PT_INDEXED_GETTER, PT_INDEX_GETTER_NAME, "IndexedGetter", "indexed property getter" );
    ExportSection( CodeData, ClassObj, PT_INDEXED_SETTER, PT_INDEX_SETTER_NAME, "IndexedSetter", "indexed property setter" );

    // Write modifiers, 
    ExportGroup( CodeData, ClassObj, PT_GETTER,   PT_GETTER_NAME, "Getters", "getter" );
    ExportGroup( CodeData, ClassObj, PT_SETTER,   PT_SETTER_NAME, "Setters", "setter" );
    ExportGroup( CodeData, ClassObj, PT_FUNCTION, PT_METHOD_NAME, "Methods", "method" );
}

void ExportFunctionHeaders( Handle<Object> CodeData, Handle<Object> Parent )
{
    HandleScope handle_scope;
    char cFunctionSymbol[256];
    char cFunctionSet[256];

    Handle<Object> Functions;
    if ( GetObject( Parent, "Functions", Functions ) )
    {
        // Iterate functions
        Local<Array> FunctionKeys = Functions->GetPropertyNames();
        for( int i=0; i<FunctionKeys->Length(); i++ )
        {
            HandleScope handle_scope;

            // Get function symbol
            Handle<String> FunctionBody;
            Handle<String> FunctionName = FunctionKeys->Get( Integer::New( i ) )->ToString();
            if ( GetString( Functions, FunctionName, FunctionBody ) )
            {
                String::Utf8Value cFunctionName( FunctionName );
                sprintf( cFunctionSymbol, PT_FUNCTION_NAME, "", *cFunctionName );
                sprintf( cFunctionSet, PT_SET_FUNCTION, *cFunctionName, cFunctionSymbol );
                ContinueSection( CodeData, cFunctionSet );
            }
        }
    }
}

void ExportClassHeaders( Handle<Object> CodeData, Handle<Object> Parent )
{
    HandleScope handle_scope;

    Handle<Object> Classes;
    if ( GetObject( Parent, "Classes", Classes ) )
    {
        // Iterate through each class
        Local<Array> ClassNames = Classes->GetPropertyNames();
        for ( int i=0; i<ClassNames->Length(); i++ )
        {
            HandleScope handle_scope;
            Handle<Object> ClassObj;

            // Export if a class object
            if ( GetObject( Classes, ClassNames->Get( Integer::New( i ) )->ToString(), ClassObj ) )
            {
                if ( classObj->HasInstance( ClassObj ) )
                    ExportSingleClassHeader( CodeData, ClassObj );
            }
        }
    }
}

void ExportSingleClassHeader( Handle<Object> CodeData, Handle<Object> ClassObj )
{
    HandleScope handle_scope;
    String::Utf8Value cClassName( ClassObj->GetInternalField( 0 )->ToString() );
    char cSymbol[256];
    char cSet[256];

    // Export constructor header
    sprintf( cSymbol, PT_CONSTRUCTOR_NAME, *cClassName );
    sprintf( cSet, PT_SET_CLASS, *cClassName, cSymbol );
    ContinueSection( CodeData, cSet );
    sprintf( cSet, PT_SET_INSTANCE, *cClassName, *cClassName );
    ContinueSection( CodeData, cSet );

    // Export method headers
    Handle<Object> Methods;
    if ( GetObject( ClassObj, "Methods", Methods ) )
    {
        // Iterate through each method
        Local<Array> MethodKeys = Methods->GetPropertyNames();
        for ( int i=0; i<MethodKeys->Length(); i++ )
        {
            HandleScope handle_scope;
            // Add method to instance template
            Handle<String> MethodBody;
            Handle<String> MethodName = MethodKeys->Get( Integer::New( i ) )->ToString();

            if ( GetString( Methods, MethodName, MethodBody ) )
            {
                String::Utf8Value cMethodName( MethodName );
                sprintf( cSymbol, PT_METHOD_NAME, *cClassName, *cMethodName );
                sprintf( cSet, PT_SET_METHOD, *cClassName, *cMethodName, cSymbol );
                ContinueSection( CodeData, cSet );
            }
        }
    }

    // Build list of getters/setters
    bool hasGetters = false, hasSetters = false;
    Handle<Object>Properties = Object::New();
    Handle<Object> Getters;
    if ( GetObject( ClassObj, "Getters", Getters ) )
    {
        // Iterate through getters
        hasGetters = true;
        Local<Array> GetterNames = Getters->GetPropertyNames();
        for ( int i=0; i<GetterNames->Length(); i++ )
        {
            Handle<String> GetterBody;
            Handle<String> GetterName = GetterNames->Get( Integer::New( i ) )->ToString();
            if ( GetString( Getters, GetterName, GetterBody ) )
                Properties->Set( GetterName, True() );
        }
    }

    Handle<Object> Setters;
    if ( GetObject( ClassObj, "Setters", Setters ) )
    {
        // Iterate through setters
        hasSetters = true;
        Local<Array> SetterNames = Setters->GetPropertyNames();
        for ( int i=0; i<SetterNames->Length(); i++ )
        {
            Handle<String> SetterBody;
            Handle<String> SetterName = SetterNames->Get( Integer::New( i ) )->ToString();
            if ( GetString( Setters, SetterName, SetterBody ) )
                Properties->Set( SetterName, True() );
        }
    }

    // Export getter/setter headers
    char cSymbolGetBuffer[96], *cSymbolGet;
    char cSymbolSetBuffer[96], *cSymbolSet;
    Local<Array> PropertyNames = Properties->GetPropertyNames();
    for ( int i=0; i<PropertyNames->Length(); i++ )
    {
        HandleScope handle_scope;

        // Select getter or NULL or no getter
        Handle<String>Property = PropertyNames->Get( Integer::New( i ) )->ToString();
        String::Utf8Value cProperty( Property );
        cSymbolGet = "NULL";

        if ( hasGetters )
        {
            Handle<String> PropertyBody;
            if ( GetString( Getters, Property, PropertyBody ) )
            {
                sprintf( cSymbolGetBuffer, PT_GETTER_NAME, *cClassName, *cProperty );
                cSymbolGet = cSymbolGetBuffer;
            }
        }

        // Select setter or NULL or no setter
        cSymbolSet = "NULL";
        if ( hasSetters )
        {
            Handle<String> PropertyBody;
            if ( GetString( Setters, Property, PropertyBody ) )
            {
                sprintf( cSymbolSetBuffer, PT_SETTER_NAME, *cClassName, *cProperty );
                cSymbolSet = cSymbolSetBuffer;
            }
        }

        // Export header
        sprintf( cSet, PT_SET_GETTER, *cClassName, *cProperty, cSymbolGet, cSymbolSet );
        ContinueSection( CodeData, cSet );
    }

    // Export named interceptor
    Handle<String> Body;
    bool setHandler = false;
    if ( GetString( ClassObj, "NamedGetter", Body ) )
    {
        setHandler = true;
        sprintf( cSymbolGetBuffer, PT_NAMED_GETTER_NAME, *cClassName );
        cSymbolGet = cSymbolGetBuffer;
    }
    else
        cSymbolGet = "NULL";

    if ( GetString( ClassObj, "NamedSetter", Body ) )
    {
        setHandler = true;
        sprintf( cSymbolSetBuffer, PT_NAMED_SETTER_NAME, *cClassName );
        cSymbolSet = cSymbolSetBuffer;
    }
    else
        cSymbolSet = "NULL";

    if ( setHandler )
    {
        sprintf( cSet, PT_SET_NAMED_GETTER, *cClassName, cSymbolGet, cSymbolSet );
        ContinueSection( CodeData, cSet );
    }

    // Export indexed interceptor
    setHandler = false;
    if ( GetString( ClassObj, "IndexedGetter", Body ) )
    {
        setHandler = true;
        sprintf( cSymbolGetBuffer, PT_INDEX_GETTER_NAME, *cClassName );
        cSymbolGet = cSymbolGetBuffer;
    }
    else
        cSymbolGet = "NULL";

    if ( GetString( ClassObj, "IndexedSetter", Body ) )
    {
        setHandler = true;
        sprintf( cSymbolSetBuffer, PT_INDEX_SETTER_NAME, *cClassName );
        cSymbolSet = cSymbolSetBuffer;
    }
    else
        cSymbolSet = "NULL";

    if ( setHandler )
    {
        sprintf( cSet, PT_SET_INDEX_GETTER, *cClassName, cSymbolGet, cSymbolSet );
        ContinueSection( CodeData, cSet );
    }

    // Set number of internal fields for class
    sprintf( cSet, PT_SET_INTERNAL, *cClassName, ClassObj->GetInternalField( 1 )->IntegerValue() );
    ContinueSection( CodeData, cSet );

    // Add class to parent object
    sprintf( cSet, PT_SET_OBJECT, *cClassName, *cClassName );
    ContinueSection( CodeData, cSet );
}
