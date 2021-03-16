from typing import List

from metascript import MetaTypes, description, output, param
from pipeline.elements import MetaObject
from pipeline.layers import MetaObjectLayer


@param('Objects', MetaTypes.MetaObjects)
@output('Layer', MetaTypes.MetaLayer)
@description('Creates a visualization Layer from MetaObjects with selected Levels of Detail')
def call(objects: List[MetaObject]):
    layer = MetaObjectLayer(objects)
    return layer
