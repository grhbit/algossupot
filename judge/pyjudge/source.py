# -*- coding: utf-8 -*-

import os
import compile
from program import Program

class Source(object):

    def __init__(self, path, language):
        self.path = path
        self.language = language
        self.output = None


    def compile(self, output_path):
        compile.execute(self.language, output_path)
        self.output = output_path
        return Program(self, output_path)


    def clean(self):
        if self.output != None:
            os.unlink(self.output)
