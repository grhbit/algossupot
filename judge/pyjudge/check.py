
def strict(output, answer):
    return output == answer

def execute(checkType, output, answer):
    checkTypeMap = {
        'strict': strict
    }

    checkTypeMap.get(checkType)(output, answer)

