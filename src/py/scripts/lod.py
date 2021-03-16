from metascript import MetaTypes, description, output, value


@value('0', MetaTypes.BoolField, False)
@value('1', MetaTypes.BoolField, False)
@value('2', MetaTypes.BoolField, False)
@value('3', MetaTypes.BoolField, True)
@value('4', MetaTypes.BoolField, False)
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

