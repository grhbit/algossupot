LANG_EXT_MAP = {
    'C++': 'cpp'
}

RUNNABLE_PATH = './Main.o'
RESULT_PATH = './result.json'
ERROR_PATH = './compile.err'

DEFAULT_TIMELIMIT = 10 # (s)
DEFAULT_MEMORYLIMIT = 1024 * 10 # (bytes)
DEFUALT_DISKLIMIT = 1024 * 1024 # (bytes)

class RunningException(Exception):
    def __init__(self, time, memory, disk, stderr):
        self.time = time
        self.memory = memory
        self.disk = disk
        self.stderr = stderr

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
