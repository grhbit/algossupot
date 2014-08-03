#!/usr/bin/env python

import Queue
import getopt
import json
import os
import subprocess
import sys
import threading
import time

class RunningException(Exception):
    def __init__(self, message, mtime, mmemory, mdisk):
        self.time = mtime
        self.memory = mmemory
        self.disk = mdisk

        Exception.__init__(self, message)

    def __str__(self):
        return json.dumps(dict(time='%u' % self.time,
                               memory='%u' % self.memory,
                               disk='%u' % self.disk,
                               state='%s' % self.args[0]))


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


class Proc(object):
    def __init__(self, pid):
        self.pid = pid
        self.max_memory = 0

    def running(self):
        return os.path.exists("/proc/%d" % self.pid)


    def status(self):
        return open("/proc/%d/stat" % self.pid).read().split(' ')[2]

    def get_max_memory(self):
        if self.running():
            self.max_memory = max(self.max_memory, self.get_memory())

        return self.max_memory

    def get_memory(self):
        return int(open("/proc/%d/statm" % self.pid).read().split(' ')[1])


def parse_options(args):
    #default values
    time_limit = memory_limit = disk_limit = \
        in_path = out_path = err_path = None
    opts, args = getopt.getopt(args[1:], "t:m:d:", [
        "in=",
        "out=",
        "err="])

    for opt, arg in opts:
        if opt == '-t':
            time_limit = int(arg)
        if opt == '-m':
            memory_limit = int(arg)
        if opt == '-d':
            disk_limit = int(arg)
        if opt == '--in':
            in_path = arg
        if opt == '--out':
            out_path = arg
        if opt == '--err':
            err_path = arg

    return time_limit, memory_limit, disk_limit, \
        in_path, out_path, err_path, args


def main(argv):
    time_limit, memory_limit, disk_limit, \
        in_path, out_path, err_path, args = parse_options(argv)

    subproc = \
        subprocess.Popen(
            args,
            shell=False,
            stdin=open(in_path, 'r+') \
                if not in_path is None else subprocess.PIPE,
            stdout=open(out_path, 'w+') \
                if not out_path is None else subprocess.PIPE,
            stderr=open(err_path, 'w+') \
                if not err_path is None else subprocess.PIPE)


    def except_limit(mtime, mmemory, mdisk):
        if time_limit < mtime:
            raise RunningException('TimeLimitExceed', mtime, mmemory, mdisk)

        if  memory_limit < mmemory:
            raise RunningException('MemoryLimitExceed', mtime, mmemory, mdisk)

        if disk_limit < mdisk:
            raise RunningException('OutputLimitExceed', mtime, mmemory, mdisk)

    stdout_queue = stdout_reader = stdout_data = None

    if out_path is None:
        stdout_data = ''
        stdout_queue = Queue.Queue()
        stdout_reader = AsyncPipeReader(subproc.stdout, stdout_queue)
        stdout_reader.start()

    proc = Proc(subproc.pid)
    end_time = begin_time = time.time()

    try:
        while subproc.poll() is None:
            if out_path is None:
                while not stdout_queue.empty():
                    stdout_data += stdout_queue.get()

            except_limit(mtime=float(end_time-begin_time) * 1000,
                         mmemory=proc.get_max_memory(),
                         mdisk=int(os.path.getsize(out_path) \
                            if not out_path is None \
                            else len(stdout_data)) / 1024)

            end_time = time.time()
            time.sleep(0.001)

        subproc.wait()

        if out_path is None:
            while not stdout_queue.empty():
                stdout_data += stdout_queue.get()
            stdout_data += subproc.stdout.read()

        mtime = float(end_time-begin_time) * 1000
        mmemory = proc.get_max_memory()
        mdisk = int(os.path.getsize(out_path) \
            if not out_path is None else len(stdout_data) / 1024)
        except_limit(mtime, mmemory, mdisk)

        if subproc.returncode != 0:
            raise RunningException('RuntimeError', mtime, mmemory, mdisk)

        return dict(time=mtime, memory=mmemory, disk=mdisk, state="Passed")

    except Exception, inst:
        if subproc.poll() is None:
            subproc.terminate()
        raise inst

    return 0


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(os.EX_USAGE)

    try:
        print json.dumps(main(sys.argv))
    except RunningException as inst:
        print inst.__str__()
    except Exception as inst:
        print >> sys.stderr, inst
        print "InternalError"
