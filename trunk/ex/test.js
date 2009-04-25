import("MPI")
import("io",true)
//y = "Damn it"
id = MPI.Rank()
si = MPI.Size()
y=0
if(id == 0)
{
	y=File.Load("015.ls","rb").split("\n")
	y.splice((y.length-1),1)
	print(typeof(y))
	print("length " +y.length)
}
	//MPI.Bcast(0,y)
	//for(i=1; i<si; i++)
		//MPI.Send(y,i)
//}else
//{
	y=MPI.Bcast(0,y)
	//x=MPI.Recv(0)
	if(id != 0)
	print("id = " + id +" data is = " + y )
//}
