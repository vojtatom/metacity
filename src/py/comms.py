import asyncio
import json
from output import printOK

metaCommsSocket = None

def setSocket(s):
    global metaCommsSocket
    metaCommsSocket = s


def is_serializable(obj):
    try:
        json.dumps(obj)
        return True
    except:
        return False


def setLoop(loop):
    asyncio.set_event_loop(loop)


def closeLoop():
    loop = asyncio.get_event_loop()
    loop.close()


##############################################


async def asyncSend(message):
    global metaCommsSocket
    if metaCommsSocket:
        message = json.dumps(message)
        await metaCommsSocket.send(message)


def send(message):
    printOK(message)
    loop = asyncio.get_event_loop()
    asyncio.run_coroutine_threadsafe((asyncSend(message)), loop)


def sendProgress(percentage, message, progressID):
    send({
        "recipient": "editor",
        "status": "progress",
        "progress": percentage,
        "message": message,
        "progressID": progressID
    })


def sendProgressPerc(percentage, progressID):
    sendProgress(percentage, f"{percentage}%", progressID)


def sendNodeFinished(title):
    send({
        "recipient": "editor",
        "status": "nodeDone",
        "title": title
    })


def sendNodeStarted(title):
    send({
        "recipient": "editor",
        "status": "nodeStarted",
        "title": title
    })

def sendClearViewer():
    send({
        "recipient": "viewer",
        "status": "clearViewer"
    })


def sendAddLayer(data):
    send({
        "recipient": "viewer",
        "status": "addLayer",
        "layer": data
    })


##############################################


def error(error):
    return json.dumps({
        "recipient": "editor",
        "status": "error",
        "error": "Pipeline processing failed: {}".format(error)
        })


def functionList(data):
    return json.dumps({
        "recipient": "editor",
        "status": "functionsLoaded",
        "functions": data
    })


def pipelineResult(data):
    response = {}
    
    #here is da problem
    for key, value in data.items():
        response[key] = value if is_serializable(value) else "Python Object"

    return json.dumps({
        "recipient": "editor",
        "status": "pipelineDone",
        "data": response
    })


