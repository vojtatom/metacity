from functions import param, output, description
from objects import MetaObject
from typing import List
import geometry
from comms import printOK

import numpy as np


@param('Objects', 'MetaObjects')
@output('BBox', 'BBox')
@description('Compute BBox of objects')
def call(objects: List[MetaObject]):
    endpoints = []
    for o in objects:
        bbox = o.getBBox()
        endpoints.append(bbox)

    vertices = np.concatenate(endpoints)
    vertices = vertices.flatten()
    vertices = vertices.reshape((vertices.shape[0] // 3, 3))
    bbox = geometry.computeBBox(vertices)
    printOK(bbox)
    return bbox


    







