# --coding: utf-8 --
import subprocess
import time

import threading
import Queue

# psutil 설치가 필요합니다.
# sudo ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-error-in-future pip install psutil
import psutil

from constants import (TimeLimitExceedException,
                       MemoryLimitExceedException,
                       DiskLimitExceedException,
                       RuntimeErrorException)

class AsyncPipeReader(threading.Thread):
    def __init__(self, stream, queue):
        threading.Thread.__init__(self)
        self.stream = stream
        self.queue = queue

    def run(self):
        for line in iter(self.stream.readline, b''):
            self.queue.put(line)

    def eof(self):
        return not self.is_alive() and self.queue.empty()


def __execute(*cmd, **kwds):
    try:
        proc = subprocess.Popen(*cmd,
                                shell=False,
                                stdin=subprocess.PIPE,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE)

        # 시간, 메모리, 출력 제한 설정
        time_limit = kwds.pop('timeLimit', 10) # 10s
        memory_limit = kwds.pop('memoryLimit', 1024*1024*2) # 2mb
        disk_limit = kwds.pop('diskLimit', 1024*1024*10) # 10mb

        def except_limit(mtime, mmemory, mdisk):
            if disk_limit < mdisk:
                raise DiskLimitExceedException(time=mtime,
                                               memory=mmemory,
                                               stderr=proc.stderr)

            if time_limit < mtime:
                raise TimeLimitExceedException(time=mtime,
                                               memory=mmemory,
                                               stderr=proc.stderr)

            if memory_limit < mmemory:
                raise MemoryLimitExceedException(time=mtime,
                                                 memory=mmemory,
                                                 stderr=proc.stderr)


        # 시간 및 메모리, 출력물의 초기값을 설정합니다.
        end_time = begin_time = 0
        maxrss = 0
        stdout_data = ''

        # 프로그램의 stdout을 비동기적으로 받아오기 위해 스레드를 돌립니다.
        stdout_queue = Queue.Queue()
        std_out_reader = AsyncPipeReader(proc.stdout, stdout_queue)
        std_out_reader.start()

        process_info = psutil.Process(proc.pid)
        end_time = begin_time = process_info.create_time()

        # 프로그램이 종료될때 까지 주기적으로 검사합니다.
        while proc.poll() is None:
            while not stdout_queue.empty():
                stdout_data += stdout_queue.get()

            disk_size = len(stdout_data)
            execute_time = end_time - begin_time
            maxrss = process_info.memory_info().rss

            except_limit(execute_time, maxrss, disk_size)

            # 검사가 0.016초 주기로 이루어 지도록 합니다.
            time.sleep(0.016)
            end_time = time.time()

        while not stdout_queue.empty():
            stdout_data += stdout_queue.get()
        stdout_data += proc.stdout.read()

        disk_size = len(stdout_data)
        # 프로그램 종료 후 제한 조건에 대해서 한번 더 검사합니다.
        except_limit(execute_time, maxrss, disk_size)

        # 디버그 용도로 프로그램의 출력물을 화면에 출력
        #"""
        print "stdout:", stdout_data
        print "returncode:", proc.returncode
        print "stderr:", proc.stderr.read()
        #"""

        # 비정상 종료되었을경우 런타임 에러나 샌드박스 정책에 의해 실행이 안 되었을수도 있다.
        # 이때에는 런타임 에러 예외를 던져준다.
        if proc.returncode != 0:
            raise RuntimeErrorException(time=execute_time,
                                        memory=maxrss,
                                        stderr=proc.stderr)

        return dict(out=stdout_data,
                    err=proc.stderr.read(),
                    ret=proc.returncode,
                    time=execute_time,
                    mem=maxrss)

    except (TimeLimitExceedException,
            MemoryLimitExceedException,
            DiskLimitExceedException,
            RuntimeErrorException) as inst:
        # 시간 초과, 메모리 사용량 초과, 출력물 제한 용량 초과 시 이를 그대로 다른 try문에 던집니다.
        # start.py에 있는 except문에서 잘 처리해줄겁니다.
        if proc.poll() is None:
            proc.terminate()
        raise inst

    except Exception, inst:
        # 알 수 없는 예외가 발생했습니다.
        # 이 경우에는 OSError로 예외를 던져 start.py에서 Internal Error로 처리하게 할겁니다.
        if proc.poll() is None:
            proc.terminate()
        raise OSError("Sandboxing Failed.")

def execute(executable, cmd, **kwds):
    #working_directory = kwds['working-dir']
    working_directory = '/bin/'

    # 맥에서 사용되는 sandbox-exec를 이용해 샌드박스 환경을 구성합니다.
    # 우선 C/C++언어에 대한 샌드박스 설정만 해놓았습니다.
    base_profile = \
    """
    (version 1)
    (debug all)
    (allow default)
    """

    base_command = ['sandbox-exec', '-p',
                    base_profile.format(working_directory, executable),
                    executable]
    if len(cmd) is not 0:
        base_command.extend(cmd)
    return __execute(base_command)
