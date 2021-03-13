from functions import param, output, description
from objects import MetaLayer
from comms import sendAddLayer


@param('Layer', 'MetaLayer')
#@output('DisplayLayer', 'DisplayLayer')
@description('Mark Layer for display')
def call(layer: MetaLayer):
    #with open('test.json', "w") as file:
    #    file.write(layer.toJSON())

    #return layer.toDict()
    sendAddLayer(layer.toDict())




