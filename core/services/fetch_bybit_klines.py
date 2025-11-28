import random
import time
from typing import List, Dict

def _generate_mock_candles(
    symbol: str = "BTCUSDT",
    interval: str = "1m",
    limit: int = 300
) -> List[Dict]:
    """
    Генерируем псевдо-реальный рынок:
    - случайный дрейф цены
    - нормальные high/low вокруг open/close
    """
    now = int(time.time())
    candles: List[Dict] = []

    price = 50000.0
    step_sec = 60  # для 1m

    for i in range(limit):
        ts = now - (limit - i) * step_sec

        drift = random.uniform(-25, 25)
        open_price = price
        close_price = max(1000.0, price + drift)

        high = max(open_price, close_price) + random.uniform(0, 15)
        low = min(open_price, close_price) - random.uniform(0, 15)

        candles.append({
            "time": ts,
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close_price, 2),
        })

        price = close_price

    return candles

def fetch_klines(
    symbol: str = "BTCUSDT",
    interval: str = "1m",
    limit: int = 300
) -> List[Dict]:
    """
    Сейчас — чистый mock.
    Потом сюда можно воткнуть реальный Bybit API
    и оставить мок как fallback.
    """
    return _generate_mock_candles(symbol=symbol, interval=interval, limit=limit)
