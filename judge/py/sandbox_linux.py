# -- coding: utf-8 --
import os
import sys
import constants

TimeLimitExceed = constants.TimeLimitExceedException
MemoryLimitExceed = constants.MemoryLimitExceedException
DiskLimitExceed = constants.DiskLimitExceedException
RuntimeError = constants.RuntimeErrorException

# check platform type
system, machine = os.uname()[0], os.uname()[4]
if system not in ('Linux', ) or machine not in ('i686', 'x86_64', ):
    raise AssertionError("Unsupported platform type.\n")

# check package availability / version
import sandbox
if not hasattr(sandbox, '__version__') or sandbox.__version__ < "0.3.3-rc2":
    raise AssertionError("Unsupported sandbox version.\n")
from sandbox import *

# result code translation
def __result_name(r):
    return ('PD', 'OK', 'RF', 'ML', 'OL', 'TL', 'RT', 'AT', 'IE', 'BP')[r] \
        if r in xrange(10) else None

def execute(execute, *args, **kwds):
    # 리눅스에서는 pysandbox 아니면 lxc를 사용할겁니다.
    #TODO: lxc로 변경

    configure = {
        'language': 'cpp',
        'args': execute,
        'stdin': sys.stdin,
        'stdout': sys.stdout,
        'stderr': sys.stderr,
        'quota': dict(wallclock = kwds.pop('timeLimit', 10) + 10,
                      cpu = kwds.pop('timeLimit', 10),
                      memory = kwds.pop('memoryLimit', 1024*1024*2),
                      disk = kwds.pop('diskLimit', 1024*1024*10))
    }

    customSandbox = CustomSandbox(**configure)
    customSandbox.run()

    d = Sandbox.probe(customSandbox, False)
    result = __result_name(customSandbox.result)
    cpu = d['cpu_info'][0]
    mem = d['mem_info'][1]

    if result is 'ML':
        raise MemoryLimitExceed(time=cpu,
            memory=mem,
            stderr=open('error.txt', 'w'))
    elif result is 'TL':
        raise TimeLimitExceed(time=cpu,
            memory=mem,
            stderr=open('error.txt', 'w'))
    elif result is 'OL':
        raise DiskLimitExceed(time=cpu,
            memory=mem,
            stderr=open('error.txt', 'w'))
    elif result in ('RF', 'RT', 'AT', ):
        raise RuntimeError(time=cpu,
            memory=mem,
            stderr=open('error.txt', 'w'))
    else:
        raise Exception(result)

# Sandbox 규칙을 정의해놓은 클래스입니다.
# 각각 프로그래밍 언어마다 규칙이 다르게 정의됩니다.
class CustomSandbox(SandboxPolicy, Sandbox):
    sc_table = None
    sc_safe = dict(
        i686 = set([3, 4, 19, 45, 54, 90, 91, 122, 125, 140, 163, 192, 197, 224, 243, 252, ]),
        x86_64 = set([0, 1, 2, 3, 5, 8, 9, 10, 11, 12, 13, 16, 21, 25, 39, 63, 72, 79, 107, 110, 158, 231, ]), )

    sc_sequence = dict(
        cpp = dict(
            i686 = [],
            x86_64 = [63, 12, 12, 158, 12, 12, 231]), )

    def __init__(self, *args, **kwds):
        self.sc_table = [0, ] * 1024
        for scno in CustomSandbox.sc_safe[machine]:
            self.sc_table[scno] = -1

        for scno in self.sc_sequence[kwds['language']][machine]:
            if self.sc_table[scno] >= 0:
                self.sc_table[scno] += 1;

        del kwds['language']

        kwds['policy'] = self
        SandboxPolicy.__init__(self)
        Sandbox.__init__(self, *args, **kwds)

    # Event Type
    # Error, Exit, Signal, Syscall, Sysret, Quota
    # Action Type
    # Cont, Fini, Kill
    def __call__(self, event, action):
        if event.type in (S_EVENT_SYSCALL, S_EVENT_SYSRET):
            if machine is 'x86_64' and event.ext0 is not 0:
                return self.__kill_restricted_func(event, action)
            return self.__check_syscall(event, action)
        return SandboxPolicy.__call__(self, event, action)

    def __check_syscall(self, event, action):
        if event.type is S_EVENT_SYSCALL:
            if self.sc_table[event.data] > 0:
                self.sc_table[event.data] -= 1
            elif self.sc_table[event.data] == 0:
                return self.__kill_restricted_func(event, action)

        return self.__continue(event, action)

    def __continue(self, event, action):
        action.type = S_ACTION_CONT
        return action

    def __kill_restricted_func(self, event, action):
        action.type, action.data = S_ACTION_KILL, S_RESULT_RF
        return action

if __name__ == "__main__":
    try:
        execute(sys.argv[1], timeLimit=10, memoryLimit=1024*1024*2, diskLimit=1024*1024*10, language='cpp')
        pass
    except Exception, e:
        print e
        pass
