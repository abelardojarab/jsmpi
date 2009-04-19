import("MPI")
import("io", true)

print( "Hello from " + MPI.Rank() + " of " + MPI.Size() )
