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

def scriptCompilation(srcPath, dstPath, hashbang):
    src = open(srcPath)
    dst = open(dstPath, 'w')
    dst.write(hashbang + src.read())
    close(dst)
    close(src)

    cmd = 'chmod +x ' + dst
    return __execute(cmd)

def cpp(outputPath):
    cmd = 'g++ source.cpp -o ' + outputPath

    if platform != "Darwin":
        cmd += ' -static'

    return __execute(cmd)

def python(outputPath):
    hashbang = '#!/usr/bin/env python\n'
    return scriptCompilation('source.py', outputPath, hashbang)

def ruby(outputPath):
    hashbang = '#!/usr/bin/env ruby\n'
    return scriptCompilation('source.rb', outputPath, hashbang)

def execute(language, outputPath):
    langMap = {
        'cpp': cpp,
        'python': python,
        'ruby': ruby
    }
    return langMap.get(language)(outputPath)
