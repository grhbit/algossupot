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
        self.timeLimit = int(contents.get('timeLimit', '1024'))
        self.memoryLimit = int(contents.get('memoryLimit', '1024'))
        self.diskLimit = int(contents.get('diskLimit', '1024'))
