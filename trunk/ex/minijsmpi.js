import("MPI")
import("io", true);

	id = MPI.Rank();
	sys_size = MPI.Size();
////// ********** Global Variables and handy function ************** ////////
	high = function(mychar){ if(mychar == "1" || mychar == "-" ) return 1; else return 0}
	low = function(mychar){ if(mychar == "0" || mychar == "-" ) return 1; else return 0}
	check1 = function(mychar){ if((high(mychar))&&(!low(mychar))) return true;	else return false;}
	check0 = function(mychar){ if((!high(mychar))&&(low(mychar))) return true;	else return false;}
	checkx = function(mychar){ if( mychar == "-" ) return true;	else return false;}
	
	nofx = function(nmycube){
		var countn=0
		var m=0
		//print(id +" nofx " + nmycube)
		for(m=0; m < nmycube.length; m++)
		{
			if(checkx(nmycube[m]))
				countn++
		}
		//print("countn " + countn)
		return countn}

	equal = function(emycube, ex){ // mycube and ex are of "cube" datatype
		//print("Entering equal")
		var ecount = 0
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

	equalx = function(exmycube, exx){ //exmycube and exx are "cube" datatype

		//print("Entering equalx")
		var exj = 0
		for(exj=0; exj < exmycube.length; exj++)
		{
			if(((check0(exx[exj])) && (check1(exmycube[exj]))) || ((check1(exx[exj])) && (check0(exmycube[exj]))))
				return false
		}
		return true}

	cubeprint = function(c2mycube, cl){
		//print("Entering cubeprint2")
		var c2j=0
		for(c2j = 0; c2j <= cl; c2j++)
		{
			print(c2mycube[c2j]);
		}
		print("\n");}

	absorb = function(a, b){
		//print(id  + " Entering absorb")
		var f1
		var f2
		if(nofx(a) == nofx(b))
		{
			//print("Cannot reduce" );
			return false;
		}
		else
		{
			if((nofx(a)) < (nofx(b)))
			{
				f1 = b
				f2 = a
		
			}
			else
			{
				f1 = a
				f2 = b
			}
		}
		var mcount = 0
		var abj=0
		for(abj=0; abj < f1.length; abj++)
		{
			if((check0(f1[abj]) && check1(f2[abj])) || (check0(f2[abj]) && check1(f1[abj])))
			{
				return false
			}
			else
			{
		
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
			return true
		}
		else
		{
			return false
		}
	}

	binate = function(a){ // datatype of a is cover
	//print("Entering binate")
		var vsize = 0
		var counter = []
		var xcount = 0
		var bivar = 0
		var bii = 0
		var bij =0
		for(bii=0; bii < a.length; bii++)
		{
			for(bij=0; bij < a[0].length; bij++)
			{
				if(bii == 0)
					counter[bij] = 0
				if(!checkx(a[bii][bij]))
					counter[bij] = (counter[bij] + 1)
			}
		}
		for(bii=0; bii < a[0].length; bii++)
		{
			if(counter[bii] > xcount)
			{
				xcount = counter[bii];
				bivar = bii;
			}
		}
		return bivar 
	}

	tautology =  function(a){ // Datatype of a is cover
	//print("Entering tautology" + MPI.Rank())
		if(a.length <= 0)
		{
				 //print("EMPTY COVER" );
			return false
		}
		vsize = a[0].length
		var tauti=0
		for(tauti=0; tauti < a.length; tauti++)
		{
			if((nofx(a[tauti])) == vsize)
			{
						 //print("ALL BLANKS" )
				return true
			}
		}
		for(tauti=0; tauti < vsize; tauti++)
		{
			var only1 = true
			var only0 = true
			var tautj = 0
			for(tautj=0; tautj < a.length; tautj++)
			{
				if(checkx(a[tautj][tauti]))
				{
					only0 = false
					only1 = false
					break
				}
				else
				{
					if(check0(a[tautj][tauti]))
					{
						only1 = false
					}
					if(check1(a[tautj][tauti]))
					{
						only0 = false
					}
					if((!only1) && (!only0))
					{
						break
					}
				}
			}
			if(only1 || only0)
			{
				//      //print("COLUMN WITH ONLY 0s or 1s" );
				return false
			}
		}
		var DC1 = [] // Datatype will be cover type
		//DC1[0]=[];
		var DCN = []// Datatype will be cover type
		//DCN[0] = [];
		var ureduction = true
		for(tauti=0; tauti < a.length; tauti++)
		{
			if((!checkx(a[tauti][0])) && (!checkx(a[tauti][vsize-1])))
			{
				ureduction = false
				break
			}
			else
			{
				if(checkx(a[tauti][0]))
				{
					var ttemp = "" // DataType cube
					for(tautj=1; tautj < a[tauti].length; tautj++)
					{
						ttemp=ttemp.concat(a[tauti][tautj])
					}
					DC1.push(ttemp) // DataType Cover
				}
				if(checkx(a[tauti][vsize-1]))
				{
					var ttemp = ""
					var tautk = 0
					for(tautk = 0; tautk < ((a[tauti].length) -1) ; tautk++)
					{
						ttemp=ttemp.concat(a[tauti][tautk])
					}
					DCN.push(ttemp)
				}
			}
		}
		if(ureduction)
		{
			if(DC1.length < DCN.length)
			{
				if(tautology(DC1))
					return true
				else if(tautology(DCN))
					return true
				else
				{
								//print("UNATE REDUCTION FAILED" );
					return false
				}
			}
			else
			{
				if(tautology(DCN))
					return true
				else if(tautology(DC1))
					return true
				else
				{
								//print("UNATE REDUCTION FAILED" );
					return false
				}
			}
		}
		else
		{
			var cox = []
			var cox_ = []
			var tautx="-"
			var tauti = binate(a)
			for(tautj=0; tautj < a.length; tautj++)
			{
				var ttemp = ""
				if(check0(a[tautj][tauti]))
				{
					for(tautk=0; tautk < a[tautj].length; tautk++)
					{
						if(tautk!=tauti)
						{
							ttemp=ttemp.concat(a[tautj][tautk])
						}
						else
						{
							ttemp=ttemp.concat(tautx)
						}
					}
					cox_.push(ttemp)
				}
				else if(check1(a[tautj][tauti]))
				{
					for(tautk=0; tautk < a[tautj].length; tautk++)
					{
						if(tautk!=tauti)
						{
							ttemp=ttemp.concat(a[tautj][tautk])
						}
						else
						{
							ttemp=ttemp.concat(tautx)
						}
					}
					cox.push(ttemp)
				}
				else if(checkx(a[tautj][tauti]))
				{
					for(tautk=0; tautk < a[tautj].length; tautk++)
					{
						if(tautk!=tauti)
						{
							ttemp=ttemp.concat(a[tautj][tautk])
						}
						else
						{
							ttemp=ttemp.concat(tautx)
						}
					}
					cox.push(ttemp)
					cox.push(ttemp)
				}
				else
				{
							 //print("ERROR IN PARSING" )
					exit(1)
				}
			}
			if(cox.length < cox_.length)
			{
						 //print("CALLING TO CHECK COFACTOR" );
				if(tautology(cox))
				{
								 //print("CALLING TO CHECK COFACTOR" );
					if(tautology(cox_))
						return true
					else
						return false
				}
				else
					return false
			}
			else
			{
						 //print("CALLING TO CHECK COFACTOR" );
				if(tautology(cox_))
				{
								 //print("CALLING TO CHECK COFACTOR" );
					if(tautology(cox))
						return true
					else
						return false
				}
				else
					return false
			}
		}
}

	absorption = function(cover){
		print("Message: Performing absorb over " + cover.length + " implicants.")
		var abscount=0
		var absj=0	
		var absi=0	
		for(absi=0; absi < cover.length-1; absi++)
		{
			absj = (absi+1)
			for(absj=absi+1; absj < cover.length-1;)
			{
					if(equal(cover[absi],cover[absj]))
					{
						//print("Erasing ")
						cover.splice(absj,1)
					}
					else
					{
						if(absorb(cover[absi],cover[absj]))
						{   
							abscount = abscount +1
							if(nofx(cover[absi]) < nofx(cover[absj]))
							{
								//print("Erasing <")
								cover[absi] = cover[absj]
								cover.splice(absj,1)
								absj = (absi+1)
							}
							else
							{
								//print("Erasing >")
								cover.splice(absj,1);
							}
							//print("Not erasing " + cover.length)
						}
						else
						{
							absj = (absj+1)
						}
					}
			}
		}
		//print("abscount: " + abscount + " and final cover size: " + cover.length)
}




//////**************************** Main Program starts here *********************************/////////////

	ME_P=0;
	ME_L=0;
	l=0;
	N=0;
	total_comm = 0

	// Check whether master-slave approach can be started
	if (sys_size < 2) 
	{
		//print("At least two processors are required to start master-slave processing.");
		return 1;
	}

	/* First we will read the content of the file, only for node 0 */
	if (id == 0) {

		cover = File.Load("015.ls", "rb").split("\n")
		//next we measure the time in node 0  
		wtime = MPI.Wtime()
		//if(cover[cover.length-1].length == 0)
			//cover.splice(cover.length-1, 1)
		print("Start Absorption")
		absorption(cover)

		isize = cover.length;
		print("Master: Initial cover size: " + isize)

		while(true)
		{
			N = cover.length;
			l = cover[0].length;

			print("Master: Current cover size is: " + N)
			//print(cover)
			//Indicate how big is the cover that we will be sending
			for(ME_P = 1; ME_P < sys_size; ME_P++) {

				//Indicate how big is the cover that we will be sending
				MPI.Send(N, ME_P,0);
			}
			//print("Master: Sending the number of implicants " + N + " to the nodes.");

			
			
			MPI.Send(l) // Broadcast from 0 to all with tag 0 (passed in the function)

			wtime_comm=MPI.Wtime()

			//print("Broadcasting the cover")
			//print("Cover length "+cover.length)
			pieces = MPI.Pack_size(cover)
			//print("Pack size required for full data " + pieces)
			pieces = (pieces/4096)
			//print("Root made "+pieces)
			MPI.Send(pieces)
			//print("# of pieces " + pieces)
			for(i = 0; i < pieces; i++)
			{
				temps = cover.slice(i*157, (i+1)*157)
				//print("Pack size required for sliced data" + MPI.Pack_size(temps))
				MPI.Send(temps)
			}
			//print("Broadcast complete")

			total_comm+=MPI.Wtime()-wtime_comm;

			for(iter=0; iter < cover.length;) //go over all implicants
			{
				temp_cube=cover[iter];
				//{
				/*********************Here starts code that is being parallelized******************************/

				j = 0 //initial bit being sent

				for(ME_P = 1; ME_P < sys_size; ME_P++) 
				{ //first initial set of bits to the processors
					MPI.Send(j, ME_P,0); //send the bit we want to analyze
					MPI.Send(iter, ME_P,0); //send the number of the implicant we are testing
					j++
				}

				 processed_bits = 0;
				////print("Master: We will process " + cover[0].length + " bits in parallel." );

				while(processed_bits < cover[0].length) { //receive bits and start assigning tasks again

					received_char = MPI.Recv()

					sender = MPI.Source(); /*This tells us which node has finished */
					bit_number = MPI.Tag(); /*This specifies number of bit which was sent for processing*/

					//Test if expansion was succesful and if yes, proceed
					if(received_char == "-")
					{
						tc=""
						tc=temp_cube.split("")
						tc[bit_number]="-"
						temp_cube=""
						for(i=0;i<tc.length;i++)
							temp_cube=temp_cube.concat(tc[i])
					}
					
					processed_bits++

					if(j < cover[0].length) { //send again a new task to processor that finished
						MPI.Send(j, sender,0)
						MPI.Send(iter, sender,0)
						j++                        
					}

					////print("Master: For the " + cover[0].length + " bits, " + processed_bits + " bits has been already processed." );
					if(processed_bits == cover[0].length) // ???? Is this really necessary 
						break
				}

				/*******************Here ends the code which it is being parallelized*************************/

				//for of going all chars of chosen implicant, parallelizable
				cover[iter] = temp_cube
				iter++;
			} //for

			//send order to finalize since all the cover was processed

			for(ME_P = 1; ME_P < sys_size; ME_P++) //first initial set of bits to the processors
			{
				MPI.Send(j, ME_P, 1); //1 is a flag to finalize
				j++
			}
			print("Start Re Absorption at ")
			print(cover)
			absorption(cover)

			//wtime_reduction = MPI.Wtime()-wtime_reduction;
			//wtime_reduction_total += wtime_reduction;

			if(isize <= cover.length)
			{
				break
			}
			else
			{
				isize = cover.length
			}

		} // while


		for(ME_P=1; ME_P < sys_size; ME_P++) { //send end for outer loop in slave nodes

			//Indicate how big is the cover that we will be sending
			MPI.Send(N, ME_P, 1);
		}

		wtime = MPI.Wtime()-wtime;
		//print("Master: Final cover is:")
		print("Master: Final cover size is: " + cover.length)
		print(cover)
		print("Wall clock elapsed seconds = " + wtime)
		print("Total time spent in transmitting the cover was = " + total_comm)



	} //end for if for id==0
	else { //do this if id is not 0
		var si = 0
		var sj = 0
		var temp_cube3 = ["0","1"]
		var nx = "-"
		var lcover = []
		while(1) { //keep waiting for the master to be sending tasks to them
			////print("Node #" + id + ": Starting external loop." );

			N = MPI.Recv(0)
			//print(id +"  "+ N + "  " + MPI.Tag())
			if(MPI.Tag() == 1) {
				print("Node #" + id + ": Received order to break external loop." );
				break //if we receive a status equal to 1 means that 
			}

			l = MPI.Send(l) // Broadcast from root=0 and tag=0;

			//print("Node #" + id + ": Received a cover size of " + N)
			//print("Node #" + id + ": Received an implicant size of " + l)

			//print("Recieving Broadcasted cover")
			pieces = 0.0
			pie = MPI.Send(pieces)
			//print("Rx "+pie)
			localcover = []
			//print("**************************" + pie);
			for(i = 0; i <= pie; i++)
			{
				tempr = MPI.Send(lcover)
				localcover = localcover.concat(tempr)
			}
			//print("Recieved cover is "+ localcover)

			/**********************Here starts code that has been migrated to the nodes***************/
			while(1) { //waiting for receiving from master order to analyze some bit of some implicant
				////print("Node #" + id + ": Starting internal loop." );

				j = MPI.Recv(0)
				////print("Node #" + id + ": Received order to analyze the " + j + "-th bit" );

				////print("Node #" + id + ": Received a status tag of: " + MPI.Tag());
				//print(id +"  "+ j + "  " + MPI.Tag())
				if(MPI.Tag() == 1) {

					////print("Node #" + id + ": Received the order to break internal loop." );

					break //if it has order of finalize do so
				}
				i = MPI.Recv(0)
				//print("Node #" + id + ": will work over the " + i + "-th implicant and bit #" + j  )

				temp_cube3 = localcover[i] //pick implicant for analysis
				//temp_cube3 = ["0"] //pick implicant for analysis
				//print("Typeof " + typeof(localcover))
				//print("id #" + id+" checkx "+checkx(temp_cube3[j]) + " temp_cube3["+j+"]" + temp_cube3[j] )
				if(!checkx(temp_cube3[j])) //try to raise char from 1 or 0 to DC
				{
					store = temp_cube3[j]
					//print(temp_cube3[j])
					//temp_cube3[j]="-"
					x=""
					x=temp_cube3.split("")
					x[j]="-"
					temp_cube3=""
					for(i=0;i<x.length;i++)
						temp_cube3=temp_cube3.concat(x[i])
					//vector<cube> cofac;
					var cofac = []
					var k = 0 
					for( k=0; k < localcover.length; k++) //go over all remaining implicants
					{
						//print("id #" + id + " equalx " +equalx(localcover[k],temp_cube3)  + " localcover["+k+"] "+localcover[k]+ " temp_cube3 "+ temp_cube3)
						if(equalx(localcover[k],temp_cube3))
						{
							var cocube = ""
							var ll = 0
							for( ll=0; ll < localcover[k].length;ll++)
							{
								//print("id #" + id + " checkx "+checkx(temp_cube3[ll]) + " temp_cube3["+ll+"] " + temp_cube3[ll])
								if(checkx(temp_cube3[ll]))
								{
									//cocube.push(localcover[k][ll])
									cocube=cocube.concat(localcover[k][ll])
								}
								else
								{
									//cocube.push(nx)
									cocube=cocube.concat("-")
								}
							}
							cofac.push(cocube.toString()) //create the cofactor based on the expanded implicant
						}
					} // end of the for that goes through all implicants
					//print("Here" + cofac.length)
					if(!tautology(cofac)) //check tautology over the cofactor, if not true reject expansion
					{
						//temp_cube3[j] = store //restore temp to initial value if not ok expansion
						x = ""
						x = temp_cube3.split("")
						x[j] = store
						temp_cube3 = ""
						for(i=0;i<x.length;i++)
							temp_cube3=temp_cube3.concat(x[i])
					}
				}  //if of trying to raise 0 or 1 to DC

				//print("done with tautology " + temp_cube3[j])
				MPI.Send(temp_cube3[j], 0, j) //send the value of the bit and set tag to j-th
			}
			/************Here ends the code which has been migrated to the nodes***********/

		} //end for while(1), slave waiting for master to send him/her a task
		//free(buffer);
	} //end of else for id==0

	//MPI.Finalize();
