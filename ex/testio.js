import("io", true)

// Test read/write
x = new File("Hello.txt", "w");
if ( !x.IsOpen() )
    throw "Could not open file";

x.Write("twenty");
x.Write("number", 20 );
x.Close();

x.Open( "Hell.txt" )
if ( !x.IsOpen() )
    throw "Could not open file";
y=[];
i=0;
while(x.IsEof == false)
{
	print(x.IsEof)
	y[i]=x.Read().Chomp()
	print(y[i])
	print(x.IsEof)
	i++
}
//y[1]=x.Read().Chomp();
//y[2]=x.Read().Chomp();
for(i=0; i<y.length; i++)
	for(j=0; j<y[i].length; j++)
		print(y[i][j])
//print( "Line:", x.Read().Chomp() )
//print( "Line:", x.Read().Chomp() )
print( "Position:", x.Position )
x.Position -= 10
print( "Moved to:", x.Position )
print( "Line:", x.Read().Chomp() )
x.Close()

// Test pack/unpack
x.Open( "Hello.data", "wb" )
x.Pack( "iH2d5s", 42, 47, 1.2, 2.1, "Hello" );
x.Close();

x.Open( "Hello.data", "rb" )
print( "Packed data:", x.Unpack( "iH2d5s" ) )
x.Close();
