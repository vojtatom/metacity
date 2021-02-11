from parameters import param, output, description


@output('value', 'number')
@description('Returns one')
def call():
    return 1