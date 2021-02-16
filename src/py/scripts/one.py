from parameters import value, output, description


@value('name', 'string', 'Hello World')
@value('checkmark', 'bool', False)
@output('s', 'string')
@output('n', 'number')
@description('Returns one again!')
def call(name, checkmark):
    return 'test string', 1

