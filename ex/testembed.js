import("cpp");
cpp.Include("<cstdio>");

for ( i=0; i<5; i++ )
{
    myKernel = cpp.Embed( "myKernel", <%
        // C++ Code
        String::Utf8Value arg0( args[0] );
        printf( "%s\n", *arg0 );
    %> );
    myKernel( "Hello!" );
}

