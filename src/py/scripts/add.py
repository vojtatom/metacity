from parameters import param, output, description


@param('a', 'number')
@param('b', 'number')
@output('output', 'number')
@description('Adds two numbers together')
def call(a, b):
    return a + b