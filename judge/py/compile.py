import os
import sys
import subprocess

platform = os.uname()[0]

def __execute(cmd):
    fd = subprocess.Popen(cmd,
            shell=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
    fd.wait()
    return fd.stdout, fd.stderr, fd.returncode

def cpp(outputPath):
    cmd = 'g++ source.cpp -o ' + outputPath

    if platform != "Darwin":
        cmd += ' -static'

    return __execute(cmd);

def execute(language, outputPath):
    langMap = {
        'C++': cpp
    }
    return langMap.get(language)(outputPath)
