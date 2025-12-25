"""
Binance Exchange Provider
Implementation of ExchangeProvider for Binance exchange
"""

import asyncio
import requests
from typing import List, Dict, Any, Optional
from core.exchange.exchange_provider import ExchangeProvider

# Binance URLs
BINANCE_BASE_URL = "https://api.binance.com"
BINANCE_TESTNET_URL = "https://testnet.binance.vision"

# Interval mapping for Binance
BINANCE_INTERVAL_MAP = {
    "1m": "1m",
    "3m": "3m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "2h": "2h",
    "4h": "4h",
    "6h": "6h",
    "8h": "8h",
    "12h": "12h",
    "1d": "1d",
    "3d": "3d",
    "1w": "1w",
    "1M": "1M",
}


class BinanceExchangeProvider(ExchangeProvider):
    """Binance exchange provider implementation"""
    
    def __init__(self, testnet: bool = True):
        """
        Initialize Binance provider
        
        Args:
            testnet: Use testnet (default: True)
        """
        self.testnet = testnet
        self.base_url = BINANCE_TESTNET_URL if testnet else BINANCE_BASE_URL
    
    def _map_interval(self, interval: str) -> str:
        """Map interval string to Binance format"""
        if interval in BINANCE_INTERVAL_MAP:
            return BINANCE_INTERVAL_MAP[interval]
        
        # Check if it's numeric (minutes) - convert to Binance format
        try:
            minutes = int(interval)
            if minutes < 60:
                return f"{minutes}m"
            elif minutes < 1440:
                hours = minutes // 60
                return f"{hours}h"
            else:
                days = minutes // 1440
                return f"{days}d"
        except ValueError:
            pass
        
        return "1m"  # Default
    
    async def fetch_klines(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """Fetch klines from Binance"""
        url = f"{self.base_url}/api/v3/klines"
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
            
            if isinstance(data, dict) and "code" in data:
                # Error response
                return []
            
            candles = []
            for item in data:
                candles.append(self.normalize_candle({
                    "time": int(item[0]),  # Open time
                    "open": float(item[1]),
                    "high": float(item[2]),
                    "low": float(item[3]),
                    "close": float(item[4]),
                    "volume": float(item[5])
                }))
            
            return candles
            
        except Exception as e:
            print(f"Error fetching Binance klines: {e}")
            return []
    
    async def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Place order on Binance (placeholder - requires API keys)"""
        return {
            "error": "Order placement not implemented. Requires API keys and authentication."
        }
    
    async def get_balance(self, asset: str = "USDT") -> float:
        """Get balance from Binance (placeholder - requires API keys)"""
        return 0.0
    
    def get_exchange_name(self) -> str:
        return "Binance" + (" Testnet" if self.testnet else "")

