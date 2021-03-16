from typing import List

from comms import printOK
from metascript import MetaTypes, description, output, param, value
from pipeline.elements import MetaObject
from pipeline.geometry import switchAxis


@param('Objects', MetaTypes.MetaObjects)
@value('From Axis', MetaTypes.SelectField, 'z', optionals=['x', 'y', 'z'])
@value('To Axis', MetaTypes.SelectField, 'y', optionals=['x', 'y', 'z', '-x', '-y', '-z'])
@output('Objects', MetaTypes.MetaObjects)
@description('Filter list of MetaObjects based on input bounding box')
def call(objects: List[MetaObject], from_axis: str, to_axis: str):
    
    geometries = []
    for o in objects:
        geometries.extend(o.geometry)
    switchAxis(geometries, from_axis, to_axis)
 
    return objects


