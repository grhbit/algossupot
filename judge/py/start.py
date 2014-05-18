import os
import sys
import getopt
import compile

def wait_input():
    while True:
        line = sys.stdin.readline().strip()
        if line == "OK":
            break

def main(args):
    # constants
    RUNNABLE = 'Main.o'
    COMPILE_ERROR = 'compile.err'

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

    output_path = os.path.join(working_dir, RUNNABLE);
    out, err, returncode = compile.execute(language, source_path, output_path)

    if returncode != 0:
        file = open(os.path.join(working_dir, COMPILE_ERROR), "w")
        file.write(err.read())
        file.close()

        print >> sys.stderr, 'Compile Error'
        wait_input()
        sys.exit(os.EX_CANTCREAT);

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(os.EX_USAGE)

    sys.exit(main(sys.argv))
