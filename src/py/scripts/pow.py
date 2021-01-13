from parameters import param, output


@param('value', 'number')
@param('power', 'number')
@output('value', 'number')
def call(value, power):
    return value ** power