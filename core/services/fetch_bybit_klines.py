from core.services.download_bybit import download_klines

def fetch_klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 500):
    try:
        return download_klines(symbol=symbol, interval=interval, limit=limit)
    except Exception as e:
        return []
