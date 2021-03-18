from commands.loader import load_modules
from commands.graph import compute
import json
import comms

import logging
logging.basicConfig(filename='python.log', level=logging.WARNING)

def loadFunctions(data, pipeline):
    modules, functions = load_modules()
    return comms.functionList(functions)


def run(data, pipeline):
    modules, functions = load_modules()
    graph = json.loads(data['graph'])
    result = compute(graph, modules, functions, pipeline)
    return comms.pipelineResult(result)


commands = {
    'loadFunctions': loadFunctions,
    'run': run
}

def process(data, loop, pipeline): 
    logger = logging.getLogger(__name__)
    command = data['command']

    comms.setLoop(loop)

    try:
        if command in commands:
            output = commands[command](data, pipeline)

    except Exception as e: 
        logger.error("Failed command {0}\n".format(str(command)))
        logger.exception(e)
        output = comms.error(e) 
    
    finally:
        return output
