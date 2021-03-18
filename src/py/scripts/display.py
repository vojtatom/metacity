from comms import printOK, sendAddLayer
from metascript import MetaTypes, description, output, param
from pipeline.layers import MetaLayer


@param('Layer', MetaTypes.MetaLayer)
@description('Mark Layer for display')
def call(layer: MetaLayer):
    sendAddLayer(layer.toDict())




