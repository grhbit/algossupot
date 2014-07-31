#include <iostream>

using std::cin;
using std::cout;
using std::endl;

int fiboR(int n) {
    if (n <= 2) return 1;
    return fiboR(n-2) + fiboR(n-1);
}

int main(int argc, char** argv) {
    int N;

    cin >> N;
    cout << fiboR(N) << endl;

    return 0;
}
