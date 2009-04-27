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
    ////print(id +" nofx " + nmycube)
    if(typeof(nmycube) == "undefined")
      return 0
		for(m=0; m < nmycube.length; m++)
		{
			if(checkx(nmycube[m]))
				countn++
		}
		////print("countn " + countn)
		return countn}

	equal = function(emycube, ex){ // mycube and ex are of "cube" datatype
		////print("Entering equal")
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

		////print("Entering equalx")
		var exj = 0
		for(exj=0; exj < exmycube.length; exj++)
		{
			if(((check0(exx[exj])) && (check1(exmycube[exj]))) || ((check1(exx[exj])) && (check0(exmycube[exj]))))
				return false
		}
		return true}

	cubeprint = function(c2mycube, cl){
		////print("Entering cubeprint2")
		var c2j=0
		for(c2j = 0; c2j <= cl; c2j++)
		{
      print(c2mycube[c2j]);
		}
    print("\n");}

	absorb = function(a, b){
		////print(id  + " Entering absorb")
		var f1
		var f2
		if(nofx(a) == nofx(b))
		{
			////print("Cannot reduce" );
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
	////print("Entering binate")
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
	////print("Entering tautology" + MPI.Rank())
		if(a.length <= 0)
		{
				 ////print("EMPTY COVER" );
			return false
		}
		vsize = a[0].length
		var tauti=0
		for(tauti=0; tauti < a.length; tauti++)
		{
			if((nofx(a[tauti])) == vsize)
			{
						 ////print("ALL BLANKS" )
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
				//      ////print("COLUMN WITH ONLY 0s or 1s" );
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
					DC1.push(ttemp.toString()) // DataType Cover
				}
				if(checkx(a[tauti][vsize-1]))
				{
					var ttemp = ""
					var tautk = 0
					for(tautk = 0; tautk < ((a[tauti].length) -1) ; tautk++)
					{
						ttemp=ttemp.concat(a[tauti][tautk])
					}
					DCN.push(ttemp.toString())
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
								////print("UNATE REDUCTION FAILED" );
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
								////print("UNATE REDUCTION FAILED" );
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
					cox_.push(ttemp.toString())
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
					cox.push(ttemp.toString())
				}
				else if( checkx(a[tautj][tauti]) )
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
					cox.push(ttemp.toString())
					cox_.push(ttemp.toString())
				}
				else
				{
					//print( "a[" + tautj + "]["+ tauti + "= " + a[tautj][tauti] )
					throw("Error in parsing")
				}
			}
			if(cox.length < cox_.length)
			{
						 ////print("CALLING TO CHECK COFACTOR" );
				if(tautology(cox))
				{
								 ////print("CALLING TO CHECK COFACTOR" );
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
						 ////print("CALLING TO CHECK COFACTOR" );
				if(tautology(cox_))
				{
								 ////print("CALLING TO CHECK COFACTOR" );
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

	absorption = function(ac){
		//print("Message: Performing absorb over " + ac.length + " implicants.")
    //ac.sort();
    ////print(ac)
		var abscount=0
		var absj=0	
		var absi=0	
		for(absi=0; absi < ac.length-1; absi++)
		{
			for(absj=absi+1; absj < ac.length-1;)
			{
					////print("ac["+absi+"]="+ac[absi])
          ////print("ac["+absj+"]="+ac[absj])
          if(equal(ac[absi],ac[absj]))
					{
            //print("Erasing ")
						ac.splice(absj,1)
					}
					else
					{
						if(absorb(ac[absi],ac[absj]))
						{   
							abscount = abscount +1
							if(nofx(ac[absi]) < nofx(ac[absj]))
							{
                //print("Erasing <")
								ac[absi] = ac[absj]
								ac.splice(absj,1)
								absj = (absi+1)
							}
							else
							{
                //print("Erasing >")
								ac.splice(absj,1);
							}
              //print("Not erasing " + ac.length)
						}
						else
						{
							absj = (absj+1)
						}
					}
			}
		}
    ////print("abscount: " + abscount + " and final ac size: " + ac.length)
    ////print("Outta ab " + ac)
}

absorption3 = function(a3a, a3b)
{

  ////print(a3a + " Masked absorption." + a3b)

	//sort(a.begin(),a.end());
	var a3count = 0;
	var a3i = 0
	var ib = 0
	var a3j = 0
	var jb = 0
	////print("Message: Performing absorb over "+a.length+" implicants.")
	////print("Message: Implicants were:")
	for(a3i=0; a3i < (a3a.length-1); a3i++)
	{
		jb=ib+1
		for(a3j=a3i+1; a3j < (a3a.length-1);)
		{

			if(equal(a3a[a3i],a3a[a3j]))
			{
				////print("Erasing ")
				a3b.splice(jb, 1)
				a3a.splice(a3j, 1)
			}
			else
			{
				if(absorb(a3a[a3i],a3a[a3j]))
				{   a3count++;
					if(nofx(a3a[a3i]) < nofx(a3a[a3j]))
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
  //print(a3a + " Message: Absorption completed and new cover size is:" + a3b)
}

absorption2 = function(a2a, a2b) {
  ////print("a2a in ab2 " + a2a)
  ////print("a2b in ab2 " + a2b)
	var i, j, k, step
	var x
	i=0
	while( i < a2b.length ) 
  {
		step=0;
		for( j=0; j<a2b[0].length; j++ ) 
		{
			////print("b["+i+"]["+j+"]="+a2b[i][j])
			////print("a["+i+"]["+j+"]="+a2a[i][j])
			if( a2b[i][j] != a2a[i][j] ) 
			{
				if( step==0 )
				{ 
					step=1
          ////print("Detected - when i="+i+" and j="+j)
					//a2a[i][j]='-'
          ////print("*****************")
          ////print("a2a[i] "+a2a[i])
					x=a2a[i].split("")
					x[j]="-"
					x=x.join("")
					a2a.splice(i,1,x)
          ////print("a2a[i] "+a2a[i])
          ////print("*****************")
				}
				if((i % 100)==0) 
        {
          //print("b4 a2a.size = "+a2a.length+"   a2b. cover = "+a2b.length);
          absorption3(a2a,a2b)
          //print("after a2a.size = "+a2a.length+"   a2b. cover = "+a2b.length);
        }
			}
		}
		i++
	}
	absorption(a2a)
}


/////**************************** Main Program starts here *********************************/////////////

	ME_P=0;
	ME_L=0;
	total_comm = 0
	x='-'
  N = 0
  L = 0
  wtime = 0
  cur_horiz_stripe = 0
  step = 0
  cover = []
	// Check whether master-slave approach can be started
	if (sys_size < 2) 
	{
		throw("At least two processors are required to start master-slave processing.");
	}
	/* First we will read the content of the file, only for node 0 */
	if (id == 0) 
	{
		cover = File.Load("t1.ls", "rb").split("\n")
		//next we measure the time in node 0
    cover.splice(cover.length-1,1)
		wtime = MPI.Wtime()
		absorption(cover)
    
		isize = cover.length
		L = cover[0].length
    cur_horiz_stripe = 0
    //print("Node0: Initial cover size: " + isize)
    //print("id#"+id+" Iterating ")
	}

	while(true) //Nodes operate until cover can not further reduce
	{

		rows = 0
		cols = 0
    //print("id#"+id+" Iterating ")
		if(id==0) {  //Master keeps track of horizontal stripe under analysis

			//Calculate N and L

		  isize = cover.length
			N = cover.length
      print("Node0: Current cover size is N="+ N +" L=" + L + " cur_horiz_stripe="+cur_horiz_stripe)
      
      //MPI.Bcast(0, N)
      //print("N sent")
      
			//MPI.Bcast(0, L);
      
			//MPI.Bcast(0, cur_horiz_stripe)
	    
    }
    //else
    //{
		    N = MPI.Bcast(0, N)
        print("N recieved")
        
	      L = MPI.Bcast(0, L)
        
	      cur_horiz_stripe = MPI.Bcast(0, cur_horiz_stripe)
      //}
    print("id#"+id+" N="+N+" L="+L+" cur_horiz_stripe="+cur_horiz_stripe)
		horiz_stripe_size = sys_size

		rows = Math.floor(Number(N/horiz_stripe_size))
		cols = Math.floor(Number(L/sys_size))
		extra_rows = N % horiz_stripe_size
		extra_cols = L % sys_size

		if(cur_horiz_stripe == (Math.floor(Number(N/horiz_stripe_size))-1)) 
			rows += extra_rows //if we are last stripe, take remaining rows

		if(id < extra_cols) 
			cols += 1 //split remainder columns among processes

    //print("horiz_stripe_size " + horiz_stripe_size)
    //print("rows "+ rows)
    //print("cols "+ cols)
    //print("extra_rows "+ extra_rows)
    //print("extra_cols "+ extra_cols)
    //print("N/horiz_stripe_size - 1 = " + (Math.floor(Number(N/horiz_stripe_size))-1))

		if (step==0) 
		{ 
			step=1 //allocate buffer only one time

			//buffer = (char*) malloc(N*L*sizeof(char));

			//absorb_cover=vector< vector<char> > (N, vector<char>(L,0));
      absorb_cover = []
			for(i=0; i<N; i++)
        absorb_cover[i]=""


		} else {
			absorb_cover.splice(N, absorb_cover.length-N)
		}

    
    if(id == 0)
    {
      MPI.Bcast(0, cover)
      absorb_cover = cover
    }
    else
      absorb_cover = MPI.Bcast(0)
    
		for( i=0; i<absorb_cover.length; i++) {

			temp_cube = absorb_cover[i] //pick implicant for analysis
      //print("Assigning new i="+i)
      jlow = 0
			if(id >= extra_cols) 
				jlow = ((( Math.floor( Number( L/sys_size ) )+1 )*extra_cols) + (Math.floor( Number( L/sys_size ) )*( id-extra_cols )))
			else 
				jlow = ( Math.floor( Number( L/sys_size ) )+1 )*id
      //print("Node"+id+": has jlow="+jlow+" and jhigh="+(jlow+cols-1))

			for(j=jlow; j<( jlow+cols ); j++) {
				store = temp_cube[j]
				////print("Assigning new j="+j)   
				if(!checkx(temp_cube[j])) //try to raise char from 1 or 0 to DC
				{
					var z=""
					z = temp_cube.split("")
					z[j]="-"
          temp_cube = ""
					temp_cube = z.join("")
					cofac = []

					for(k=0; k<absorb_cover.length; k++) //go over all remaining implicants
					{
            //print("AbCo is " + absorb_cover[k] + "\ttemp_cube is "+ temp_cube)
						if(equalx(absorb_cover[k],temp_cube))
						{
							cocube = "";
							for(l=0; l<absorb_cover[k].length; l++)
							{
								//print("Checkx " + checkx(temp_cube[l]))
								if(checkx(temp_cube[l]))
								{
									cocube=cocube.concat(absorb_cover[k][l])
								}
								else
								{
									cocube=cocube.concat(x)
								}
							}
              //print("j = " + j +" k= "+k+" Cocube is "+ cocube)
							cofac.push(cocube); //create the cofactor based on the expanded implicant
						}
					} // end of the for that goes through all implicants
          //print("b4 tautology Cofactor is " + cofac)
					if(!tautology(cofac)) //check tautology over the cofactor, if not true reject expansion
					{
						////print("Restoring when i="+i+" and j="+j)
						var d = temp_cube.split("")
						d[j]=store
            temp_cube=""
						temp_cube = d.join("") //restore temp to initial value if not ok expansion
					} else {
						////print("Node "+id+": Succesful expansion at i="+i+" and j="+j)
					}
          //print("After id#"+id+" Tautology #"+j)
          //print("Cofactor is "+cofac)
				}  //if of trying to raise 0 or 1 to DC

			} // end for j
			absorb_cover.splice(i,1,temp_cube); //replace cover with the final expanded word
      //print(absorb_cover[i]);
		} // end for i


		////print("Node"+id+": Local absorb cover after expansion with cur_horiz_stripe="+cur_horiz_stripe)
		//for(i=0;i<absorb_cover.length;i++) //print(absorb_cover[i]);
		//cout.flush();


/******************************* PUT REDUCE HERE :: ALTERNATE IS GIVEN *********************************************************/
    if(id != 0)
      MPI.Send(absorb_cover, 0)
    else
    {
      temp_cover = MPI.Recv()
      absorb_cover = temp_cover
      for( i=0; i<sys_size-2; i++ )
      {
        temp_cover = MPI.Recv()
        for (j=0; j<absorb_cover.length; j++ )
        {
          z=absorb_cover[j].split("")
          for( k=0; k<absorb_cover[j].length; k++ )
          {
            if(z[k] == "-")
              z[k] = temp_cover[j][k];
            else
              z[k] = "-"
          }
          z=z.join("")
          absorb_cover.splice(j,1,z)
        }
      }
    }

/***************************************************************************************/
		if(id==0) { //node 0 performs absorption
			cur_horiz_stripe++ //increment current pass
		}

		/***********This part is for absorption or reduction**********/
		if (id==0) { //node 0 performs a last absorption
			////print("Node0: Absorb cover before absorption:")
			//for(i=0;i<absorb_cover.length;i++) //print(absorb_cover[i]);
      //print("cover size = "+cover.length+"   absorb cover = "+absorb_cover.length);
			absorption2(cover, absorb_cover)
      //print("cover size = "+cover.length+"   absorb cover = "+absorb_cover.length);

		}
		/***********End of absorption or reduction part***************/

		/****************Now test if the cover size reduced, if not iterate again*********/
		flag=1

		if (id==0) {
			//print("Node0: Previous cover size was " + isize + " and new size is " + cover.length)
			if(isize <= cover.length) //if cover size did not reduce then break the loop
			{
				flag=0
			}
			else
			{
				flag=1
				isize = cover.length
			}

		}

		//Synchronize termination flag
    if(id == 0)
    {
      ////print("Broadcasting")
      MPI.Bcast(0, flag)
      ////print("Broadcasted")
    }
    else
      flag = MPI.Bcast(0)

    if (id==0) 
    {
      print("Broadcast: Iterating flag=" + flag + " sent to all nodes.")
    }
		if(flag==0) 
			break

		/****************End of condition testing*****************************************/
    print("id#"+id+" Next iteration")
	} //end for while, all nodes continue until cover can not be further reduced

	if (id==0) {
		wtime = MPI.Wtime()-wtime
    print("=================================")
    print("Node0: Final cover is:")
		//for( i=0; i<cover.length; i++ )
		//{   
      //print(cover[i]); 
		//}
    print("Node0: Final cover size is: "+ cover.length)
    print( "Wall clock elapsed seconds = " + wtime)
    //print( "Total time spent in transmitting the cover was = " + total_comm)
	}


