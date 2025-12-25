import asyncio
import time
import random

async def ws_live_loop(ws):
    price = 50000
    while True:
        ts = int(time.time())
        candle = {
            "time": ts,
            "open": price,
            "high": price + 50,
            "low": price - 50,
            "close": price + 10
        }
        await ws.send_json({"type": "candle", "data": candle})
        price += random.randint(-30, 30)
        await asyncio.sleep(1)
