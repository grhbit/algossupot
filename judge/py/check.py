import os
import re


def simple_diff(output, answer):
    return output != answer

def execute(checkType, output, answer):
    checkTypeMap = {
        '1': simple_diff
    }

    checkTypeMap.get(checkType)(output, answer)

