import random, asyncio

async def get_confidence():
    await asyncio.sleep(0.3)
    return round(random.uniform(50, 99), 1)
