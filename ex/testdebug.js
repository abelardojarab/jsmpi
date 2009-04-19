import( "MPIdebug" );
import( "io", true );
MPI=MPIdebug;

Me = MPI.Rank();
Threads = MPI.Size();

if ( Me == 0 )
{
    print( "Hello from " + Me );
    for ( i=1; i<Threads; i++ )
    {
        Hello = MPI.Recv();
        print( Hello );
    }
}
else
    MPI.Send( "Hello from " + Me, 0 );
