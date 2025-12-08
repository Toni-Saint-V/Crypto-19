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
    Return the current dashboard snapshot.

    NOTE: This implementation uses temporary placeholder values. Replace with
    real integrations to the trading core modules (portfolio, risk, AI, etc.).
    """

    # TODO: Replace placeholders with calls to real services
    placeholder_candles: List[Candle] = []
    placeholder_ai_signals: List[AISignal] = []

    return DashboardSnapshot(
        balance=10000.0,
        daily_pnl_pct=1.23,
        total_profit=2500.0,
        winrate_pct=62.5,
        active_positions=2,
        risk_level_pct=35.0,
        symbol=symbol,
        timeframe=timeframe,
        candles=placeholder_candles,
        ai_signals=placeholder_ai_signals,
    )
