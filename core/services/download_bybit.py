from web.bybit_client import get_klines
import time

def download_klines(symbol="BTCUSDT", interval="1m", limit=500):
    """
    Download klines from Bybit Testnet.
    Falls back to mock data if API fails.
    """
    try:
        candles = get_klines(symbol=symbol, interval=interval, limit=limit)
        
        # Check if we got an error response
        if isinstance(candles, dict) and 'error' in candles:
            raise Exception(candles.get('error', 'Unknown error'))
        
        if not candles or len(candles) == 0:
            raise Exception("No data returned")
        
        return candles
    except Exception as e:
        # Fallback to mock data
        print(f"Warning: Bybit API failed ({e}), using mock data")
        candles = []
        price = 50000
        base_time = int(time.time()) - (limit * 60)
        for i in range(limit):
            candles.append({
                "time": base_time + (i * 60),
                "open": price,
                "high": price + 50,
                "low": price - 50,
                "close": price + 10,
                "volume": 100.0
            })
            price += 10
        return candles
