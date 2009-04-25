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
					cox_.push(ttemp)
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
		cover.sort();
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

absorption3 = function(a3a, a3b)
{

	//cout<<"Masked absorption."<<endl;
	//sort(a.begin(),a.end());
	var a3count = 0;
	var a3i = 0
	var ib = 0
	var a3j = 0
	var jb = 0
	//cout<<"Message: Performing absorb over "<<a.size()<<" implicants."<<endl;
	//cout<<"Message: Implicants were:"<<endl;
	for(a3i=0; a3i < (a3a.length-1); a3i++)
	{
		jb=ib+1
		for(a3j=a3i+1; a3j < (a3a.length-1);)
		{

			if(equal(a3a[a3i],a3a[a3j]))
			{
				//cout<<"Erasing "<<endl;
				//print(*i);
				//print(*j);
				a3b.splice(jb, 1)
				a3a.splice(j, 1)
			}
			else
			{
				if(absorb(a3a[i],a3a[j]))
				{   a3count++;
					if(nofx(a3a[i]) < nofx(a3a[j]))
					{
						a3a[a3i] = a3a[a3j]
						a3b[ib] = a3b[jb]
						a3b.splice(jb,1)
						a3a.splice(a3j,1)
						a3j = a3i+1
						jb=ib+1
					}
					else {
						a3b.splice(jb,1)
						a3a.splice(a3j,1)
					}
				}
				else {
					a3j++;
					jb++;
				}
			}
		}
		ib++;
	}
	//cout<<"Message: Absorption completed and new cover size is:"<<a.size()<<endl;
}

absorption2 = function(a2a, a2b) {
	var i, j, k, step
	var x
	i=0
	while(i < a2b.length) {
		step=0;
		for(j=0;j<a2b[0].length;j++) 
		{
			if(a2b[i][j]!=a2a[i][j]) 
			{
				if(step==0)
				{ 
					step=1
					//cout<<"Detected - when i="<<i<<" and j="<<j<<endl;
					//a2a[i][j]='-'
					x=a2a[i].split("")
					x[j]="-"
					x=x.join("")
					a2a.splice(i,1,x)
				}
				if((i % 100)==0) absorption3(a2a,a2b)
			}
		}
		i++
	}
	absorption(a2a)
}


/////**************************** Main Program starts here *********************************/////////////

	ME_P=0;
	ME_L=0;
	l=0;
	N=0;
	total_comm = 0
	x='-'

	// Check whether master-slave approach can be started
	if (sys_size < 2) 
	{
		throw("At least two processors are required to start master-slave processing.");
	}

	/* First we will read the content of the file, only for node 0 */
	if (id == 0) 
	{
		cover = File.Load("015.ls", "rb").split("\n")
		//next we measure the time in node 0  
		wtime = MPI.Wtime()
		//if(cover[cover.length-1].length == 0)
			//cover.splice(cover.length-1, 1)
		print("Start Absorption")
		absorption(cover)

		isize = cover.length
		L = cover[0].length
		print("Master: Initial cover size: " + isize)
	}

	while(true) //Nodes operate until cover can not further reduce
	{

		rows = 0
		cols = 0

		if(id==0) {  //Master keeps track of horizontal stripe under analysis
			isize=cover.size()

			//Calculate N and L

			N = cover.size()
			cout<<"Node0: Current cover size is N="<<N<<endl
			//print(cover[i]);
		}

		N = MPI.Bcast(0, N)
		//if (id==0) print("Broadcast: N=" + N + " to all nodes.")

		L = MPI.Bcast(0, L);
		//if (id==0) print("Broadcast: L=" + L + " to all nodes.")

		cur_horiz_stripe = MPI.Bcast(0, cur_horiz_stripe)
		//if (id==0) print("Broadcast: cur_horiz_stripe=" + cur_horiz_stripe + " to all nodes.")

		horiz_stripe_size = p

		rows = N/horiz_stripe_size
		cols = L/p
		extra_rows = N % horiz_stripe_size
		extra_cols = L % p

		if(cur_horiz_stripe == (N/horiz_stripe_size-1)) 
			rows += extra_rows //if we are last stripe, take remaining rows

		if(id < extra_cols) 
			cols += 1 //split remainder columns among processes

		if (step==0) 
		{ 
			step=1 //allocate buffer only one time

			//buffer = (char*) malloc(N*L*sizeof(char));

			//absorb_cover=vector< vector<char> > (N, vector<char>(L,0));
			absorb_cover = []


		} else {
			absorb_cover.splice(N, absorb_cover.length-N)
		}

		absorb_cover = MPI.Bcast(0, cover)
		if(id == 0)
			absorb_cover = cover

		absorb_cover.splice(N, absorb_cover.length-N)
		//if (id==0) cout<<"Broadcast: cover to all nodes."<<endl;

		//Nodes need to unpack the buffer

		//for(i=0;i<N;i=i+1) {

			//tempo=&absorb_cover[i][0];
			//memcpy(tempo,&buffer[i*L],L*sizeof(char));
			////cout<<"Receiving: ";print(tempo,l);
		//};

		//cout<<"Node"<<id<<": My buffer is "; print(buffer,N*L); cout<<endl;
		//cout<<"Node"<<id<<": My cover has Nlocal="<<cover.size()<<" and Llocal="<<cover[0].size()<<endl;

		//Each node operates over bits in current horizontal stripe and it is corresponding vertical stripe
		//cout<<"Node"<<id<<": Starting operation on block."<<endl;
		//cout<<"Node"<<id<<": The local cover has Nlocal="<<cover.size()<<endl;
		//cout<<"Node"<<id<<": I am responsible of cols="<<cols<<endl;

		//for(i=0;i<cover.size();i++) {print(cover[i]);};
		//cout<<"Node"<<id<<": cur_horiz_stripe="<<cur_horiz_stripe<<endl;
		//cout<<"Node"<<id<<": ilow="<<cur_horiz_stripe*N/horiz_stripe_size<<endl;
		//cout<<"Node"<<id<<": ihigh="<<(cur_horiz_stripe*N/horiz_stripe_size+rows)<<endl;
		//cout<<"Node"<<id<<": N="<<N<<endl;
		//cout<<"Node"<<id<<": horiz_stripe_size="<<horiz_stripe_size<<endl;
		//cout<<"Node"<<id<<": rows="<<rows<<endl;                

		for(i=0;i<absorb_cover.length;i++) {

			temp_cube = absorb_cover[i] //pick implicant for analysis
			//cout<<"Assigning new i="<<i<<endl;
			if(id >= extra_cols) 
				jlow = ((L/p)+1)*extra_cols + (L/p)*(id-extra_cols)
			else 
				jlow = ((L/p)+1)*id
			//cout<<"Node"<<id<<": has jlow="<<jlow<<" and jhigh="<<jlow+cols-1<<endl;

			for(j=jlow; j<(jlow+cols); j++) {
				store = temp_cube[j]
				//cout<<"Assigning new j="<<j<<endl;   
				if(!checkx(temp_cube[j])) //try to raise char from 1 or 0 to DC
				{
					var x
					x = temp_cube.split("")
					x[j]='-';
					temp_cube = x.join("")
					cofac = [];

					for(k=0; k<absorb_cover.length; k++) //go over all remaining implicants
					{
						if(equalx(absorb_cover[k],temp_cube))
						{
							cocube = "";
							for(l=0; l<absorb_cover[k].length; l++)
							{
								if(checkx(temp_cube[l]))
								{
									cocube=cocube.concat(absorb_cover[k][l]);
								}
								else
								{
									cocube=cocube.concat(x);
								}
							}
							cofac.push_back(cocube); //create the cofactor based on the expanded implicant
						}
					} // end of the for that goes through all implicants

					if(!tautology(cofac)) //check tautology over the cofactor, if not true reject expansion
					{
						//cout<<"Restoring when i="<<i<<" and j="<<j<<endl;
						var z = temp_cube.split("")
						z[j]=store
						temp_cube = z.join() //restore temp to initial value if not ok expansion
					} else {
						//cout<<"Node "<<id<<": Succesful expansion at i="<<i<<" and j="<<j<<endl;
					}
				}  //if of trying to raise 0 or 1 to DC

			} // end for j
			absorb_cover(i,1,temp_cube); //replace cover with the final expanded word
		} // end for i


		//cout<<"Node"<<id<<": Local absorb cover after expansion with cur_horiz_stripe="<<cur_horiz_stripe<<endl;
		//for(i=0;i<absorb_cover.size();i++) print(absorb_cover[i]);
		//cout.flush();


/****************************************************************************************/
		//Here we need to add the reduction to node 0
		for(i=0;i<N;i=i+1) { //everybody packs it in the buffer
			tempo = &absorb_cover[i][0];
			memcpy(&buffer[i*L],&absorb_cover[i][0],L*sizeof(char));
			//cout<<"Sending implicant #"<<i<<":";print(buffer,L);
		};

		if(id==0) { //in node 0 we allocate the receiving buffer
			reduce_buffer=(char*) malloc(N*L*sizeof(char));
		};

		//cout<<"Node"<<id<<": Preparing for Reduce."<<endl;

		MPI::COMM_WORLD.Reduce(buffer, reduce_buffer, N*L, MPI::CHAR, op, 0);

		//cout<<"Node"<<id<<": Reduced successful."<<endl;
		if(id==0) { //in node 0 we unpack the buffer
			for(i=0;i<N;i=i+1) {

				tempo=&absorb_cover[i][0];
				memcpy(tempo,&reduce_buffer[i*L],L*sizeof(char));
				//cout<<"Receiving: ";print(tempo,l);
			};
		}
/***************************************************************************************/
		if(id==0) { //node 0 performs absorption
			cur_horiz_stripe++ //increment current pass
		}

		/***********This part is for absorption or reduction**********/
		if (id==0) { //node 0 performs a last absorption
			//cout<<"Node0: Absorb cover before absorption:"<<endl;
			//for(i=0;i<absorb_cover.size();i++) print(absorb_cover[i]);
			absorption2(cover, absorb_cover)

		}
		/***********End of absorption or reduction part***************/

		/****************Now test if the cover size reduced, if not iterate again*********/
		flag='c'

		if (id==0) {
			print("Node0: Previous cover size was " + isize + " and new size is " + cover.length)
			if(isize <= cover.length) //if cover size did not reduce then break the loop
			{
				flag='t'
			}
			else
			{
				flag='c'
				isize = cover.length
			}

		}

		//Synchronize termination flag

		flag = MPI::COMM_WORLD.Bcast(0, flag)
		if (id==0) 
			print("Broadcast: Iterating flag=" + flag + " sent to all nodes.")
		if(flag=='t') 
			break

		/****************End of condition testing*****************************************/
	} //end for while, all nodes continue until cover can not be further reduced

	if (id==0) {
		wtime = MPI_Wtime()-wtime;
		print("=================================")
		print("Node0: Final cover is:")
		for(unsigned int i=0;i<cover.size();i++)
		{   
			print(cover[i]); 
		}
		print("Node0: Final cover size is: "+ cover.length)
		print(< "Wall clock elapsed seconds = " + wtime)
		//print( "Total time spent in transmitting the cover was = " + total_comm)
	}
}

