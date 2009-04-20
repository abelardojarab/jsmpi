import("MPI")
import("io", true);

////// ********** Global Variables and handy function ************** ////////
	cover = [];
	high = function(a){ if(a == "1" || a== "-" ) return 1; else return 0;}
	low = function(a){ if(a == "0" || a== "-" ) return 1; else return 0;}
	check1 = function(mychar){ if((high(mychar))&&(!low(mychar))) return true;	else return false;}
	check0 = function(mychar){ if((!high(mychar))&&(low(mychar))) return true;	else return false;}
	checkx = function(mychar){ if( mychar == "-" ) return true;	else return false;}
	
	nofx = function(nmycube){
		countn=0
		var m=0
		for(m=0; m < nmycube.length; m++)
		{
			if(checkx(nmycube[m]))
				countn++
		}
		return countn}

	equal = function(emycube, ex){ // mycube and ex are of "cube" datatype
		print("Entering equal")
		ecount = 0
		var n=0
		for(n=0; n < emycube.length; n++)
		{
			if(emycube[n] == ex[n])
				ecount++;
		}
		if(ecount == emycube.length)
			return true;
		else
			return false;}

	equalx = function(exmycube, exx){
		print("Entering equalx")
		for(exj=0; exj < exmycube.length; exj++)
		{
			if(((check0(exx[exj])) && (check1(exmycube[exj]))) || ((check1(exx[exj])) && (check0(exmycube[exj]))))
				return false;
		}
		return true;}

	cubeprint = function(c1mycube){
		//print("Entering cubeprint1")
		var c1j=0
		for(c1j=0; c1j < c1mycube.length; c1j++)
		{
			cubeprint(c1mycube[c1j]);
		}
		print("\n");}

	cubeprint = function(c2mycube, cl){
		//print("Entering cubeprint2")
		var c2j=0
		for(c2j = 0; c2j <= cl; c2j++)
		{
			cubeprint(c2mycube[c2j]);
		}
		print("\n");}

	absorb = function(a, b){
		print("Entering absorb")
		if(nofx(a) == nofx(b))
		{
			////print("Cannot reduce" );
			return false;
		}
		else
		{
			//cuenta++;
			if((nofx(a)) < (nofx(b)))
			{
				f1 = b;
				f2 = a;
		
			}
			else
			{
				f1 = a;
				f2 = b;
			}
		}
		mcount = 0;
		var abj=0
		for(abj=0; abj < f1.length; abj++)
		{
			//if((f1[abj].check0()&&f2[abj].check1())||(f2[abj].check0()&&f1[abj].check1()))
			if((check0(f1[abj]) && check1(f2[abj])) || (check0(f2[abj]) && check1(f1[abj])))
			{
				//     //print("Disjo" );
				return false;
			}
			else
			{
		
				////print("Mcount: " + mcount);
				////print(a);
				////print(b);
		
				if(checkx(f1[abj]))
				{
					mcount++;
				}
				else if(!checkx(f2[abj]))
				{
					mcount++;
				}
			}
		}
		if(mcount == f1.length)
		{
		
			////print("Absorbing " );
			////print(f1);
			////print(f2);
		
			return true;
		}
		else
		{
			return false;
		}}

	binate = function(a){ // datatype of a is cover
	print("Entering binate")
		vsize = 0;
		counter = [];
		
		//counter=(*) malloc(vsize*sizeof()); //allocate memory, visual c++ claims about this
		
		xcount = 0;
		bivar = 0;
		for(bii=0; bii < a.length; bii++)
		{
			for(bij=0; bij < a[bii].length; bij++)
			{
				if(bii == 0)
					counter[bij] = 0;
				if(!checkx(a[bii][bij]))
					counter[bij]++;
			}
		}
		for(bii=0; bii < a.length; bii++)
		{
			if(counter[bii] > xcount)
			{
				xcount = counter[bii];
				bivar = bii;
			}
		}
		//free(counter); //added this line, not in original source code
		return bivar }

	tautology =  function(a){ // Datatype of a is cover
	print("Entering tautology")
		//  //print("COVER CHECK" );
		//  //print(a.length);
		//  for( i=0;i<a.length;i++)
		//  a[i].//print();
		vsize = a[0].length
		if(a.length <= 0)
		{
				 //print("EMPTY COVER" );
			return false;
		}
		for(tauti=0; tauti < vsize; tauti++)
		{
			if((nofx(a[tauti])) == vsize)
			{
						 //print("ALL BLANKS" );
				return true;
			}
		}
		for(tauti=0; tauti < vsize; tauti++)
		{
			only1 = true;
			only0 = true;
			for(tautj=0; tautj < a.length; tautj++)
			{
				if(checkx(a[tautj][tauti]))
				{
					only0 = false;
					only1 = false;
					break;
				}
				else
				{
					if(check0(a[tautj][tauti]))
					{
						only1 = false;
					}
					if(check1(a[tautj][tauti]))
					{
						only0 = false;
					}
					if((!only1) && (!only0))
					{
						break;
					}
				}
			}
			if(only1 || only0)
			{
				//      //print("COLUMN WITH ONLY 0s or 1s" );
				return false;
			}
		}
		DC1 = []; // Datatype is cover type
		//DC1[0]=[];
		DCN = [];// Datatype is cover type
		//DCN[0] = [];
		ureduction = true;
		for(tauti=0; tauti < a.length; tauti++)
		{
			if((!checkx(a[tauti][0])) && (!checkx(a[tauti][vsize-1])))
			{
				ureduction = false;
				break;
			}
			else
			{
				if(checkx(a[tauti][0]))
				{
					ttemp = []; // DataType cube
					for(tautj=0; tautj < a[tauti].length; tautj++)
					{
						ttemp.push(a[tauti][tautj]);
					}
					DC1.push(ttemp); // DataType Cover
				}
				if(checkx(a[tauti][vsize-1]))
				{
					ttemp = [];//
					for(tautk = 0; tautk < (a[tauti].length-1) ; tautk++)
					{
						ttemp.push(a[tauti][tautk]);
					}
					DCN.push(ttemp);
				}
			}
		}
		if(ureduction)
		{
			//   //print("printing DC1" );
			//   for( tauti =0;tauti<DC1.length;tauti++)
			//   DC1[tauti].//print();
			//   //print("printing DCN" );
			//   for( tauti =0;tauti<DCN.length;tauti++)
			//   DCN[tauti].//print();
			if(DC1.length < DCN.length)
			{
				if(tautology(DC1))
					return true;
				else if(tautology(DCN))
					return true;
				else
				{
					//       //print("UNATE REDUCTION FAILED" );
					return false;
				}
			}
			else
			{
				if(tautology(DCN))
					return true;
				else if(tautology(DC1))
					return true;
				else
				{
					//       //print("UNATE REDUCTION FAILED" );
					return false;
				}
			}
		}
		else
		{
			//vector<cube> cox;
			//vector<cube> cox_;
			cox = [];
			cox_ = [];
			//char tautx;
			tautx='-';
			tauti = binate(a);
			c=0;
			c_=0;
			//   //print("Cofactor variable " + tauti);
			for(tautj=1; tautj < a.length; tautj++)
			{
				//cube temp;
				ttemp = [];
				if(check0(a[tautj][tauti]))
				{
					for(tautk=0; tautk < a[tautj].length; tautk++)
					{
						if(tautk!=tauti)
							ttemp.push(a[tautj][tautk]);
						else
						{
							ttemp.push(tautx);
						}
					}
					c_ = cox_.push(ttemp);
				}
				else if(check1(a[tautj][tauti]))
				{
					for(tautk=0; tautk < a[tautj].length; tautk++)
					{
						if(tautk!=tauti)
							ttemp.push(a[tautj][tautk]);
						else
							ttemp.push(tautx);
					}
					c = cox.push(ttemp);
				}
				else if(checkx(a[tautj][tauti]))
				{
					for(tautk=0; tautk < a[tautj].length; tautk++)
					{
						if(tautk!=tauti)
							ttemp.push(a[tautj][tautk]);
						else
							ttemp.push(tautx);
					}
					c = cox.push(ttemp);
					c_ = cox.push(ttemp);
				}
				else
				{
					//      //print("ERROR IN PARSING" );
					exit(1);
				}
			}
			if(c < c_)
			{
				//      //print("CALLING TO CHECK COFACTOR" );
				if(tautology(cox))
				{
					//        //print("CALLING TO CHECK COFACTOR" );
					if(tautology(cox_))
						return true;
					else
						return false;
				}
				else
					return false;
			}
			else
			{
				//      //print("CALLING TO CHECK COFACTOR" );
				if(tautology(cox_))
				{
					//        //print("CALLING TO CHECK COFACTOR" );
					if(tautology(cox))
						return true;
					else
						return false;
				}
				else
					return false;
			}
		}
}

	absorption = function(){
		print("Entering absorption")
		abscount=0;
		print("Absorb cover of size " + cover.length);
		absj=0;	
		for(absi=0; absi < cover.length-1; absi++)
		{
			absj = (absi+1)
			for(absj=absi+1; absj < cover.length-1;)
			{
					if(equal(cover[absi],cover[absj]))
					{
						//print(cover[absi])
						//print(cover[absj])
						//print(cover[absj+2])
						cover.splice(absj,1)
						//absj = (absj+1)
						//print("Erasing " + cover.length + "  " + cover[absj])
					}
					else
					{
						if(absorb(cover[absi],cover[absj]))
						{   
							abscount = abscount +1
							if(nofx(cover[absi]) < nofx(cover[absj]))
							{
								//print(cover[absi])
								//print(cover[absj])
								//print(cover[absj+2])
								cover[absi] = cover[absj]
								cover.splice(absj,1)
								absj = (absi+1)
								//print("yes nofx " + cover.length + "  " + cover[absj])
							}
							else
							{
								//print(cover[absi])
								//print("absj-1 = " + cover[absj-1])
								//print("absj   = " + cover[absj])
								//print("absj+1 = " + cover[absj+1])
								cover.splice(absj,1);
								//absj = (absj+1)
								//print("no nofx " + cover.length )
								//print("absj-2 = " + cover[absj-2])
								//print("absj-1 = " + cover[absj-1])
								//print("absj   = " + cover[absj])
							}
							//print("Not erasing " + cover.length)
						}
						else
						{
							//print("no absorb " + absj)
							absj = (absj+1)
							//print("no absorb " + absj)
						}
					}
				//}
				//print("absi " + absi + " absj "+ absj + " cover.length " + cover.length)
			}
		}
		print("abscount: " + abscount + " and final cover size: " + cover.length)
}

	rabsorb = function(a, index){ // a and index are unsighend ints
	print("Entering rabsorb")
		rtemp = [];
		tcube = cover[a];
		tindex = 0;
		rindex = index;
		//  //print("ORIGINAL INDEX " + rindex);
		for(rabi=0; rabi < cover.length; rabi++)
		{
			if(absorb(cover[a],cover[rabi]))
			{
				if(rabi > a )
				{
					//        //print("INDEX OF MIN" + tindex);
					rtemp[tindex]=cover[rabi];
					for(rabj=rabi+1; rabj < cover.length; rabj++)
					{
						rtemp.push(cover[rabj]);
					}
					cover = rtemp;
					return 0;
				}
				else
				{
					for(rabj=rabi; rabj < cover.length; rabj++)
					{
						if(rabj!=a)
							rtemp.push(cover[rabj]);
					}
					cover = rtemp;
					return 0;
				}
			}
			else
			{
		
				rtemp.push(cover[rabi]);
				if(rabi == a)
					tindex=rtemp.length-1;
			}
		}
		cover = rtemp;
		//  //print("MODIFIED INDEX " + (rindex+1));
		return (rindex+1);
}


	cabsorb = function(a, index) // called in main as i=casorb(temp,i), temp is temporary cube, cover[i] cube under analysis
	{
	print("Entering cabsorb")
	ctemp = [];
	acount = 0;
	tindex = 0;
	for(cabi=0; cabi < cover.length; cabi++) //go through all implicants
	{
		if(equal(a,cover[cabi])) 
		{
			if(cabi < index)
			{
				for(cabj = cabi; cabj < cover.length; cabj++)
				{
					if(cabj!= index)
						ctemp.push(cover[cabj]);
				}
				cover=ctemp;
				return index;
			}
			if(cabi == index)
			{
				ctemp.push(cover[cabi]);
				tindex = ctemp.length-1;
			}
			if(cabi> index)
			{
				for(cabj = index+1; cabj < cover.length; cabj++)
				{
					if(tindex > ctemp.length)
						ctemp.push(cover[cabj]);
					else
						ctemp[tindex]=cover[cabj];
					tindex++;
				}

				cover = ctemp;

				return index;
			}
		}
		else if(absorb(a,cover[cabi]))
		{
			if(cabi == index)
				ctemp.push(a);
			if(cabi < index) 
				acount++;
		}
		else
			ctemp.push(cover[cabi]);
	}
	cover = ctemp;
	return (index-acount+1);
}

//////**************************** Main Program starts here *********************************/////////////

	ME_P=0;
	ME_L=0;
	l=0;
	N=0;
	id= MPI.Rank();
	sys_size = MPI.Size();
	total_comm = 0

	// Check whether master-slave approach can be started
	if (sys_size < 2) 
	{
		//print("At least two processors are required to start master-slave processing.");
		return 1;
	}

	/* First we will read the content of the file, only for node 0 */
	if (id == 0) {

		inputfile = new File("010.ls", "rb")
		if ( !inputfile.IsOpen() )
			throw "Could not open file";
		//print("Reading file")
		while(!inputfile.IsEof)
		{
			y = inputfile.Read().Chomp()
			cover.push(y)
		}
		//next we measure the time in node 0  
		wtime = MPI.Wtime()

		//print("Before absorption " + cover.length)
		absorption()

		isize = cover.length;
		print("Initial cover size: " + isize)

		while(true)
		{
			x = '-';

			N = cover.length;
			l = cover[0].length;

			//print("Current cover size is:" + N)

			//Indicate how big is the cover that we will be sending
			for(ME_P = 1; ME_P < sys_size; ME_P++) {

				//Indicate how big is the cover that we will be sending

				MPI.Send(N, ME_P);

			}

			//print("Master: Sending the number of implicants " + N + " to the nodes.");

			//MPI.Bcast(&l, 1,  0);
			
			
			MPI.Send(l) // Broadcast from 0 to all with tag 0 (passed in the function)

			wtime_comm=MPI.Wtime()

			//print("Broadcasting the cover of length "+ cover.length + "First 2 implicants " + cover[0] + "\t" + cover[1] + "last 2 implicant" + cover[cover.length-2] + "\t" + cover[cover.length-1])
			print("Broadcasting the cover")
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
			print("Broadcast complete")

			total_comm+=MPI.Wtime()-wtime_comm;

			for(iter=0; iter < cover.length;) //go over all implicants
			{
				////print("Master: We will analyze now implicant #" + i);
				temp=cover[iter];
				//for( j=0;j<cover[i].length;j++) //go over all chars of the chosen implicant, parallelizable
				//{
				/*********************Here starts code that is being parallelized******************************/

				j = 0; //initial bit being sent

				for(ME_P = 1; ME_P < sys_size; ME_P++) 
				{ //first initial set of bits to the processors
					MPI.Send(j, ME_P); //send the bit we want to analyze
					MPI.Send(iter, ME_P); //send the number of the implicant we are testing
					j++;
				};

				processed_bits = 0;
				////print("Master: We will process " + cover[0].length + " bits in parallel." );

				while(processed_bits < cover[0].length) { //receive bits and start assigning tasks again

					//receive result of the test
					////print("Master: Waiting to receive a processed bit." );
					//MPI.Recv (&received_char, 1,  MPI.ANY_SOURCE, status);
					received_char = MPI.Recv()

					sender = MPI.Source(); /*This tells us which node has finished */
					bit_number = MPI.Tag(); /*This specifies number of bit which was sent for processing*/

					////print("Master: I received bit #" + bit_number + " from node #" + sender);

					//Test if expansion was succesful and if yes, proceed
					if(received_char == '-') 
						temp[bit_number] = '-';
					
					processed_bits++;

					if(j < cover[0].length) { //send again a new task to processor that finished
						MPI.Send(j, sender);
						MPI.Send(iter, sender);
						j++;                        
					};

					////print("Master: For the " + cover[0].length + " bits, " + processed_bits + " bits has been already processed." );
					if(processed_bits==cover[0].length) // ???? Is this really necessary 
						break;
				}


				/*******************Here ends the code which it is being parallelized*************************/

				//}
				//for of going all chars of chosen implicant, parallelizable

				if(!equal(temp,cover[iter])) //if expansion was not succesful (out of the loop can be parallelized)
				{
					iter = cabsorb(temp,iter);
				}
				else //if expansion was succesful, go to next implicant
					iter++;
			} //for

			//send order to finalize since all the cover was processed

			for(ME_P = 1; ME_P < sys_size; ME_P++) //first initial set of bits to the processors
			{
				MPI.Send(j, ME_P, 1); //1 is a flag to finalize
				j++;
			}

			////print("Master: Order to finalize and proceed with next implicant sent to nodes." );

			//wtime_expansion = MPI.Wtime() - wtime_expansion;
			//wtime_expansion_total += wtime_expansion;

			//wtime_reduction = MPI.Wtime();
			//  //print("REDUCTION" );
			for(mai=0; mai < cover.length; mai++)
			{
				for( maj=0 ; maj < cover[mai].length;)
				{
					temp=cover[mai];
					reduce = false;
					if(checkx(cover[mai][maj]))
					{
						//assign0(cover[mai][maj]);
						cover[mai][maj] = '0';
						//assign1(temp[maj] = '1';
						temp[maj] = '1';
						for( mak = 0; mak < cover.length; mak++)
						{
							if(absorb(temp,cover[k])) //call to absorb
							{
								reduce = true;
								break;
							}
						}
						if(reduce)
						{
							// //print("REDUCE ZERO ALLOWED!!!" + maj);
							maj=rabsorb(mai,maj);
							// //print("NEXT INDEX " + maj);
						}
						else
						{
							// //print("REDUCE ZERO NOT ALLOWED" + maj);
							//assign1(cover[mai][maj]);
							cover[mai][maj] = '1';
							//assign0(temp[maj]);
							temp[maj] = '0';
							for( k=0; k < cover.length; k++)
							{
								if(absorb(temp,cover[k])) //call to absorb
								{
									reduce = true;
									break;
								}
							}
							if(reduce)
							{
								// //print("REDUCE ONE ALLOWED!!!" + maj);
								maj=rabsorb(mai,maj); //call to rasorb
							}
							else
							{
								// //print("REDUCE ONE NOT ALLOWED" );
								//assignx(cover[mai][maj]);
								cover[mai][maj] = '-';
								maj++;
							}
						}
					}
					else
					{
						maj++;
						//  //print("NO X" );
					}
				} // for
			} // for

			//wtime_reduction = MPI.Wtime()-wtime_reduction;
			//wtime_reduction_total += wtime_reduction;

			if(isize <= cover.length)
			{
				break;
			}
			else
			{
				isize = cover.length;
			}

		} // while


		for(ME_P=1; ME_P < sys_size; ME_P++) { //send end for outer loop in slave nodes

			//Indicate how big is the cover that we will be sending
			MPI.Send(N, ME_P, 1);
		}

		wtime = MPI.Wtime()-wtime;
		for( i=0; i < cover.length;i++)
		{
			//print(cover[i]);
		}

		//print("Final cover size is: " + cover.length)
		//print("Wall clock elapsed seconds = " + wtime)
		//print("Total time spent in transmitting the cover was = " + total_comm)



	} //end for if for id==0
	else { //do this if id is not 0
		step=0;

		while(1) { //keep waiting for the master to be sending tasks to them
			////print("Node #" + id + ": Starting external loop." );

			N = MPI.Recv(0)

			if(MPI.Tag() == 1) {
				////print("Node #" + id + ": Received order to break external loop." );
				break; //if we receive a status equal to 1 means that 
			}

			l = MPI.Send(l) // Broadcast from root=0 and tag=0;

			//print("Node #" + id + ": Received a cover size of " + N)
			//print("Node #" + id + ": Received an implicant size of " + l)

			print("Recieving Broadcasted cover")
			pieces = 0.0
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

			//localcover = new Array(lcover)
			//print("Recieved Cover of size " + localcover.length + " first element " + localcover[0] + " last element " + localcover[localcover.length-1])

			localcover.splice(N-1, localcover.length-N) // localcover is now of size N
			//print("After splicing " + localcover.length + " first element " + localcover[0] + " last element " + localcover[localcover.length-1])

			/**********************Here starts code that has been migrated to the nodes***************/
			while(1) { //waiting for receiving from master order to analyze some bit of some implicant
				////print("Node #" + id + ": Starting internal loop." );

				j = MPI.Recv(0);
				////print("Node #" + id + ": Received order to analyze the " + j + "-th bit" );

				////print("Node #" + id + ": Received a status tag of: " + MPI.Tag());

				if(MPI.Tag() == 1) {

					////print("Node #" + id + ": Received the order to break internal loop." );

					break; //if it has order of finalize do so
				}
				i = MPI.Recv(0)
				//print("Node #" + id + ": will work over the " + i + "-th implicant" )

				temp = localcover[i] //pick implicant for analysis

				//char store;
				if(!checkx(temp[j])) //try to raise char from 1 or 0 to DC
				{
					store = temp[j]
					temp[j]='-'
					//vector<cube> cofac;
					cofac = []

					for( k=0; k < localcover.length; k++) //go over all remaining implicants
					{
						if(equalx(localcover[k],temp))
						{
							cocube = []
							for( ll=0; ll < localcover[k].length;ll++)
							{
								if(checkx(temp[ll]))
								{
									cocube.push(localcover[k][ll])
								}
								else
								{
									nx = '-'
									cocube.push(nx)
								}
							}
							cofac.push(cocube) //create the cofactor based on the expanded implicant
						}
					} // end of the for that goes through all implicants
					//print("Here" + cofac.length)
					if(!tautology(cofac)) //check tautology over the cofactor, if not true reject expansion
					{
						temp[j] = store //restore temp to initial value if not ok expansion
					}
				}  //if of trying to raise 0 or 1 to DC

				MPI.Send(temp[j], 0, j) //send the value of the bit and set tag to j-th
			}
			/************Here ends the code which has been migrated to the nodes***********/

		} //end for while(1), slave waiting for master to send him/her a task
		//free(buffer);
	} //end of else for id==0

	//MPI.Finalize();
