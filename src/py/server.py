#!/bin/python3
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
import websockets
from process import process
from pipeline.graph import MetaPipeline
import comms

_executor = ThreadPoolExecutor(10)

async def in_thread(func, data, pipeline):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, func, data, loop, pipeline)


async def serve(websocket, path):
    while True:
        data = await websocket.recv()
        data = json.loads(data)

        comms.printOK(pipeline)
        comms.setSocket(websocket)         
        response = await asyncio.gather(
            in_thread(process, data, pipeline)
        )

        await websocket.send(response[0])


if __name__ == "__main__":
    pipeline = MetaPipeline()
    HOST = 'localhost'
    PORT_RECIEVE = 9003
    start_server = websockets.serve(serve, HOST, PORT_RECIEVE)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()


