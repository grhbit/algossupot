import sys
import subprocess

def __execute(cmd):
    print >> sys.stdout, cmd
    fd = subprocess.Popen(cmd,
            shell=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
    fd.wait()
    return fd.stdout, fd.stderr, fd.returncode

def cpp(sourceCodePath, outputPath):
    cmd = 'g++ -static -o ' + outputPath + ' ' + sourceCodePath
    return __execute(cmd);

def execute(language, sourceCodePath, outputPath):
    langMap = {
        'C++': cpp
    }
    return langMap.get(language)(sourceCodePath, outputPath)
