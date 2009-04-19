import( "MPI" );
import( "io", true );

Me = MPI.Rank()
Threads = MPI.Size()
cover = []
if(Me == 0)
{
	inputfile = new File("010.ls", "rb")
		if ( !inputfile.IsOpen() )
			throw "Could not open file";
		//print("Reading file")
		while(!inputfile.IsEof)
		{
			y = inputfile.Read().Chomp()
			cover.push(y)
		}
		//print("Cover length "+cover.length)
		pieces = MPI.Pack_size(cover)
		print("Pack size required for full data " + pieces)
		pieces = (pieces/4096)
		print("Root made "+pieces)
		MPI.Send(pieces)
		//print("# of pieces " + pieces)
		for(i = 0; i < pieces; i++)
		{
			temps = cover.slice(i*157, (i+1)*157)
			//print("Pack size required for sliced data" + MPI.Pack_size(temps))
			MPI.Send(temps)
		}
}
else
{
	pieces = 0.0
	pie = 0
	pie = MPI.Send(pieces)
	print("Rx "+pie)
	localcover = []
	cover = []
	//print("**************************" + pie);
	for(i = 0; i <= pie; i++)
	{
		tempr = MPI.Send(cover)
		localcover = localcover.concat(tempr)
	}
	//localcover = localcover.concat(MPI.Send(temp))
	print("Recieved cover length "+localcover.length)
}
