import os
import requests

# Testnet URLs
BASE_URL = os.getenv("BYBIT_TESTNET_URL", "https://api-testnet.bybit.com")

# ---------- interval map ----------
INTERVAL_MAP = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "12h": "720",
    "1d": "D",
    "3d": "3D",
    "1w": "W",
}

def _map_interval(interval: str) -> str:
    """
    Map interval string to Bybit format.
    Supports standard intervals and custom minutes (1-2000).
    """
    # Check if it's a standard interval
    if interval in INTERVAL_MAP:
        return INTERVAL_MAP[interval]
    
    # Check if it's a numeric string (minutes)
    try:
        minutes = int(interval)
        if 1 <= minutes <= 2000:
            return str(minutes)
    except ValueError:
        pass
    
    # Default to 1 minute
    return "1"


# ---------- get klines ----------
def get_klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 200):
    url = f"{BASE_URL}/v5/market/kline"

    params = {
        "symbol": symbol,
        "interval": _map_interval(interval),
        "limit": limit
    }

    try:
        r = requests.get(url, params=params, timeout=10)
        data = r.json()
    except Exception as e:
        return {"error": str(e)}

    if "result" not in data or "list" not in data["result"]:
        return {"error": "bad response", "raw": data}

    items = data["result"]["list"]
    # Bybit returns newest first, reverse:
    items = list(reversed(items))

    candles = []
    for it in items:
        candles.append({
            "time": int(it["start"]),
            "open": float(it["open"]),
            "high": float(it["high"]),
            "low": float(it["low"]),
            "close": float(it["close"]),
            "volume": float(it.get("volume", 0))
        })

    return candles


async def fetch_ohlcv(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 200):
    """
    Async wrapper for get_klines to fetch OHLCV data from Bybit Testnet.
    
    Args:
        symbol: Trading pair symbol
        interval: Timeframe interval (supports 1m-1500m and standard intervals)
        limit: Number of candles to fetch
    
    Returns:
        List of candle dictionaries with time, open, high, low, close, volume
    """
    import asyncio
    try:
        # Run synchronous get_klines in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        candles = await loop.run_in_executor(None, get_klines, symbol, interval, limit)
        
        if isinstance(candles, dict) and 'error' in candles:
            return []
        
        return candles
    except Exception as e:
        print(f"Error fetching OHLCV: {e}")
        return []
