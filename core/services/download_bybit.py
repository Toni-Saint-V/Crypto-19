# ===== MOCK BYBIT DOWNLOADER =====
# Эта заглушка нужна, чтобы проект работал без реального API

def download_klines(symbol="BTCUSDT", interval="1m", limit=500):
    # возвращаем тестовые свечи
    candles = []
    price = 50000
    for i in range(limit):
        candles.append({
            "time": 1730000000 + i * 60,
            "open": price,
            "high": price + 50,
            "low": price - 50,
            "close": price + 10
        })
        price += 10
    return candles
