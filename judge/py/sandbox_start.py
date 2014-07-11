# -- coding: utf-8 --
import os
import getopt

platform = os.uname()[0]

if platform == 'Darwin':
    from sandbox_osx import execute

if platform == 'Linux':
    from sandbox_linux import execute

def run(executable, *args, **kwds):
    return execute(executable=executable, cmd=args, **kwds)

if __name__ == "__main__":
    try:
        pass
    except Exception, e:
        print type(e)
        print e
