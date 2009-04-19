#include <v8.h>
#include <set>
#include "script-reference.h"
#include <cstdio>

std::set<WeakObject*> Instances;

void AddCppClassInstance( Handle<Object> Obj, DestructorCallback dc )
{
    // Add instance to reference list
    WeakObject *WeakObj = new WeakObject;

    // Make instance persistent
    Persistent<Object> PersistentObj = Persistent<Object>::New( Obj );
    PersistentObj.MakeWeak( WeakObj, WeakObjectCallback );    

    // Set up destructor
    WeakObj->Obj = PersistentObj;
    WeakObj->Callback = dc;

    Instances.insert( WeakObj );
}

void WeakObjectCallback( Persistent<Value> Value, void *Parameter )
{
    WeakObject *WeakObj = (WeakObject *)Parameter;
    Persistent<Object> Obj = WeakObj->Obj;

    // Call destructor
    WeakObj->Callback( Obj );

    // Remove object from list
    Instances.erase( WeakObj );
    delete WeakObj;

    // Delete object
    Value.Dispose();
    Value.Clear();
}

void FlushCppClasses()
{
    std::set<WeakObject*>::iterator it;

    for ( it=Instances.begin(); it!= Instances.end(); it++ )
    {
        WeakObject *WeakObj = *it;
        WeakObj->Callback( WeakObj->Obj );
        WeakObj->Obj.Dispose();
        WeakObj->Obj.Clear();
        delete WeakObj;
    }
}
