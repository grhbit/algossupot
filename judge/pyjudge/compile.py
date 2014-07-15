import os
import subprocess
from constants import CompileErrorException

PLATFORM = os.uname()[0]

def __execute(cmd):
    subproc = subprocess.Popen(cmd,
                               shell=True,
                               stdin=subprocess.PIPE,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)
    subproc.wait()
    return subproc.stderr, subproc.returncode


def script_compilation(src_path, dst_path, hashbang):
    src = open(src_path)
    dst = open(dst_path, 'w')

    dst.write(hashbang + src.read())

    src.close()
    dst.close()

    cmd = 'chmod +x ' + dst_path
    return __execute(cmd)


def cpp(output_path):
    cmd = 'g++'

    if PLATFORM != "Darwin":
        cmd += ' -static-libgcc '

    cmd += 'source.cpp -o ' + output_path

    return __execute(cmd)


def python(output_path):
    hashbang = '#!/usr/bin/env python\n'
    return script_compilation('source.py', output_path, hashbang)


def ruby(output_path):
    hashbang = '#!/home/seonggwang/.rbenv/shims/ruby\n'
    return script_compilation('source.rb', output_path, hashbang)


def execute(language, output_path):
    langs_map = {
        'cpp': cpp,
        'python': python,
        'ruby': ruby
    }

    err, returncode = langs_map.get(language)(output_path)

    if returncode != 0:
        raise CompileErrorException(err)
