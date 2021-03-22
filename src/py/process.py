from commands.loader import load_modules
from commands.graph import compute
import json
import comms

import logging
logging.basicConfig(filename='python.log', level=logging.WARNING)

def loadFunctions(data, pipeline):
    modules, functions = load_modules(pipeline)
    return comms.functionList(functions)


def run(data, pipeline):
    graph = json.loads(data['graph'])
    result = compute(graph, pipeline)
    return comms.pipelineResult(result)


def clearPipeline(data, pipeline):
    pipeline.clearPipeline()
    return comms.pipelineCleared()


commands = {
    'loadFunctions': loadFunctions,
    'run': run,
    'clearPipeline': clearPipeline
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
