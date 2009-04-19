#include <v8.h>

class Plugins
{
    void *lib;
    Handle<Value> (*LoadPlugin)( Local<Object> obj );
    Handle<Value> (*UnloadPlugin)( Local<Object obj );
    Persistent<Object> obj;
    bool isGlobal;
    Plugins *next;
}
