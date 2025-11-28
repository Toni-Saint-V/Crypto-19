from typing import List, Dict
from core.services.fetch_bybit_klines import fetch_klines

def load_dataset(
    symbol: str = "BTCUSDT",
    interval: str = "1m",
    limit: int = 300,
) -> List[Dict]:
    """
    Пока просто враппер вокруг fetch_klines.
    При необходимости сюда можно подложить файл/БД.
    """
    return fetch_klines(symbol=symbol, interval=interval, limit=limit)
