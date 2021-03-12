from functions import param, output, description
from objects import MetaLayer


@param('Layer', 'MetaLayer')
@description('Mark Layer for display')
def call(layer: MetaLayer):
    with open('test.json', "w") as file:
        file.write(layer.toJSON())




