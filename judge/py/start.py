import os
import sys
import json
import getopt
import tempfile
import shutil

import constants
import compile
import problem

RESULT_PATH = constants.RESULT_PATH
ERROR_PATH = constants.ERROR_PATH
TimeLimitExceed = constants.TimeLimitExceedException
MemoryLimitExceed = constants.MemoryLimitExceedException
DiskLimitExceed = constants.DiskLimitExceedException
RuntimeError = constants.RuntimeErrorException

def wait_input():
    while True:
        line = sys.stdin.readline().strip()
        if line == "OK":
            break
        elif line == "NO":
            sys.exit(os.EX_IOERR);
        else:
            sys.exit(os.EX_IOERR);

def write_result_json(time, memory, disk):
    result = {
        'time': time,
        'memory': memory,
        'disk': disk
    }

    resultJSON = json.dumps(result)

    file = open(RESULT_PATH, 'w')
    file.write(resultJSON)
    file.close()

def write_error_log(err_message):
    if len(err_message) not 0:
        file = open(ERROR_PATH, 'w')
        file.write(err_message)
        file.close()

def main(args):
    # constants values
    RUNNABLE_PATH = constants.RUNNABLE_PATH
    LANG_EXT_MAP = constants.LANG_EXT_MAP

    # default values
    problem_dir = ''
    working_dir = ''
    source_path = ''
    language = 'C++'
    output_path = ''

    myopts, args = getopt.getopt( sys.argv[1:], "", ["problem-dir=", "working-dir=", "source-path=", "language="] )
    for opt, arg in myopts:
        if opt == '--problem-dir':
            problem_dir = arg
        elif opt == '--working-dir':
            working_dir = arg
        elif opt == '--source-path':
            source_path = arg
        elif opt == '--language':
            language = arg

    #open('/Users/seonggwang/pyproc.log', "a").write(working_dir + '\n')
    os.chdir(working_dir)
    shutil.copy(source_path, './source.' + LANG_EXT_MAP.get(language))
    output_path = RUNNABLE_PATH;
    out, err, returncode = compile.execute(language, output_path)

    if returncode != 0:
        write_error_log(err.read())

        print >> sys.stderr, 'Compile Error'
        wait_input()
        sys.exit(os.EX_CANTCREAT);

    print >> sys.stderr, 'Accepted'
    wait_input()
    return os.EX_OK

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(os.EX_USAGE)

    try:
        sys.exit(main(sys.argv))
    except TimeLimitExceed, e:
        write_result_json(time=e.time, memory=e.memory, disk=e.disk)
        write_error_log(e.stderr.read())
        print >> sys.stderr, 'Time Limit Exceed'
        wait_input()
        sys.exit(os.EX_IOERR)
    except MemoryLimitExceed, e:
        write_result_json(time=e.time, memory=e.memory, disk=e.disk)
        write_error_log(e.stderr.read())
        print >> sys.stderr, 'Memory Limit Exceed'
        wait_input()
        sys.exit(os.EX_IOERR)
    except DiskLimitExceedException, e:
        write_result_json(time=e.time, memory=e.memory, disk=e.disk)
        write_error_log(e.stderr.read())
        print >> sys.stderr, 'Output Limit Exceed'
        wait_input()
        sys.exit(os.EX_IOERR)
    except RuntimeError, e:
        write_result_json(time=e.time, memory=e.memory, disk=e.disk)
        write_error_log(e.stderr.read())
        print >> sys.stderr, 'Runtime Error'
        wait_input()
        sys.exit(os.EX_OSERR)
    except Exception, e:
        print >> sys.stderr, 'Internal Error'
        #open('/Users/seonggwang/pyproc.log', "a").write(e.message + '\n')
        wait_input()
        sys.exit(os.EX_IOERR)
