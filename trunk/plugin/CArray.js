import("cpp");

CArray = new cpp.Plugin( "CArray" );
with( CArray )
{
    Include("<cstdio>");

    Extra = <%
        #define TYPE_INTEGER 42
        #define TYPE_DOUBLE 47

        typedef struct carray_int_s
        {
            int size;
            int *array;
        } carray_int;

        typedef struct carray_double_s
        {
            int size;
            double *array;
        } carray_double;
    %>

    Classes.Integer = new Class( "Integer", 2 )
    with( Classes.Integer )
    {
        // Constructor - create array
        Constructor = <%
            // Check for valid array size
            if ( args.Length() < 1 )
                return ThrowException( String::New( "Expected array size" ) );
            else if ( !args[0]->IsInt32() )
                return ThrowException( String::New( "Array size must be integer" ) );
            else if ( args[0]->Int32Value() < 1 )
                return ThrowException( String::New( "Invalid array size" ) );

            // Create array
            carray_int *new_array = new carray_int;
            new_array->size = args[0]->IntegerValue();
            if (new_array->size > 0)
                new_array->array = new int[ new_array->size ];
            else
            {
                new_array->array = 0;
                new_array->size = -1;
            }

            // Set internal fields
            args.This()->SetInternalField( 0, Integer::New( TYPE_INTEGER ) );
            args.This()->SetInternalField( 1, External::New( new_array ) );
        %>

        // Destructor - delete array
        Destructor = <%
            carray_int *array = (carray_int *)Local<External>::Cast( obj->ToObject()->GetInternalField( 1 ) )->Value();
            delete array->array;
            delete array;
        %>

        // Indexed setter - write array
        IndexedSetter = <%
            // Check bounds
            carray_int *array = (carray_int *)Local<External>::Cast( info.This()->GetInternalField( 1 ) )->Value();
            if ( ( index < 0 ) || ( index >= array->size ) )
                return ThrowException( String::New( "Index out of bounds" ) );
            
            // Set array field
            array->array[index] = value->IntegerValue();
        %>

        // Indexed getter - read array
        IndexedGetter = <%
            // Check bounds
            carray_int *array = (carray_int *)Local<External>::Cast( info.This()->GetInternalField( 1 ) )->Value();
            if ( ( index < 0 ) || ( index >= array->size ) )
                return ThrowException( String::New( "Index out of bounds" ) );

            // Get array field
            return Integer::New( array->array[index] );
        %>

        Getters.length = <%
            carray_int *array = (carray_int *)Local<External>::Cast( info.This()->GetInternalField( 1 ) )->Value();
            return Integer::New( array->size );
        %>
    }

    Classes.Double = new Class( "Double", 2 )
    with( Classes.Double )
    {
        // Constructor - create array
        Constructor = <%
            // Check for valid array size
            if ( args.Length() < 1 )
                return ThrowException( String::New( "Expected array size" ) );
            else if ( !args[0]->IsInt32() )
                return ThrowException( String::New( "Array size must be integer" ) );
            else if ( args[0]->Int32Value() < 1 )
                return ThrowException( String::New( "Invalid array size" ) );
            
            // Create array
            carray_double *new_array = new carray_double;
            new_array->size = args[0]->IntegerValue();
            new_array->array = new double[ new_array->size ];

            // Set internal fields
            args.This()->SetInternalField( 0, Integer::New( TYPE_INTEGER ) );
            args.This()->SetInternalField( 1, External::New( new_array ) );
        %>

        // Destructor - delete array
        Destructor = <%
            carray_double *array = (carray_double *)Local<External>::Cast( obj->ToObject()->GetInternalField( 1 ) )->Value();
            delete array->array;
            delete array;
        %>

        // Indexed setter - write array
        IndexedSetter = <%
            // Check bounds
            carray_double *array = (carray_double *)Local<External>::Cast( info.This()->GetInternalField( 1 ) )->Value();
            if ( ( index < 0 ) || ( index >= array->size ) )
                return ThrowException( String::New( "Index out of bounds" ) );
            
            // Set array field
            array->array[index] = value->NumberValue();
        %>

        // Indexed getter - read array
        IndexedGetter = <%
            // Check bounds
            carray_double *array = (carray_double *)Local<External>::Cast( info.This()->GetInternalField( 1 ) )->Value();
            if ( ( index < 0 ) || ( index >= array->size ) )
                return ThrowException( String::New( "Index out of bounds" ) );

            // Get array field
            return Number::New( array->array[index] );
        %>

        Getters.length = <%
            carray_double *array = (carray_double *)Local<External>::Cast( info.This()->GetInternalField( 1 ) )->Value();
            return Integer::New( array->size );
        %>
    }

    Export();
}
