#!/usr/bin/env python
# -- coding: utf-8 --

import sys

def fiboR(n):
    if n <= 2: return 1
    return fiboR(n-1) + fiboR(n-2);

print(fiboR(int(sys.stdin.readline())));
