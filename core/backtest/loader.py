from core.services.download_bybit import download_klines

def load_dataset(symbol="BTCUSDT", interval="1m", limit=500):
    """
    Простая заглушка загрузки данных — отдаём тестовые свечи.
    """
    return download_klines(symbol=symbol, interval=interval, limit=limit)
