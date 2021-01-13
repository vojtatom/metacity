from output import printOK
from loader import load_modules
from graph import compute

import json

def load_functions(data):
    modules, functions = load_modules()
    return functions


def run_project(data):
    printOK(data)
    modules, functions = load_modules()
    graph = json.loads(data['graph'])
    result = compute(graph, modules)
    return result


commands = {
    'load_functions': load_functions,
    'run': run_project
}


def process(data): 
    command = data['command']
    if command in commands:
        return commands[command](data)
        
