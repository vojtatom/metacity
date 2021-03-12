import asyncio
import json

metaCommsSocket = None


async def asyncSend(message):
    global metaCommsSocket
    if metaCommsSocket:
        message = json.dumps(message)
        await metaCommsSocket.send(message)


def send(message):
    asyncio.run(asyncSend(message))


def sendProgress(percentage, message):
    send({
        "status": "progress",
        "progress": percentage,
        "message": message
    })


def sendProgressPerc(percentage):
    sendProgress(percentage, f"{percentage}%")


def sendNodeFinished(title):
    send({
        "status": "nodeDone",
        "title": title
    })


def sendNodeStarted(title):
    send({
        "status": "nodeStarted",
        "title": title
    })

def error(error):
    return json.dumps({
        "status": error,
        "error": "Pipeline processing failed: {}".format(error)
        })


def functionList(data):
    return json.dumps({
        "status": "functionsLoaded",
        "functions": data
    })


def is_serializable(obj):
    try:
        json.dumps(obj)
        return True
    except:
        return False


def pipelineResult(data):
    response = {}
    
    #here is da problem
    for key, value in data.items():
        response[key] = value if is_serializable(value) else "Python Object"

    return json.dumps({
        "status": "pipelineDone",
        "data": response
    })


def setSocket(s):
    global metaCommsSocket
    metaCommsSocket = s