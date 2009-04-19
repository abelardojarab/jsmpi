import("cpp");

Sample = new cpp.Plugin( "Sample" );
with( Sample )
{
    Include( "<stdlib.h>" );
    Include( "<stdio.h>" );
    Include( "<string.h>" );
    Include( "<math.h>" );
    Link( "m" );

    Init = <%
        printf( "Initial code\n" );
    %>

    Exit = <%
        printf( "Exit code\n" );
    %>

    Extra = <%
        void extra_function()
        {
            printf( "Extra Function\n" );
        }
    %>;

    Functions.SampleFunction = <%
        printf( "SampleFunction\n" );
        extra_function();
        printf( "Using Link: Cos(1) = %f\n", cos(1) );

        return Undefined();
    %>;

    // Create class "SampleClassA" with one internal field
    Classes.SampleClassA = new Sample.Class( "SampleClassA", 1 );
    with ( Classes.SampleClassA )
    {
        // x = new Sample()
        Constructor = <%
            printf( "SampleClassA constructor\n" );
        %>;

        // Called by garbage collector
        Destructor = <%
            printf( "SampleClassA destructor\n" );
        %>;

        // y = x.SampleGetter...
        Getters.SampleGetter = <%
            Handle<Value> value = info.This()->GetInternalField( 0 );
            String::Utf8Value StrValue( value->ToString() );
            printf( "SampleClassA.SampleGetter getter\n" );
            printf( "Retrieving internal value \"%s\"\n", *StrValue );
            return value;
        %>;

        // x.SampleSetter = ...
        Setters.SampleSetter = <%
            info.This()->SetInternalField( 0, value );
            String::Utf8Value StrValue( value->ToString() );
            printf( "SampleClassA.SampleSetter setter\n" );
            printf( "Storing \"%s\" internally\n", *StrValue );
        %>;

        // x.C( 42 )
        Methods.SampleMethod = <%
            printf( "SampleClassA.SampleMethod\n" );
        %>;
    }

    Classes.SampleClassB = new Sample.Class( "SampleClassB" );
    with( Classes.SampleClassB )
    {
        // y = x.anyProperty
        NamedGetter = <%
            String::Utf8Value cProperty( property );
            printf( "SampleClassB named getter: %s\n", *cProperty );
            return True();
        %>;

        // x.anyProperty = ...
        NamedSetter = <%
            String::Utf8Value cProperty( property );
            printf( "SampleClassB named setter: %s\n", *cProperty );
            return Undefined();
        %>

        // y = x[anyNumber]
        IndexedGetter = <%
            printf( "SampleClassB indexed getter: %d\n", index );
            return True();
        %>;

        // x[anyNumber] = ...
        IndexedSetter = <%
            printf( "SampleClassB indexed setter: %d\n", index );
            return Undefined();
        %>;
    }

    Export();
}
