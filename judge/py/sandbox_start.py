# -- coding: utf-8 --
import os
import getopt

import sandbox_osx
import sandbox_linux

platform = os.uname()[0]

def execute(executable, *args, **kwds):
    platformMap = {
        'Darwin': sandbox_osx.execute,
        'Linux': sandbox_linux.execute
    }

    platformMap.get(platform)(executable=executable, cmd=args, **kwds)


if __name__ == "__main__":
    try:
    except Exception, e:
        print type(e)
        print e
