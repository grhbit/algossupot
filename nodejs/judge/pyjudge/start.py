import os
import sys
import json
import getopt
import six
import shutil

from constants import (LANG_EXT_MAP,
                       RUNNABLE_PATH,
                       ERROR_PATH,
                       RESULT_PATH,
                       CompileErrorException,
                       TimeLimitExceedException,
                       MemoryLimitExceedException,
                       DiskLimitExceedException,
                       RuntimeErrorException)

from source import Source
from problem import Problem


def wait_input():
    while True:
        line = sys.stdin.readline().strip()
        if line == "OK":
            break
        elif line == "NO":
            sys.exit(os.EX_IOERR)
        else:
            sys.exit(os.EX_IOERR)


def write_result_json(time, memory):
    result = {
        'time': time,
        'memory': memory
    }

    result_json = json.dumps(result)

    result_file = open(RESULT_PATH, 'w')
    result_file.write(result_json)
    result_file.close()


def write_error_log(err):
    error_message = None

    if isinstance(err, six.string_types):
        error_message = err
    else:
        error_message = err.read()

    if not len(error_message) == 0:
        error_file = open(ERROR_PATH, 'w')
        error_file.write(error_message)
        error_file.close()


def parse_options(args):
    # default values
    problem_dir = working_dir = source_path = language = None

    myopts, args = getopt.getopt(args[1:], "", [
        "problem-dir=",
        "working-dir=",
        "source-path=",
        "language="])

    for opt, arg in myopts:
        if opt == '--problem-dir':
            problem_dir = arg
        elif opt == '--working-dir':
            working_dir = arg
        elif opt == '--source-path':
            source_path = arg
        elif opt == '--language':
            language = arg

    if (problem_dir is None or
            working_dir is None or
            source_path is None or
            language is None):
        raise Exception('Insufficient arguments.')

    return problem_dir, working_dir, source_path, language


def main(args):
    problem_dir, working_dir, source_path, language = parse_options(args)

    os.chdir(working_dir)
    shutil.copy(source_path, './source.' + LANG_EXT_MAP.get(language))
    output_path = RUNNABLE_PATH

    problem_obj = Problem(problem_dir)

    source_obj = Source(source_path, language)
    program_obj = source_obj.compile(output_path)
    program_obj.run(problem_obj)

    return os.EX_OK


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(os.EX_USAGE)

    try:
        RETURN_CODE = main(sys.argv)

        if RETURN_CODE is os.EX_OK:
            print >> sys.stderr, 'Accepted'
            wait_input()

        sys.exit(RETURN_CODE)

    except CompileErrorException, inst:
        write_error_log(inst.stderr)
        print >> sys.stderr, 'Compile Error'
        wait_input()
        sys.exit(os.EX_CANTCREAT)

    except TimeLimitExceedException, inst:
        write_result_json(time=inst.time, memory=inst.memory)
        write_error_log(inst.stderr)
        print >> sys.stderr, 'Time Limit Exceed'
        wait_input()
        sys.exit(os.EX_IOERR)

    except MemoryLimitExceedException, inst:
        write_result_json(time=inst.time, memory=inst.memory)
        write_error_log(inst.stderr)
        print >> sys.stderr, 'Memory Limit Exceed'
        wait_input()
        sys.exit(os.EX_IOERR)

    except DiskLimitExceedException, inst:
        write_result_json(time=inst.time, memory=inst.memory)
        write_error_log(inst.stderr)
        print >> sys.stderr, 'Output Limit Exceed'
        wait_input()
        sys.exit(os.EX_IOERR)

    except RuntimeErrorException, inst:
        write_result_json(time=inst.time, memory=inst.memory)
        write_error_log(inst.stderr)
        print >> sys.stderr, 'Runtime Error'
        wait_input()
        sys.exit(os.EX_OSERR)

    except Exception, inst:
        write_error_log(str(inst))
        print >> sys.stderr, 'Internal Error'
        print inst
        wait_input()
        sys.exit(os.EX_IOERR)
