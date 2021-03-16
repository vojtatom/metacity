from typing import List

import numpy as np
from metascript import MetaTypes, description, output, param
from pipeline.elements import MetaObject
from pipeline.geometry import bboxForBBoxes


@param('Objects', MetaTypes.MetaObjects)
@output('BBox', MetaTypes.BBox)
@description('Compute BBox of objects')
def call(objects: List[MetaObject]):
    
    bboxes = []
    for o in objects:
        bboxes.append(o.bbox)
    bbox = bboxForBBoxes(bboxes)
    
    return bbox


    







