from functions import param, output, description
from objects import MetaObjectLayer, MetaObject
from typing import List


@param('LoDs', 'Test')
@param('Objects', 'MetaObjects')
@output('Layer', 'MetaLayer')
@description('Creates a visualization Layer from MetaObjects with selected Levels of Detail')
def call(objects: List[MetaObject], lods: List[int]):
    layer = MetaObjectLayer(lods, objects)
    return layer
