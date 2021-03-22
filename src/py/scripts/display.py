from comms import printOK, sendUpdateLayer
from metascript import MetaTypes, description, output, param, passIdentifier
from pipeline.layers import MetaLayer

@passIdentifier
@param('Layer', MetaTypes.MetaLayer)
@description('Mark Layer for display')
def call(layer: MetaLayer, layerID: str):
    sendUpdateLayer(layer.toDict(), layerID)




