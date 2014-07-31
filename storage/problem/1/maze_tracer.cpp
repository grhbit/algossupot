#include <iostream>
#include <fstream>
#include <vector>
#include <stdlib.h>

using namespace std;

int main(int argc, const char * argv[])
{
	if( argc < 2 )
	{
		cout << "This program needs 2 argument." << endl;
		return -1;
	}

	ifstream input (argv[1]);
	ifstream input2 (argv[2]);
	if ( input.is_open() && input2.is_open() )
	{
		vector< vector<int> > mapData;
		int sx, sy;
		int ex, ey;
		int line_count = 0;
		while( !input.eof() ) {
			string str1, str2;

			input >> str1;
			if( str1.size() == 0 )
				break;

			vector<int> line;
			for( int i=0; i<str1.size(); i++ ) 
			{
				if( str1.at(i) == '0' ) 
				{
					line.push_back(0);
				}
				else if( str1.at(i) == '1' )
				{
					line.push_back(1);
				}

				if( str1.at(i) == 'S')
				{
					sx = i;
					sy = line_count;

					line.push_back(0);
				}
				else if( str1.at(i) == 'E' )
				{
					ex = i;
					ey = line_count;

					line.push_back(0);
				}
			}

			line_count++;
			mapData.push_back( line );
		}

		while( !input2.eof() ) {
			int y, x;

			input2 >> y >> x;
			if( mapData[y][x] == 1 )
			{
				cout << "fail" << endl;
				exit(0);
			}
		}

		input.close();
		input2.close();
	}

	cout << "success" << endl;

	return 0;
}