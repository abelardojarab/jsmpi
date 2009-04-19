#include <v8.h>
using namespace v8;

#ifndef __V8TOOLS_H__
#define __V8TOOLS_H__

bool GetObject( Handle<Value> Val, Handle<Object>& Obj );
bool GetObject( Handle<Object> Parent, int ObjIndex, Handle<Object>& Obj );
bool GetObject( Handle<Object> Parent, char *ObjName, Handle<Object>& Obj );
bool GetObject( Handle<Object> Parent, Handle<Value> ObjName, Handle<Object>& Obj );
bool GetString( Handle<Value> Val, Handle<String>& Str );
bool GetString( Handle<Object> Parent, int StrIndex, Handle<String>& Str );
bool GetString( Handle<Object> Parent, char *StrName, Handle<String>& Str );
bool GetString( Handle<Object> Parent, Handle<Value> StrName, Handle<String>& Str );
bool GetArray( Handle<Value> Val, Handle<Array>& ResultArray );
bool GetArray ( Handle<Object> Parent, int ArrayIndex, Handle<Array>& ResultArray );
bool GetArray ( Handle<Object> Parent, char *ArrayName, Handle<Array>& ResultArray );
bool GetArray( Handle<Object> Parent, Handle<Value> ArrayName, Handle<Array>& ResultArray );

class ObjectIterator
{
    public:
        void start( Handle<Object> obj );
        bool end();
        void next();
        Handle<Value> Key();
        Handle<Value> Element();

    private:
        Handle<Object> obj;
        Handle<Array> keys;
        int count;
        int i;
};

#endif
