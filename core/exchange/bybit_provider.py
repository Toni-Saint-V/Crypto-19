"""
Bybit Exchange Provider
Implementation of ExchangeProvider for Bybit exchange
"""

import os
import asyncio
import requests
from typing import List, Dict, Any, Optional
from core.exchange.exchange_provider import ExchangeProvider

# Bybit Testnet URL
BYBIT_BASE_URL = os.getenv("BYBIT_TESTNET_URL", "https://api-testnet.bybit.com")

# Interval mapping
BYBIT_INTERVAL_MAP = {
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


class BybitExchangeProvider(ExchangeProvider):
    """Bybit exchange provider implementation"""
    
    def __init__(self, testnet: bool = True):
        """
        Initialize Bybit provider
        
        Args:
            testnet: Use testnet (default: True)
        """
        self.testnet = testnet
        self.base_url = BYBIT_BASE_URL if testnet else "https://api.bybit.com"
    
    def _map_interval(self, interval: str) -> str:
        """Map interval string to Bybit format"""
        if interval in BYBIT_INTERVAL_MAP:
            return BYBIT_INTERVAL_MAP[interval]
        
        # Check if it's numeric (minutes)
        try:
            minutes = int(interval)
            if 1 <= minutes <= 2000:
                return str(minutes)
        except ValueError:
            pass
        
        return "1"  # Default
    
    async def fetch_klines(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """Fetch klines from Bybit"""
        url = f"{self.base_url}/v5/market/kline"
        params = {
            "symbol": symbol,
            "interval": self._map_interval(timeframe),
            "limit": limit
        }
        
        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.get(url, params=params, timeout=10)
            )
            data = response.json()
            
            if "result" not in data or "list" not in data["result"]:
                return []
            
            items = data["result"]["list"]
            # Bybit returns newest first, reverse for chronological order
            items = list(reversed(items))
            
            candles = []
            for item in items:
                candles.append(self.normalize_candle({
                    "time": int(item["start"]),
                    "open": float(item["open"]),
                    "high": float(item["high"]),
                    "low": float(item["low"]),
                    "close": float(item["close"]),
                    "volume": float(item.get("volume", 0))
                }))
            
            return candles
            
        except Exception as e:
            print(f"Error fetching Bybit klines: {e}")
            return []
    
    async def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Place order on Bybit (placeholder - requires API keys)"""
        # This would require authentication and proper API implementation
        return {
            "error": "Order placement not implemented. Requires API keys and authentication."
        }
    
    async def get_balance(self, asset: str = "USDT") -> float:
        """Get balance from Bybit (placeholder - requires API keys)"""
        # This would require authentication
        return 0.0
    
    def get_exchange_name(self) -> str:
        return "Bybit" + (" Testnet" if self.testnet else "")

