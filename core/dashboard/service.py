"""
Dashboard snapshot service for CryptoBot Pro.

At this stage the service returns static placeholder values to provide a stable
contract for the frontend. Future iterations should replace the placeholder
logic with real integrations to the trading core (portfolio, analytics,
AI models, etc.).
"""

from __future__ import annotations

from typing import List, Optional, Union

from pydantic import BaseModel


class AISignal(BaseModel):
    """Represents AI recommendation for trading."""

    symbol: str
    side: str  # "buy" / "sell"
    confidence: float  # 0–100 (%)
    entry: float
    target: float
    stop: Optional[float] = None


class Candle(BaseModel):
    """Normalized OHLCV candle."""

    time: Union[float, int, str]
    open: float
    high: float
    low: float
    close: float
    volume: float


class DashboardSnapshot(BaseModel):
    """Unified snapshot for the dashboard cards and chart."""

    balance: float
    daily_pnl_pct: float

    total_profit: float
    winrate_pct: float
    active_positions: int
    risk_level_pct: float

    symbol: str
    timeframe: str

    candles: List[Candle]
    ai_signals: List[AISignal]


async def get_dashboard_snapshot(
    symbol: str = "BTCUSDT",
    timeframe: str = "15m",
) -> DashboardSnapshot:
    """
    Return the current dashboard snapshot with real market data.
    """
    from core.market_data.service import MarketDataService
    
    # Get real market data
    market_service = MarketDataService()
    candles_data = []
    try:
        ohlcv_data = await market_service.get_candles(
            exchange="bybit",
            symbol=symbol,
            timeframe=timeframe,
            limit=500,
            mode="live"
        )
        candles_data = [
            Candle(
                time=c.time,
                open=float(c.open),
                high=float(c.high),
                low=float(c.low),
                close=float(c.close),
                volume=float(c.volume),
            )
            for c in ohlcv_data
        ]
    except Exception as e:
        # Fallback to empty candles on error
        import logging
        log = logging.getLogger(__name__)
        log.warning(f"Failed to load real candles: {e}")

    # Generate AI signals (placeholder for now)
    ai_signals: List[AISignal] = [
        AISignal(
            symbol=symbol,
            side="buy",
            confidence=75.0,
            entry=float(candles_data[-1].close) if candles_data else 64000.0,
            target=float(candles_data[-1].close) * 1.02 if candles_data else 65280.0,
            stop=float(candles_data[-1].close) * 0.98 if candles_data else 62720.0,
        )
    ] if candles_data else []

    return DashboardSnapshot(
        balance=10000.0,
        daily_pnl_pct=1.23,
        total_profit=2500.0,
        winrate_pct=62.5,
        active_positions=2,
        risk_level_pct=35.0,
        symbol=symbol,
        timeframe=timeframe,
        candles=candles_data,
        ai_signals=ai_signals,
    )
