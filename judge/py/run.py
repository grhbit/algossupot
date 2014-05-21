import sys
import subprocess

def __execute(cmd):
    fd = subprocess.Popen([sys.executable, cmd],
            shell=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
    fd.wait()

def execute(language, runnablePath, inputPath, outputPath, resultPath):
    langMap = {
        'C++': cpp
    }
    return langMap.get(language)(runnablePath)
