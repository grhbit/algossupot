#!/usr/bin/env python

import getopt
import os
import sys
import json
from subprocess import (Popen, PIPE)

def command(cmd):
    proc = Popen(cmd,
                 shell=True,
                 stdin=PIPE,
                 stdout=PIPE,
                 stderr=PIPE)
    proc.wait()
    return proc


def c(source, output):
    def compilation():
        return command('gcc -static-libgcc %s -o %s' % (source, output))

    def entrypoint():
        return [output]

    return dict(
        compile=compilation,
        entrypoint=entrypoint)


def cpp(source, output):
    def compilation():
        return command('g++ -static-libgcc %s -o %s' % (source, output))

    def entrypoint():
        return [output]

    return dict(
        compile=compilation,
        entrypoint=entrypoint)


def python(source, output):
    def compilation():
        return command('cp %s %s && chmod +x %s' % \
                    (source, output, output))

    def entrypoint():
        return ["/usr/bin/env", "python", output]

    return dict(
        compile=compilation,
        entrypoint=entrypoint)


def ruby(source, output):
    def compilation():
        return command('cp %s %s && chmod +x %s' % \
                    (source, output, output))

    def entrypoint():
        return ["/usr/bin/env", "ruby", output]

    return dict(
        compile=compilation,
        entrypoint=entrypoint)


LANGS_DICT = dict(c=c,
                  cpp=cpp,
                  cplusplus=cpp,
                  py=python,
                  python=python,
                  rb=ruby,
                  ruby=ruby)


def run(language, source, output):
    return LANGS_DICT[language](source, output)


def main(argv):
    #default values
    language = source = output = None

    opts, args = getopt.getopt(argv[1:], 'l:s:o:', [
        'lang=',
        'source=',
        'output='])

    for opt, arg in opts:
        if opt in ('-l', '--lang'):
            language = arg
        if opt in ('-s', '--source'):
            source = arg
        if opt in ('-o', '--output'):
            output = arg

    lang_module = run(language, source, output)
    compile_result = lang_module['compile']()
    print >> sys.stderr, compile_result.stderr.read()
    print json.dumps(lang_module['entrypoint']())

    return compile_result.returncode

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(os.EX_USAGE)

    sys.exit(main(sys.argv))
