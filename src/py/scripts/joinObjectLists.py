from functions import param, output, description
from objects import MetaObject
from comms import sendAddLayer
from typing import List
from geometry import testBBoxPosition, BBoxPosition

import numpy as np


@param('Objects A', 'MetaObjects')
@param('Objects B', 'MetaObjects')
@output('Outside', 'MetaObjects')
@description('Join two lists of MetaObjects')
def call(objectsA: List[MetaObject], objectsB: List[MetaObject]):
    joined = []
    joined.extend(objectsA)
    joined.extend(objectsB)
    return joined



