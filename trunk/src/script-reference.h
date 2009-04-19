#ifndef __SCRIPT_REFERENCE_H__
#define __SCRIPT_REFERENCE_H__

#include <v8.h>
using namespace v8;

typedef void (*DestructorCallback) ( Persistent<Object> Obj );
typedef struct WeakObject_s
{
    Persistent<Object> Obj;
    DestructorCallback Callback;
} WeakObject;

void AddCppClassInstance( Handle<Object> Obj, DestructorCallback dc );
void WeakObjectCallback( Persistent<Value> Value, void *Parameter );
void FlushCppClasses();

#endif
