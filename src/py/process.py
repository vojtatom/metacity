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
    with open("crash.log", "w") as logf:
        command = data['command']
        
        try:
            if command in commands:
                return commands[command](data)
        except Exception as e:     # most generic exception you can catch
            logf.write("Failed command {0}: {1}\n".format(str(command), str(e)))
            # optional: delete local version of failed download
        finally:
            # optional clean up code
            pass
