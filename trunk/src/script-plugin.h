#ifndef __SCRIPT_PLUGIN_H__
#define __SCRIPT_PLUGIN_H__

#include <v8.h>

using namespace v8;

// Object to hold scripting library 
class PluginObject
{
    public:
        Handle<Value> Load( Handle<String> LibName );
        Handle<Value> Unload( );
        Persistent<Object>obj;
        bool isGlobal;
        PluginObject *next;

    private:
        void *ptr;
        Handle<Value> (*LoadPlugin)( Handle<Object> obj );
        Handle<Value> (*UnloadPlugin)( Handle<Object> obj );

};

// Object to hold list of libraries
class PluginSet
{
    public:
        PluginSet();
        ~PluginSet();
        PluginObject *New();
        void Delete( );

    private:
        struct PluginObject *head;
};

void CleanupPlugins();
Handle<Value> Import( const Arguments& args );

#endif
