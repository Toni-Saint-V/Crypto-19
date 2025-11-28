from typing import List, Dict, Union

from web.bybit_client import get_klines as _get_klines


def fetch_klines(
    symbol: str = "BTCUSDT",
    interval: str = "1m",
    limit: int = 200
) -> List[Dict[str, float]]:
    """
    Обёртка над web.bybit_client.get_klines для /api/candles.
    Если Bybit вернул ошибку — отдаём пустой список, чтобы фронт не падал.
    """
    data: Union[List[Dict], Dict] = _get_klines(
        symbol=symbol,
        interval=interval,
        limit=limit,
    )

    # В bybit_client при ошибке возвращаем dict с ключом "error"
    if isinstance(data, dict) and data.get("error"):
        # TODO: можно залогировать текст ошибки
        return []

    # Нормальный кейс — список свечей
    return data
