# -- coding: utf-8 --
import os
import sys
import tempfile
from sandboxing.config import SC_CONFIG
from constants import (TimeLimitExceedException,
                       MemoryLimitExceedException,
                       DiskLimitExceedException,
                       RuntimeErrorException)

# check platform type
SYSTEM, MACHINE = os.uname()[0], os.uname()[4]
if SYSTEM not in ('Linux', ) or MACHINE not in ('i686', 'x86_64', ):
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

def execute(program, problem):
    out = tempfile.TemporaryFile(mode='w+')
    err = tempfile.TemporaryFile(mode='w+')

    configure = {
        'args': [program.path],
        'stdin': tempfile.TemporaryFile(mode='w+'),
        'stdout': out,
        'stderr': err,
        'quota': dict(wallclock=problem.time_limit + 10,
                      cpu=problem.time_limit,
                      memory=problem.memory_limit,
                      disk=problem.disk_limit)
    }

    csb = CustomSandbox(**configure)
    csb.set(SC_CONFIG.get(program.source.language, dict()))
    csb.run()

    out.seek(0)
    err.seek(0)
    stdout_data = out.read()
    stderr_data = err.read()

    print stdout_data
    print stderr_data

    out.close()
    err.close()

    result = Sandbox.probe(csb, False)
    result_name = __result_name(csb.result)
    ret = result['exitcode']
    cpu = result['cpu_info'][0]
    mem = result['mem_info'][1] * 1024

    print result_name
    if result_name == 'OK':
        return dict(out=stdout_data,
                    err=stderr_data,
                    ret=ret,
                    time=cpu,
                    mem=mem)

    elif result_name == 'ML':
        raise MemoryLimitExceedException(time=cpu,
                                         memory=mem,
                                         stderr=stderr_data)
    elif result_name == 'TL':
        raise TimeLimitExceedException(time=cpu,
                                       memory=mem,
                                       stderr=stderr_data)

    elif result_name == 'OL':
        raise DiskLimitExceedException(time=cpu,
                                       memory=mem,
                                       stderr=stderr_data)

    elif result_name in ('RF', 'RT', 'AT', ):
        raise RuntimeErrorException(time=cpu,
                                    memory=mem,
                                    stderr=stderr_data)

    else:
        raise Exception(result_name)

# Sandbox 규칙을 정의해놓은 클래스입니다.
# 각각 프로그래밍 언어마다 규칙이 다르게 정의됩니다.
class CustomSandbox(SandboxPolicy, Sandbox):
    sc_table = None
    sc_safe = dict(
        i686 = set([3, 4, 19, 45, 54, 90, 91, 122, 125, 140, 163, 192, 197, 224, 243, 252, ]),
        x86_64 = set([0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 16, 21, 25, 39, 63, 72, 79, 107, 110, 158, 231, ]), )

    def __init__(self, *args, **kwds):
        self.sc_table = [0, ] * 1024

        kwds['policy'] = self
        SandboxPolicy.__init__(self)
        Sandbox.__init__(self, *args, **kwds)


    def set(self, sc_config):
        for scno in sc_config.keys():
            self.sc_table[int(scno)] = int(sc_config[scno])


    # Event Type
    # Error, Exit, Signal, Syscall, Sysret, Quota
    # Action Type
    # Cont, Fini, Kill
    def __call__(self, event, action):
        if event.type in (S_EVENT_SYSCALL, S_EVENT_SYSRET):
            if MACHINE is 'x86_64' and event.ext0 is not 0:
                return self.__kill_restricted_func(event, action)
            return self.__check_syscall(event, action)
        return SandboxPolicy.__call__(self, event, action)

    def __check_syscall(self, event, action):
        if (event.data not in self.sc_safe[MACHINE] and
                event.type is S_EVENT_SYSCALL):
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
