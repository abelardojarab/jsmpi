import("Sample", true);
import("io", true);

// Show off functions
SampleFunction()

// Show off methods and accessors
SampleInstanceA = new SampleClassA();
SampleInstanceA.SampleMethod();
SampleInstanceA.SampleSetter = "Hello";
dummy = SampleInstanceA.SampleGetter;
delete SampleInstanceA;
delete SampleClassA;

// Show off interceptors
SampleInstanceB = new SampleClassB();
dummy = SampleInstanceB[42];
dummy = SampleInstanceB.AnyProperty;
SampleInstanceB[21] = "Hello";
SampleInstanceB.AnyProperty = "Hello";

b = []
for (a=0; a<1000000; a++ )
{
   b.push( a );   
}



