import asyncio
import time
import random

async def ws_live_loop(ws):
    while True:
        ts = int(time.time())
        base = 50000 + random.randint(-100, 100)
        candle = {
            "time": ts,
            "open": base,
            "high": base + random.randint(5, 20),
            "low": base - random.randint(5, 20),
            "close": base + random.randint(-10, 10)
        }
        await ws.send_json({"type": "candle", "data": candle})
        await asyncio.sleep(1)
