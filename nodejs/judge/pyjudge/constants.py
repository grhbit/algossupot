# -*- coding: utf-8 -*-
LANG_EXT_MAP = dict(
    cpp='cpp',
    python='py',
    ruby='rb')

RUNNABLE_PATH = './Main.o'
RESULT_PATH = './result.json'
ERROR_PATH = './compile.err'

DEFAULT_TIMELIMIT = 10 # (s)
DEFAULT_MEMORYLIMIT = 1024 * 10 # (bytes)
DEFAULT_DISKLIMIT = 1024 * 1024 # (bytes)

class CompileErrorException(Exception):
    def __init__(self, stderr):
        self.stderr = stderr
        Exception.__init__(self, 'CompileError')


class RunningException(Exception):
    def __init__(self, time, memory, stderr):
        self.time = time
        self.memory = memory
        self.stderr = stderr

        Exception.__init__(self, 'RunningException')


class TimeLimitExceedException(RunningException):
    def __init__(self, **kwds):
        RunningException.__init__(self, **kwds)


class MemoryLimitExceedException(RunningException):
    def __init__(self, **kwds):
        RunningException.__init__(self, **kwds)


class DiskLimitExceedException(RunningException):
    def __init__(self, **kwds):
        RunningException.__init__(self, **kwds)


class RuntimeErrorException(RunningException):
    def __init__(self, **kwds):
        RunningException.__init__(self, **kwds)
