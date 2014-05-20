import os
import sys
import json
import getopt
import tempfile
import shutil

import compile

langExtMap = {
    'C++': 'cpp'
}

def wait_input():
    while True:
        line = sys.stdin.readline().strip()
        if line == "OK":
            break
        elif line == "NO":
            sys.exit(os.EX_IOERR);
        else:
            sys.exit(os.EX_IOERR);

def read_problem(problem_index_path):
    try:
        root = json.loads(open(problem_path).read())
        contetns = root.get('contents')

        inputPath = contents.get('input')
        outputPath = contents.get('output')
        time_limit = int(contents.get('timeLimit', '1024'))
        memory_limit = int(contents.get('memoryLimit', '1024'))
        disk_limit = int(contents.get('diskLimit', '1024'))

        return {
            'timeLimit': time_limit,
            'memoryLimit': memory_limit,
            'diskLimit': disk_limit
        }
    except (IOError, ValueError, KeyError):
        print >> sys.stderr, 'Internal Error'
        wait_input()
        return os.EX_IOERR

def main(args):
    # constants
    RUNNABLE = './Main.o'
    RESULT = './result.json'
    COMPILE_ERROR = './compile.err'

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

    open('/Users/seonggwang/pyproc.log', "a").write(working_dir + '\n')
    os.chdir(working_dir)
    shutil.copy(source_path, './source.' + langExtMap.get(language))
    output_path = RUNNABLE;
    out, err, returncode = compile.execute(language, output_path)

    if returncode != 0:
        file = open(os.path.join(working_dir, COMPILE_ERROR), "w")
        file.write(err.read())
        file.close()

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
    except Exception, e:
        print >> sys.stderr, 'Internal Error'
        open('/Users/seonggwang/pyproc.log', "a").write(e.message + '\n')
        wait_input()
        sys.exit(os.EX_IOERR)
