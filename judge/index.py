#!/usr/bin/python
# -*- encoding: utf-8 -*-
################################################################################
# Sandbox Libraries (Python) - Sample Script                                   #
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
# 이 파이썬 스크립트는 pysandbox sample2.py를 수정한 부분이 포함되어 있습니다.

import os
import sys
import tempfile

#@TODO Sandbox 만들어야되는데.. 후우..
# syscalls 테이블
# http://docs.cs.up.ac.za/programming/asm/derick_tut/syscalls.html
# http://blog.rchapman.org/post/36801038863/linux-system-call-table-for-x86-64

# 이 try 블럭(?)은 pysandbox sample2.py를 참고하였습니다.
try:
    # syscall 테이블이 완전히 다르기 떄문에 꼭 확인해주어야됨
    system, machine = os.uname()[0], os.uname()[4]

    if system not in ('Linux') or machine not in ('i686', 'x86_64', ):
        raise AssertionError("Unsupported platform type.\n")

    # https://github.com/openjudge/sandbox
    import sandbox

    # 혹시 모르니 버전 잘 지키자...
    if not hasattr(sandbox, '__version__' or sandbox.__version__ < "0.3.3-rc2"):
        raise AssertionError("Unsupported sandbox version.\n")

    from sandbox import *
except ImportError:
    sys.stderr.write("Required package(s) missing.\n")
    sys.stderr.write("Please install sandbox through below link.\n")
    sys.stderr.write("https://github.com/openjudge/sandbox\n")
    sys.exit(os.EX_UNAVAILABLE)
except AssertionError, e:
    sys.stderr.write(str(e))
    sys.exit(os.EX_UNAVAILABLE)

# 반환 코드를 문자로 바꿔준다. sample2.py에서 가져옴
# 하지만 문자로 바꿔줘도 뭔지 알기 어려우므로 아래 설명을 참고.
# PD: Pending? (디폴트 값 인것 같다.)
# OK: 정상 종료
# RF: 금지된 함수 사용
# ML: 메모리 초과
# OL: 출력 초과
# TL: 시간 초과
# RT: 런타임 에러
# AT: 비정상 종료 (exit-code <> 0)
# IE: 에러
# BP: Bad Policy?
def result_name(r):
    return ('PD', 'OK', 'RF', 'ML', 'OL', 'TL', 'RT', 'AT', 'IE', 'BP')[r] \
        if r in xrange(10) else None

#@TODO 추후 이 클래스 다른 모듈로 분리
class MiniSandbox(SandboxPolicy, Sandbox):
    syscalls_table = None
    syscalls_safe = dict(i686 = set([3, 4, 19, 45, 54, 90, 91, 122, 125, 140, 163, \
        192, 197, 224, 243, 252, ]), x86_64 = set([0, 1, 5, 8, 9, 10, 11, 12, \
        16, 25, 63, 158, 231, ]), )

    def __init__(self, *args, **kwds):
        self.syscalls_table = [self._KILL_RF, ] * 1024
        for syscall_num in MiniSandbox.syscalls_safe[machine]:
            self.syscalls_table[syscall_num] = self._CONT

        kwds['policy'] = self
        SandboxPolicy.__init__(self)
        Sandbox.__init__(self, *args, **kwds)
    def __call__(self, event, action):
        if event.type in (S_EVENT_SYSCALL, S_EVENT_SYSRET):
            if machine is 'x86_64' and event.ext0 is not 0:
                return self._KILL_RF(event, action)
            return self.syscalls_table[event.data](event, action)

        return SandboxPolicy.__call__(self, event, action)

    def _CONT(self, event, action):
        action.type = S_ACTION_CONT
        return action

    def _KILL_RF(self, event, action):
        action.type, action.data = S_ACTION_KILL, S_RESULT_RF
        return action

class CompileModule:
    def __init__(self):

    def compile(self):

def main(args):
    # sandbox에서 처리를 해주겠지만 Root 권한으로 이 스크립트가 실행되는 것을 막는다.
    isRoot = os.getuid() == 0
    if isRoot is True:
        sys.stderr.write("Operation not permitted through root.\n")
        return os.EX_UNAVAILABLE

    #@TODO args 어떤 식으로 받을 지 고민..
    # args[1] submission_id
    # args[2] problem_id
    # args[3] user_id
    return os.EX_OK

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(os.EX_USAGE)
    sys.exit(main(sys.argv))
