from core.services.download_bybit import download_klines

def load_dataset(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 500):
    """
    Простая реализация — загружаем свечи через mock downloader.
    Этого достаточно для запуска бэктеста и UI.
    """
    return download_klines(symbol=symbol, interval=interval, limit=limit)
