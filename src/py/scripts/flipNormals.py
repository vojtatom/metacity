from metascript import MetaTypes, description, output, param
from pipeline.layers import MetaLayer


@param('Layer', MetaTypes.MetaLayer)
@output('Layer', MetaTypes.MetaLayer)
@description('Creates a visualization Layer from MetaObjects with selected Levels of Detail')
def call(layer: MetaLayer):
    flippedLayer = layer.flipNormals()
    return flippedLayer
