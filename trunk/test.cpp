#include<iostream>
#include<stdlib.h>
#define DEBUG 0
using namespace std;
int main()
{
	/* Code starts here */
	vector<vector<char>> val = {{1,2,3}, {11,22,33}, {111,222,333},{1111,2222,3333,4444}}
	cout<<val.size()<<"  "<<val[0].size();
	return 0;
}
