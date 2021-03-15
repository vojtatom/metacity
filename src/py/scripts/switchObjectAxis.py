from functions import param, value, output, description
from objects import MetaObject
from comms import printOK
from typing import List
from geometry import testBBoxPosition, BBoxPosition



@param('Objects', 'MetaObjects')
@value('From Axis', 'select', 'z', optionals=['x', 'y', 'z'])
@value('To Axis', 'select', 'y', optionals=['x', 'y', 'z', '-x', '-y', '-z'])
@output('Objects', 'MetaObjects')
@description('Filter list of MetaObjects based on input bounding box')
def call(objects: List[MetaObject], from_axis: str, to_axis: str):
    for o in objects:
        o.switchAxis(from_axis, to_axis)
    
    return objects


