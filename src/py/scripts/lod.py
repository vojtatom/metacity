from functions import value, output, description


@value('0', 'bool', False)
@value('1', 'bool', False)
@value('2', 'bool', False)
@value('3', 'bool', True)
@value('4', 'bool', False)
@output('LoDs', 'LoDs')
@description('List of selected levels of detail')
def call(zero, one, two, three, four):
    lods = []

    if zero:
        lods.append(0)
    if one:
        lods.append(1)
    if two:
        lods.append(2)
    if three:
        lods.append(3)
    if four:
        lods.append(4)
    
    return lods

