"""
Exchange Provider Factory
Creates appropriate exchange provider based on configuration
"""

from typing import Optional
from core.exchange.exchange_provider import ExchangeType
from core.exchange.bybit_provider import BybitExchangeProvider
from core.exchange.binance_provider import BinanceExchangeProvider


def create_exchange_provider(
    exchange_type: str,
    testnet: bool = True
) -> Optional[BybitExchangeProvider | BinanceExchangeProvider]:
    """
    Factory function to create exchange provider
    
    Args:
        exchange_type: Exchange type ("bybit", "binance")
        testnet: Use testnet (default: True)
        
    Returns:
        ExchangeProvider instance or None
    """
    exchange_type = exchange_type.lower()
    
    if exchange_type == "bybit" or exchange_type == ExchangeType.BYBIT.value:
        return BybitExchangeProvider(testnet=testnet)
    elif exchange_type == "binance" or exchange_type == ExchangeType.BINANCE.value:
        return BinanceExchangeProvider(testnet=testnet)
    else:
        return None

