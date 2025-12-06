import os
from typing import List, Dict
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
    "4h": "240",
    "1d": "D",
}

def _map_interval(interval: str) -> str:
    return INTERVAL_MAP.get(interval, "1")


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
        })

    return candles


def fetch_ohlcv(*args, **kwargs):
    return []


def fetch_ohlcv(*args, **kwargs):
    return []
