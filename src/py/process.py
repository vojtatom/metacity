from output import printOK
from loader import load_modules
from graph import compute
import json
import comms

import logging
logging.basicConfig(filename='python.log', level=logging.DEBUG)

def loadFunctions(data):
    modules, functions = load_modules()
    return comms.functionList(functions)


def run(data):
    modules, functions = load_modules()
    graph = json.loads(data['graph'])
    result = compute(graph, modules, functions)
    return comms.pipelineResult(result)


commands = {
    'loadFunctions': loadFunctions,
    'run': run
}


def process(data): 
    logger = logging.getLogger(__name__)
    command = data['command']
    
    try:
        if command in commands:
            output = commands[command](data)
            return output

    except Exception as e: 
        logger.error("Failed command {0}\n".format(str(command)))
        logger.exception(e)
        return comms.error(e)
