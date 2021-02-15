from output import printOK
from loader import load_modules
from graph import compute
import logging

import json

logging.basicConfig(filename='python.log', level=logging.DEBUG)

def load_functions(data):
    modules, functions = load_modules()
    return functions


def run_project(data):
    modules, functions = load_modules()
    graph = json.loads(data['graph'])
    result = compute(graph, modules, functions)
    return result


commands = {
    'load_functions': load_functions,
    'run': run_project
}


def process(data): 
    logger = logging.getLogger(__name__)
    command = data['command']
    printOK(command)
    
    try:
        if command in commands:
            return commands[command](data)
    except Exception as e:     # most generic exception you can catch
        logger.error("Failed command {0}\n".format(str(command)))
        logger.exception(e)
        # optional: delete local version of failed download
    finally:
        # optional clean up code
        pass
