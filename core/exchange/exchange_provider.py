"""
Exchange Provider Abstraction
Unified interface for multiple cryptocurrency exchanges
"""

import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from enum import Enum

log = logging.getLogger(__name__)


class ExchangeType(Enum):
    """Supported exchange types"""
    BYBIT = "bybit"
    BINANCE = "binance"
    LOCAL_CSV = "local_csv"


class ExchangeProvider(ABC):
    """
    Abstract base class for exchange providers
    All exchange implementations must inherit from this
    """
    
    @abstractmethod
    async def fetch_klines(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """
        Fetch OHLCV klines/candles from exchange
        
        Args:
            symbol: Trading pair symbol (e.g., "BTCUSDT")
            timeframe: Timeframe interval (e.g., "1m", "15m", "1h")
            limit: Number of candles to fetch
            
        Returns:
            List of candle dictionaries with keys: time, open, high, low, close, volume
        """
        pass
    
    @abstractmethod
    async def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Place an order on the exchange
        
        Args:
            symbol: Trading pair symbol
            side: "buy" or "sell"
            order_type: "market" or "limit"
            quantity: Order quantity
            price: Limit price (required for limit orders)
            
        Returns:
            Order response dictionary
        """
        pass
    
    @abstractmethod
    async def get_balance(self, asset: str = "USDT") -> float:
        """
        Get account balance for an asset
        
        Args:
            asset: Asset symbol (e.g., "USDT", "BTC")
            
        Returns:
            Balance amount
        """
        pass
    
    @abstractmethod
    def get_exchange_name(self) -> str:
        """Get exchange name"""
        pass
    
    def normalize_candle(self, candle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize candle data to standard format
        
        Args:
            candle: Raw candle data from exchange
            
        Returns:
            Normalized candle with: time, open, high, low, close, volume
        """
        return {
            "time": candle.get("time", candle.get("timestamp", 0)),
            "open": float(candle.get("open", 0)),
            "high": float(candle.get("high", 0)),
            "low": float(candle.get("low", 0)),
            "close": float(candle.get("close", 0)),
            "volume": float(candle.get("volume", 0))
        }

