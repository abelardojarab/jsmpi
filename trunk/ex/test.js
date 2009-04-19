import( "MPI" );
import( "io", true );

Me = MPI.Rank();
Threads = MPI.Size();
funct = function(a){ return a+1} 
sarr = [];
for(i=0; i<10;i++)
{
	//print("sarr["+i+"]="+i);
	sarr[i] = "Hello "+i;
}
if ( Me != 0 )
{

    //for ( i=1; i<Threads; i++ )
    //{
				Hello = MPI.Recv();
				print( "Recieved Successfully " + Me );
				//print("The tag is " + MPI.Tag());
				//print("The source is " + MPI.Source());
    //}
		print(Hello(4));

}
else
{
    for ( i=1; i<Threads; i++ )
    {
			t1=MPI.Wtime();
			MPI.Send( funct, i, Me );
			t2=MPI.Wtime();
			print("Sent successfully to " + i + " in " + (t2-t1) + "S:ecs");
    }
}
