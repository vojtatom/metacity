from functions import param, output, description
from objects import MetaObject
from comms import printOK
from typing import List
from geometry import testBBoxPosition, BBoxPosition



@param('Objects', 'MetaObjects')
@param('BBox', 'BBox')
@output('Inside', 'MetaObjects')
@output('Crossing Border', 'MetaObjects')
@output('Outside', 'MetaObjects')
@description('Filter list of MetaObjects based on input bounding box')
def call(objects: List[MetaObject], bbox):
    inside = []
    crossing = []
    outside = []

    for o in objects:
        objBBox = o.getBBox()
        pos = testBBoxPosition(bbox, objBBox)
        if pos == BBoxPosition.inside:
            inside.append(o)
        elif pos == BBoxPosition.crossing:
            crossing.append(o)
        else:
            outside.append(o)

    printOK(len(inside))
    printOK(len(crossing))
    printOK(len(outside))
    return inside, crossing, outside



