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
        HOST = 'localhost'
        PORT_RECIEVE = 9003
        start_server = websockets.serve(serve, HOST, PORT_RECIEVE)
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

#graph = '[{"title":"one","id":"Node0","pos":{"x":-26.70749108204558,"y":-11.493460166468374},"value":[{"param":"name","type":"string","value":"Hello World"},{"param":"checkmark","type":"bool","value":false}],"in":[],"out":[{"param":"s","type":"string","inout":1,"node":"Node0","connections":[]},{"param":"n","type":"number","inout":1,"node":"Node0","connections":[{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node1","connector":"value"}},{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node1","connector":"power"}},{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node2","connector":"a"}},{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node3","connector":"a"}}]},{"param":"f","type":"file","inout":1,"node":"Node0","connections":[]},{"param":"c","type":"color","inout":1,"node":"Node0","connections":[]},{"param":"b","type":"bool","inout":1,"node":"Node0","connections":[]},{"param":"v","type":"vec3","inout":1,"node":"Node0","connections":[]}]},{"title":"pow","id":"Node1","pos":{"x":240.35000444886694,"y":224.83633834033114},"value":[],"in":[{"param":"value","type":"number","inout":0,"node":"Node1","connections":[{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node1","connector":"value"}}]},{"param":"power","type":"number","inout":0,"node":"Node1","connections":[{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node1","connector":"power"}}]}],"out":[{"param":"value","type":"number","inout":1,"node":"Node1","connections":[{"out":{"node":"Node1","connector":"value"},"in":{"node":"Node3","connector":"b"}}]}]},{"title":"add","id":"Node2","pos":{"x":-40.37139945157646,"y":597.9648863112419},"value":[],"in":[{"param":"a","type":"number","inout":0,"node":"Node2","connections":[{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node2","connector":"a"}}]},{"param":"b","type":"number","inout":0,"node":"Node2","connections":[{"out":{"node":"Node7","connector":"n"},"in":{"node":"Node2","connector":"b"}}]}],"out":[{"param":"output","type":"number","inout":1,"node":"Node2","connections":[{"out":{"node":"Node2","connector":"output"},"in":{"node":"Node4","connector":"value"}}]}]},{"title":"add","id":"Node3","pos":{"x":232.5875820006973,"y":608.6174702937069},"value":[],"in":[{"param":"a","type":"number","inout":0,"node":"Node3","connections":[{"out":{"node":"Node0","connector":"n"},"in":{"node":"Node3","connector":"a"}}]},{"param":"b","type":"number","inout":0,"node":"Node3","connections":[{"out":{"node":"Node1","connector":"value"},"in":{"node":"Node3","connector":"b"}}]}],"out":[{"param":"output","type":"number","inout":1,"node":"Node3","connections":[{"out":{"node":"Node3","connector":"output"},"in":{"node":"Node4","connector":"power"}}]}]},{"title":"pow","id":"Node4","pos":{"x":45.77133635856427,"y":893.1645999660257},"value":[],"in":[{"param":"value","type":"number","inout":0,"node":"Node4","connections":[{"out":{"node":"Node2","connector":"output"},"in":{"node":"Node4","connector":"value"}}]},{"param":"power","type":"number","inout":0,"node":"Node4","connections":[{"out":{"node":"Node3","connector":"output"},"in":{"node":"Node4","connector":"power"}}]}],"out":[{"param":"value","type":"number","inout":1,"node":"Node4","connections":[]}]},{"title":"one","id":"Node7","pos":{"x":-199.5956722963932,"y":223.4156068289999},"value":[{"param":"name","type":"string","value":"Hello World"},{"param":"checkmark","type":"bool","value":true}],"in":[],"out":[{"param":"s","type":"string","inout":1,"node":"Node7","connections":[]},{"param":"n","type":"number","inout":1,"node":"Node7","connections":[{"out":{"node":"Node7","connector":"n"},"in":{"node":"Node2","connector":"b"}}]},{"param":"f","type":"file","inout":1,"node":"Node7","connections":[]},{"param":"c","type":"color","inout":1,"node":"Node7","connections":[]},{"param":"b","type":"bool","inout":1,"node":"Node7","connections":[]},{"param":"v","type":"vec3","inout":1,"node":"Node7","connections":[]}]}]'
#process({'command': 'run', 'graph': graph})
