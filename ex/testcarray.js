import("CArray");
import("io", true);

// Test double array
y = new CArray.Double( 3 )
y[0] = 4.234
y[1] = 2
y[2] = 640.24e9
print( "Integer array:" )
for ( i=0; i<3; i++ )
    print( y[i] )
print()

// Test integer array
x = new CArray.Integer( 5 )
x[0] = 2
x[1] = 3.13
x[2] = 84
x[3] = 43
x[4] = "Well this isn't valid at all"
print( "Double array:" )
for ( i=0; i<5; i++ )
    print( x[i] )
