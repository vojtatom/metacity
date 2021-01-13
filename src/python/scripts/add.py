from parameters import param, output


@param('a', 'number')
@param('b', 'number')
@output('output', 'number')
def call(a, b):
    return a + b