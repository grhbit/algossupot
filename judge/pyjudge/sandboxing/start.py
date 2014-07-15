# -- coding: utf-8 --
from os import uname

PLATFORM = uname()[0]

if PLATFORM == 'Darwin':
    from sandboxing.osx import execute

if PLATFORM == 'Linux':
    from sandboxing.linux import execute

def run(program, problem):
    return execute(program=program, problem=problem)

if __name__ == "__main__":
    try:
        pass
    except Exception, inst:
        print type(inst)
        print inst
        raise inst
