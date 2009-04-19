import( "MPI" );
import( "io", true );

Me = MPI.Rank();
Threads = MPI.Size();

result = MPI.Reduce(Me+1,1, 0);
print(result);
