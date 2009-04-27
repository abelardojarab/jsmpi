import("MPI")
import("io",true)
//y = "Damn it"
id = MPI.Rank()
si = MPI.Size()
y=0
z=0
if(id == 0)
{
	//y=File.Load("t.ls","rb").split("\n")
	//y.splice((y.length-1),1)
	//print(typeof(y))
	//print("length " +y.length)
  y=36
  z=20
	MPI.Bcast(0,y)
  //MPI.Barrier()
  MPI.Bcast(0,z)
}
else
{
	y=MPI.Bcast(0)
  //MPI.Barrier()
	z=MPI.Bcast(0)
	print("id = " + id +" data is = " + y )
	print("id = " + id +" data is = " + z )
}
