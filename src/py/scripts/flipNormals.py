from functions import param, output, description
from objects import MetaLayer

import geometry

@param('Layer', 'MetaLayer')
@output('Layer', 'MetaLayer')
@description('Creates a visualization Layer from MetaObjects with selected Levels of Detail')
def call(layer: MetaLayer):
    layer.flipNormals()
    return layer
