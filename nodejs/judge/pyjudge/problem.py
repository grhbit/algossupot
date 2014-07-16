# -*- coding: utf-8 -*-

import os
import json

from constants import (DEFAULT_TIMELIMIT,
                       DEFAULT_MEMORYLIMIT,
                       DEFAULT_DISKLIMIT)
import check

class Problem(object):

    def __init__(self, problem_path):
        json_obj_path = os.path.join(problem_path, './index.json')
        json_obj = json.loads(open(json_obj_path).read())

        self.path = problem_path

        info = json_obj # json_obj.get('contents')
        self.check_type = info.get('checkType', 'strict')
        self.time_limit = int(info.get('timeLimit', DEFAULT_TIMELIMIT))
        self.memory_limit = int(info.get('memoryLimit', DEFAULT_MEMORYLIMIT))
        self.disk_limit = int(info.get('diskLimit', DEFAULT_DISKLIMIT))


    def check(self):
        pass

