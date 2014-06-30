#!/usr/bin/env python
################################################################################
# Sandbox Libraries (Python)                                                   #
#                                                                              #
# Copyright (C) 2009-2011 LIU Yu, <pineapple.liu@gmail.com>                    #
# All rights reserved.                                                         #
#                                                                              #
# Redistribution and use in source and binary forms, with or without           #
# modification, are permitted provided that the following conditions are met:  #
#                                                                              #
# 1. Redistributions of source code must retain the above copyright notice,    #
#    this list of conditions and the following disclaimer.                     #
#                                                                              #
# 2. Redistributions in binary form must reproduce the above copyright notice, #
#    this list of conditions and the following disclaimer in the documentation #
#    and/or other materials provided with the distribution.                    #
#                                                                              #
# 3. Neither the name of the author(s) nor the names of its contributors may   #
#    be used to endorse or promote products derived from this software without #
#    specific prior written permission.                                        #
#                                                                              #
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"  #
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE    #
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE   #
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE     #
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR          #
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF         #
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS     #
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN      #
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)      #
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE   #
# POSSIBILITY OF SUCH DAMAGE.                                                  #
################################################################################

try:
    import os
    import sys
    import getopt
    import json

    # check platform type
    system, machine = os.uname()[0], os.uname()[4]
    if system not in ('Linux', ) or machine not in ('i686', 'x86_64', ):
        raise AssertionError("Unsupported platform type.\n")

    # check package availability / version
    import sandbox
    if not hasattr(sandbox, '__version__') or sandbox.__version__ < "0.3.3-rc2":
        raise AssertionError("Unsupported sandbox version.\n")
    from sandbox import *

except ImportError:
    sys.stderr.write("Required package(s) missing.\n")
    sys.exit(os.EX_UNAVAILABLE)

except AssertionError, e:
    sys.stderr.write(str(e))
    sys.exit(os.EX_UNAVAILABLE)

def main(args):
    cookbook = {
        'args': args[1:], # targeted program
        'stdin': sys.stdin, # input to targeted program
        'stdout': sys.stdout, # output from targeted program
        'stderr': sys.stdout, # error from targeted program
        'quota': dict(wallclock = 30000, cpu = 30000, memory = 88388608, disk = 1048576)
    }

    # create a sandbox instance and execute till end
    msb = MiniSandbox(**cookbook)
    msb.run()

    print >> sys.stderr, json.dumps(msb.sc_table)

class MiniSandbox(SandboxPolicy,Sandbox):
    sc_table = dict()
    sc_safe = dict(
        i686 = set([3, 4, 19, 45, 54, 90, 91, 122, 125, 140, 163, 192, 197, 224, 243, 252, ]),
        x86_64 = set([0, 1, 2, 3, 5, 8, 9, 10, 11, 12, 13, 16, 21, 25, 39, 63, 72, 79, 107, 110, 158, 231, ]), )

    def __init__(self, *args, **kwds):
        # initialize as a polymorphic sandbox-and-policy object
        kwds['policy'] = self
        SandboxPolicy.__init__(self)
        Sandbox.__init__(self, *args, **kwds)

    def __call__(self, e, a):
        # handle SYSCALL/SYSRET events with local handlers
        if e.type in (S_EVENT_SYSCALL, S_EVENT_SYSRET):
            if machine is 'x86_64' and e.ext0 is not 0:
                a.type, a.data = S_ACTION_KILL, S_RESULT_RF
                return a

            if e.type is 4 and e.data not in self.sc_safe[machine]:
                self.sc_table[e.data] = self.sc_table.get(e.data, 0) + 1

            a.type = S_ACTION_CONT
            return a
        # bypass other events to base class
        return SandboxPolicy.__call__(self, e, a)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(os.EX_USAGE)

    sys.exit(main(sys.argv))
