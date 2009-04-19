#include "v8tools.h"

// Object  iterator
void ObjectIterator::start( Handle<Object> obj )
{
    this->obj = obj;
    this->keys = obj->GetPropertyNames();
    this->i = 0;
    this->count = keys->Length();
}

bool ObjectIterator::end()
    { return ( i < count ); }

void ObjectIterator::next()
    { i++; }

Handle<Value> ObjectIterator::Key()
    { return keys->Get( Int32::New( i ) ); }

Handle<Value> ObjectIterator::Element()
    { return keys->Get( Key() ); }

// Check+Cast for Object
bool GetObject( Handle<Value> Val, Handle<Object>& Obj )
{
    if ( Val->IsObject() )
    {
        Obj = Val->ToObject();
        return true;
    }
    return false;
}
bool GetObject( Handle<Object> Parent, int ObjIndex, Handle<Object>& Obj )
    { return GetObject( Parent, Int32::New( ObjIndex ), Obj ); }
bool GetObject( Handle<Object> Parent, char *ObjName, Handle<Object>& Obj )
    { return GetObject( Parent, String::New( ObjName ), Obj ); }
bool GetObject( Handle<Object> Parent, Handle<Value> ObjName, Handle<Object>& Obj )
{
    if ( Parent->Has( ObjName->ToString() ) )
    {
        Handle<Value> ObjValue = Parent->Get( ObjName );
        if ( ObjValue->IsObject() )
        {
            Obj = ObjValue->ToObject();
            return true;
        }
    }

    return false;
}

// Check+Cast for String
bool GetString( Handle<Value> Val, Handle<String>& Str )
{
    if ( Val->IsString() )
    {
        Str = Val->ToString();
        return true;
    }
    return false;
}
bool GetString( Handle<Object> Parent, int StrIndex, Handle<String>& Str )
    { return GetString( Parent, Int32::New( StrIndex ), Str ); }
bool GetString( Handle<Object> Parent, char *StrName, Handle<String>& Str )
    { return GetString( Parent, String::New( StrName ), Str ); }
bool GetString( Handle<Object> Parent, Handle<Value> StrName, Handle<String>& Str )
{
    if ( Parent->Has( StrName->ToString() ) )
    {
        Handle<Value> StrValue = Parent->Get( StrName );
        if ( StrValue->IsString() )
        {
            Str = StrValue->ToString();
            return true;
        }
    }

    return false;
}

// Check+Cast for Array
bool GetArray( Handle<Value> Val, Handle<Array>& ResultArray )
{
    if ( Val->IsArray() )
    {
        ResultArray = Handle<Array>::Cast( Val );
        return true;
    }
    return false;
}
bool GetArray ( Handle<Object> Parent, int ArrayIndex, Handle<Array>& ResultArray )
    { return GetArray( Parent, Int32::New( ArrayIndex ), ResultArray ); }
bool GetArray ( Handle<Object> Parent, char *ArrayName, Handle<Array>& ResultArray )
    { return GetArray( Parent, String::New( ArrayName ), ResultArray ); }
bool GetArray( Handle<Object> Parent, Handle<Value> ArrayName, Handle<Array>& ResultArray )
{
    Local<Value> ArrayValue;
    if ( Parent->Has( ArrayName->ToString() ) )
    {
        if ( ArrayValue->IsArray() )
        {
            ResultArray = Local<Array>::Cast( ArrayValue );
            return true;
        }
    }

    return false;
}
