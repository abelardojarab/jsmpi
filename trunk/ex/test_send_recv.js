import( "MPI" );
import( "io", true );

Me = MPI.Rank();
Threads = MPI.Size();
//funct = function(a){ return a+1}
function printo(o) {for(i in o) printf("%s,\n",o[i])}
obj= new Object();
obj1= new Object();
obj2= new Object();
obj.x= "Obj1val1"+Me;
obj.y= "Obj1val2"+Me;
//obj2.x= "Obj2val1";
//obj2.y= "Obj2val2";
//obj.x=obj1;
//obj.y=obj2;
sarr = [];

for(i=0; i<10;i++)
{
	sarr[i] = [];
	for(j=0;j<5;j++)
		sarr[i][j]="Hello " + (i*10+j);
}

if ( Me != 0 )
{

	Hello = MPI.Recv();
	print( "Recieved Successfully " + Me );
	//for(i=0; i<sarr.Length();i++)
		//print("Hello["+i+"] = "+Hello[i]);
//x=Hello.size();
	print(Hello)
	Hello.splice(0,2)
	print("********Spiced******** " + Hello)


}
else
{
	for ( i=1; i<Threads; i++ )
	{
		//t1=MPI.Wtime();
		print("Start sending");
		MPI.Send( sarr, i, Me );
		//t2=MPI.Wtime();
		print("Sent successfully to " + i );
	}
}
