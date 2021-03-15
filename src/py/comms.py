import asyncio
import json
import sys


class bcolors:
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m' 
    BOLD = '\033[1m'


def printImport(text):
    sys.stdout.write(bcolors.OKBLUE +  bcolors.BOLD + str(text) + bcolors.ENDC + "\n")

def printOK(text):
    sys.stdout.write(bcolors.OKGREEN +  bcolors.BOLD + str(text) + bcolors.ENDC + "\n")
    sys.stdout.flush()

def printWarning(text):
    sys.stdout.write(bcolors.WARNING + bcolors.BOLD + str(text) + bcolors.ENDC + "\n")

def printFail(text):
    sys.stdout.write(bcolors.FAIL + bcolors.BOLD + str(text) + bcolors.ENDC + "\n")


##############################################


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

