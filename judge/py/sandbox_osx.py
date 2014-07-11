# --coding: utf-8 --
import os
import sys
import subprocess
import time

import threading
import Queue

# psutil 설치가 필요합니다.
# sudo ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-error-in-future pip install psutil
import psutil

import constants

TimeLimitExceed = constants.TimeLimitExceedException
MemoryLimitExceed = constants.MemoryLimitExceedException
DiskLimitExceed = constants.DiskLimitExceedException
RuntimeError = constants.RuntimeErrorException

class AsyncPipeReader(threading.Thread):
    def __init__(self, fd, queue):
        threading.Thread.__init__(self)
        self.fd = fd
        self.queue = queue

    def run(self):
        for line in iter(self.fd.readline, b''):
            self.queue.put(line)

    def eof(self):
        return not self.is_alive() and self.queue.empty()

def __execute(*cmd, **kwds):
    try:
        proc = subprocess.Popen(*cmd, #["sandbox-exec", "-p", "(version 1)(debug all)(allow default)", "./a.out"],
                shell=False,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE)

        # 시간, 메모리, 출력 제한 설정
        timeLimit = kwds.pop('timeLimit', 10) # 10s
        memoryLimit = kwds.pop('memoryLimit', 1024*1024*2) # 2mb
        diskLimit = kwds.pop('diskLimit', 1024*1024*10) # 10mb

        def exceptLimit(time, memory, disk):
            if diskLimit < disk:
                raise DiskLimitExceed(time=time,
                    memory=memory,
                    stderr=proc.stderr)

            if timeLimit < time:
                raise TimeLimitExceed(time=time,
                    memory=memory,
                    stderr=proc.stderr)

            if memoryLimit < memory:
                raise MemoryLimitExceed(time=time,
                    memory=memory,
                    stderr=proc.stderr)

        # 시간 및 메모리, 출력물의 초기값을 설정합니다.
        endTime = beginTime = 0
        maxrss = 0
        stdoutData = ''

        # 프로그램의 stdout을 비동기적으로 받아오기 위해 스레드를 돌립니다.
        stdoutQueue = Queue.Queue()
        stdOutReader = AsyncPipeReader(proc.stdout, stdoutQueue)
        stdOutReader.start()

        processInfo = psutil.Process(proc.pid)
        endTime = beginTime = processInfo.create_time()

        # 프로그램이 종료될때 까지 주기적으로 검사합니다.
        while proc.poll() is None:
            while not stdoutQueue.empty():
                stdoutData += stdoutQueue.get()

            diskSize = len(stdoutData)
            executeTime = endTime - beginTime
            maxrss = processInfo.memory_info().rss

            exceptLimit(executeTime, maxrss, diskSize)

            # 검사가 0.016초 주기로 이루어 지도록 합니다.
            time.sleep(0.016)
            endTime = time.time()

        while not stdoutQueue.empty():
            stdoutData += stdoutQueue.get()
        stdoutData += proc.stdout.read()

        diskSize = len(stdoutData)
        # 프로그램 종료 후 제한 조건에 대해서 한번 더 검사합니다.
        exceptLimit(endTime-beginTime, maxrss, diskSize)

        # 디버그 용도로 프로그램의 출력물을 화면에 출력
        #"""
        print "stdout:", stdoutData
        print "returncode:", proc.returncode
        print "stderr:", proc.stderr.read()
        #"""

        # 비정상 종료되었을경우 런타임 에러나 샌드박스 정책에 의해 실행이 안 되었을수도 있다.
        # 이때에는 런타임 에러 예외를 던져준다.
        if proc.returncode != 0:
            raise RuntimeError(time=executeTime,
                memory=maxrss,
                stderr=proc.stderr)

        return stdoutData, proc.stderr.read(), proc.returncode

    except (TimeLimitExceed, MemoryLimitExceed, DiskLimitExceed, RuntimeError) as e:
        # 시간 초과, 메모리 사용량 초과, 출력물 제한 용량 초과 시 이를 그대로 다른 try문에 던집니다.
        # start.py에 있는 except문에서 잘 처리해줄겁니다.
        if proc.poll() is None:
            proc.terminate()
        raise e
    except Exception, e:
        # 알 수 없는 예외가 발생했습니다.
        # 이 경우에는 OSError로 예외를 던져 start.py에서 Internal Error로 처리하게 할겁니다.
        if proc.poll() is None:
            proc.terminate()
        raise OSError("Sandboxing Failed.")

def execute(executable, cmd, **kwds):
    #workingDirectory = kwds['working-dir']
    workingDirectory = '/bin/'

    # 맥에서 사용되는 sandbox-exec를 이용해 샌드박스 환경을 구성합니다.
    # 우선 C/C++언어에 대한 샌드박스 설정만 해놓았습니다.
    baseProfile = \
    """
    (version 1)
    (debug all)
    (allow default)
    """

    baseCmd = ['sandbox-exec', '-p', baseProfile.format(workingDirectory, executable), executable]
    if len(cmd) is not 0:
        baseCmd.extend(*cmd)
    return __execute(baseCmd)
