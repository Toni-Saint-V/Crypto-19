"""
Strategy types and interfaces for CryptoBot Pro
Defines common types and contracts for trading strategies
"""

from typing import List, Dict, Any, Protocol, Optional
from dataclasses import dataclass
import pandas as pd


@dataclass
class StrategyConfig:
    """Configuration for a trading strategy"""
    risk_per_trade: float = 100.0
    rr_ratio: float = 4.0
    symbol: str = "BTCUSDT"
    timeframe: str = "15m"
    # Additional strategy-specific parameters
    params: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.params is None:
            self.params = {}


@dataclass
class Trade:
    """Represents a single trade signal"""
    entry_time: str  # ISO format timestamp
    entry_price: float
    stop: float  # Stop loss price
    tp: float  # Take profit price
    result_R: float  # Result in R units (positive for win, negative for loss)
    risk_usd: float  # Risk amount in USD
    rr_ratio: float  # Risk/Reward ratio
    direction: str = "long"  # "long" or "short"
    symbol: Optional[str] = None
    timeframe: Optional[str] = None


class BaseStrategy(Protocol):
    """
    Protocol (interface) for trading strategies.
    All strategies must implement this interface.
    """
    
    def generate_signals(
        self, 
        data: pd.DataFrame, 
        config: StrategyConfig
    ) -> List[Trade]:
        """
        Generate trading signals from market data.
        
        Args:
            data: DataFrame with OHLCV data (columns: time, open, high, low, close, volume)
            config: Strategy configuration
            
        Returns:
            List of Trade objects
        """
        ...

