from parameters import value, output, description


@value('name', 'string', 'Hello World')
#@value('count', 'number', 0)
#@value('file', 'file', 'text.txt')
#@value('c', 'color', [255, 150, 120])
@value('checkmark', 'bool', False)
#@value('vector', 'vec3', [10, 20, 30])
@output('s', 'string')
@output('n', 'number')
@output('f', 'file')
@output('c', 'color')
@output('b', 'bool')
@output('v', 'vec3')
@description('Returns one')
def call(s, n, f, c, b, v):
    return s, n, f, c, b, v