# -*- coding: utf-8 -*-

import sandboxing.start

class Program(object):

    def __init__(self, source, path):
        self.source = source
        self.path = path


    def run(self, problem):
        return sandboxing.start.run(self, problem)


    def clean(self):
        pass
