#!/bin/python3
import gc
import json
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
import websockets
import sys
from threading import Condition, Event, Thread
from process import process
from output import printOK, printImport

DEBUG = False
_executor = ThreadPoolExecutor(10)

async def in_thread(func, params):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, func, params)


async def serve(websocket, path):
    printOK("starting connection {}".format(websocket)) 

    while True:
        data = await websocket.recv()
        data = json.loads(data)
        printImport(data)
        
        response = await asyncio.gather(
            in_thread(process, data)
        )

        printOK("response {}".format(response))
        response = json.dumps(response[0])
        
        await websocket.send(response)


if __name__ == "__main__":
    if not DEBUG:
        HOST = 'localhost'
        PORT_RECIEVE = 9003
        start_server = websockets.serve(serve, HOST, PORT_RECIEVE)
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()
    else:
        process(
            {
                'command': 'run',
                'graph': '[{"title":"one","id":"Node0","pos":{"x":593,"y":85},"inParameters":[],"outParameters":[{"param":"value","type":"number","inout":1,"node":"Node0","connections":[{"out":{"node":"Node0","connector":"value"},"in":{"node":"Node1","connector":"a"}},{"out":{"node":"Node0","connector":"value"},"in":{"node":"Node1","connector":"b"}}]}]},{"title":"add","id":"Node1","pos":{"x":543,"y":234},"inParameters":[{"param":"a","type":"number","inout":0,"node":"Node1","connections":[{"out":{"node":"Node0","connector":"value"},"in":{"node":"Node1","connector":"a"}}]},{"param":"b","type":"number","inout":0,"node":"Node1","connections":[{"out":{"node":"Node0","connector":"value"},"in":{"node":"Node1","connector":"b"}}]}],"outParameters":[{"param":"output","type":"number","inout":1,"node":"Node1","connections":[{"out":{"node":"Node1","connector":"output"},"in":{"node":"Node3","connector":"b"}},{"out":{"node":"Node1","connector":"output"},"in":{"node":"Node4","connector":"power"}}]}]},{"title":"one","id":"Node2","pos":{"x":409,"y":241},"inParameters":[],"outParameters":[{"param":"value","type":"number","inout":1,"node":"Node2","connections":[{"out":{"node":"Node2","connector":"value"},"in":{"node":"Node3","connector":"a"}}]}]},{"title":"add","id":"Node3","pos":{"x":461,"y":345},"inParameters":[{"param":"a","type":"number","inout":0,"node":"Node3","connections":[{"out":{"node":"Node2","connector":"value"},"in":{"node":"Node3","connector":"a"}}]},{"param":"b","type":"number","inout":0,"node":"Node3","connections":[{"out":{"node":"Node1","connector":"output"},"in":{"node":"Node3","connector":"b"}}]}],"outParameters":[{"param":"output","type":"number","inout":1,"node":"Node3","connections":[{"out":{"node":"Node3","connector":"output"},"in":{"node":"Node4","connector":"value"}}]}]},{"title":"pow","id":"Node4","pos":{"x":492,"y":467},"inParameters":[{"param":"value","type":"number","inout":0,"node":"Node4","connections":[{"out":{"node":"Node3","connector":"output"},"in":{"node":"Node4","connector":"value"}}]},{"param":"power","type":"number","inout":0,"node":"Node4","connections":[{"out":{"node":"Node1","connector":"output"},"in":{"node":"Node4","connector":"power"}}]}],"outParameters":[{"param":"value","type":"number","inout":1,"node":"Node4","connections":[]}]}]'
            }
        )

#if __name__ == "__main__":
#    process({'test': 'test'})