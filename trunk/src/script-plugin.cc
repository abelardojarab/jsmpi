#include <v8.h>
#include <dlfcn.h>
#include "script-plugin.h"

// Main context
extern Persistent<Context> context;

// Plugin set
PluginSet Plugins;

PluginSet::PluginSet()
{
    head = NULL;
}

void PluginSet::Delete()
{
    PluginObject *next;

    while( head )
    {
        head->Unload( );
        next = head->next;
        delete head;
        head = next;
    }
}

PluginSet::~PluginSet( )
{
    Delete();
}

// PluginObject methods
PluginObject *PluginSet::New()
{
    HandleScope handle_scope;

    // Add new plugin to list head
    PluginObject *newPlugin = new PluginObject();
    newPlugin->next = head;
    head = newPlugin;

    return newPlugin;
}

Handle<Value> PluginObject::Load( Handle<String> LibName )
{
    HandleScope handle_scope;

    String::Utf8Value libstring( LibName );
    char LibPath[256];

    // Load library
    snprintf( LibPath, 256, "lib/lib%s.so", *libstring );
    ptr = dlopen( LibPath, RTLD_NOW );
    if ( ptr == NULL )
    {
        printf( "%s\n", dlerror() );
        return ThrowException( String::New( "Could not load plugin" ) );
    }

    // Load symbols
    *(void **)(&LoadPlugin) = dlsym( ptr, "LoadJSFunctions" );

    if ( LoadPlugin == NULL )
    {
        dlclose( ptr );
        return ThrowException( String::New( "Incompatible plugin" ) );
    }
    *(void **)(&UnloadPlugin) = dlsym( ptr, "UnloadJSFunctions" );

    // Call init function
    if ( isGlobal )
        return LoadPlugin( context->Global() );
    else
        return LoadPlugin( obj );
}
 
Handle<Value> PluginObject::Unload( )
{
    HandleScope handle_scope;

    // Call de-init function
    if ( UnloadPlugin != NULL )
    {
        if ( isGlobal )
            UnloadPlugin( context->Global() );
        else
            UnloadPlugin( obj );
    }

    // Dispose namespace object, if necessary
    if ( !isGlobal )
        obj.Dispose();

    // Close library
    dlclose( ptr );

    return Undefined();
}

// CleanupPlugins() - Wrapper for script.cc
void CleanupPlugins()
{
    Plugins.Delete( );
}

// Import - import our code
Handle<Value> Import( const Arguments& args )
{
    HandleScope handle_scope;
    Handle<String> libName;
    bool useGlobal = false;

    // Check arguments
    if ( args.Length() == 0 )
        return ThrowException( String::New( "Expected package name" ) );
    else if ( !args[0]->IsString() )
        return ThrowException( String::New( "Expected string at argument 1" ) );
    else if ( ( args.Length() > 1 ) && ( !args[1]->IsBoolean() ) )
        return ThrowException( String::New( "Expected boolean at argument 2" ) );
    else if ( args.Length() > 1 )
        useGlobal = args[1]->BooleanValue();

    // Determine namespace
    PluginObject *lib = Plugins.New();
    lib->isGlobal = useGlobal;
    if( !useGlobal )
    {
        lib->obj = Persistent<Object>::New( Object::New( ) );
        context->Global()->Set( args[0], lib->obj );
    }

    // Load library
    return lib->Load( args[0]->ToString() );
}
