from typing import List

from comms import printOK
from metascript import MetaTypes, description, output, param
from pipeline.elements import MetaObject
from pipeline.geometry import BBoxPosition, bboxPosition


@param('Objects', MetaTypes.MetaObjects)
@param('BBox', MetaTypes.BBox)
@output('Inside', MetaTypes.MetaObjects)
@output('Crossing Border', MetaTypes.MetaObjects)
@output('Outside', MetaTypes.MetaObjects)
@description('Filter list of MetaObjects based on input bounding box')
def call(objects: List[MetaObject], bbox):
    inside = []
    crossing = []
    outside = []

    for o in objects:
        pos = bboxPosition(bbox, o.bbox)
        if pos == BBoxPosition.inside:
            inside.append(o)
        elif pos == BBoxPosition.crossing:
            crossing.append(o)
        else:
            outside.append(o)

    return inside, crossing, outside



