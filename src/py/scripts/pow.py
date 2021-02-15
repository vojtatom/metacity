from parameters import param, output, description


@param('value', 'number')
@param('power', 'number')
@output('value', 'number')
@description('Returns a power of the base value')
def call(value, power):
    return value ** power