#include"mpi.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
 
int main(int argc, char *argv[])
{
    int a[100][100], b[100][100];
    MPI_Datatype row, xpose;
    MPI_Aint sizeofint;
    int err, errs = 0;
    int bufsize, position = 0;
    void *buffer;
    int i, j;

    /* Initialize a to some known values. */
    for(i = 0; i < 100; i++) {
        for(j = 0; j < 100; j++) {
            a[i][j] = i*1000+j;
            b[i][j] = -1;
        }
    }
 
    MPI_Init(&argc, &argv);
 
    MPI_Type_extent(MPI_INT, &sizeofint);
 
    /* Create datatypes. */
    MPI_Type_vector(100, 1, 100, MPI_INT, &row);
    MPI_Type_hvector(100, 1, sizeofint, row, &xpose);
    MPI_Type_commit(&xpose);
 
    /* Pack it. */
    MPI_Pack_size(1, xpose, MPI_COMM_WORLD, &bufsize);
		printf("Bufsize %d\n", bufsize);
    buffer = (char *) malloc((unsigned) bufsize);
 
    /* To improve reporting of problems about operations, we change the error handler to errors return */
    /*MPI_Comm_set_errhandler( MPI_COMM_WORLD, MPI_ERRORS_RETURN );*/
 
    err = MPI_Pack(a, 1, xpose, buffer, bufsize, &position, MPI_COMM_WORLD);
		printf("Poss %d\n", position);
 
    /* Unpack the buffer into b. */
    position = 0;
    err = MPI_Unpack(buffer, bufsize, &position, b, 100*100, MPI_INT, MPI_COMM_WORLD);
 
    for (i = 0; i < 100; i++) {
        for (j = 0; j < 100; j++) {
            if(b[i][j] != a[j][i]) {
                errs++;
                fprintf(stderr, "b[%d][%d] = %d, should be %d\n", i, j, b[i][j], a[j][i]);fflush(stderr);
            }
        }
    }
    MPI_Type_free(&xpose);
    MPI_Type_free(&row);
 
    MPI_Finalize();
    return 0;
}
	 
  	  	 
