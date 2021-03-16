from typing import List

from metascript import MetaTypes, description, output, param
from pipeline.elements import MetaObject


@param('Objects A', MetaTypes.MetaObjects)
@param('Objects B', MetaTypes.MetaObjects)
@output('Outside', MetaTypes.MetaObjects)
@description('Join two lists of MetaObjects')
def call(objectsA: List[MetaObject], objectsB: List[MetaObject]):
    joined = []
    joined.extend(objectsA)
    joined.extend(objectsB)
    return joined



