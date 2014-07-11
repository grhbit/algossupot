import os
import json

import constants
import check

class Problem:
    def __init__(self, problemPath):
        jsonObjPath = os.path.join(problemPath, './index.json')
        jsonObj = json.loads(open(jsonObjPath).read())

        contents = jsonObj.get('contents')
        self.checkType = contents.get('checkType', 1)
        self.check = check.Check(self.checkType)
        self.timeLimit = int(contents.get('timeLimit', constants.DEFAULT_TIMELIMIT))
        self.memoryLimit = int(contents.get('memoryLimit', constants.DEFAULT_MEMORYLIMIT))
        self.diskLimit = int(contents.get('diskLimit', constants.DEFAULT_DISKLIMIT))
