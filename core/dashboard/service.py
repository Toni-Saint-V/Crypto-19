from __future__ import annotations

import asyncio
from typing import List

from pydantic import BaseModel, Field

from .logic import build_dashboard_state


class Candle(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class AISignal(BaseModel):
    symbol: str
    side: str
    confidence: float
    entry: float
    target: float
    stop_loss: float
    timeframe: str
    comment: str | None = None


class Trade(BaseModel):
    id: str
    symbol: str
    side: str
    price: float
    qty: float
    timestamp: int
    realized_pnl: float | None = None


class DashboardSnapshot(BaseModel):
    balance: float = Field(0.0)
    daily_pnl_pct: float = Field(0.0)
    total_profit: float = Field(0.0)
    winrate_pct: float = Field(0.0)
    active_positions: int = Field(0)
    risk_level_pct: float = Field(0.0)

    # legacy fields for old HTML dashboard
    total_pnl: float | None = None
    winrate: float | None = None
    risk_level: float | None = None

    symbol: str
    timeframe: str

    candles: List[Candle] = Field(default_factory=list)
    ai_signals: List[AISignal] = Field(default_factory=list)
    trades: List[Trade] = Field(default_factory=list)


async def get_dashboard_snapshot(
    symbol: str = "BTCUSDT",
    timeframe: str = "15m",
    mode: str | None = None,
) -> DashboardSnapshot:
    mode_value = mode or "live"
    state = build_dashboard_state(
        symbol=symbol,
        timeframe=timeframe,
        mode=mode_value,
        limit=200,
    )

    # map new metric names to legacy ones used by old HTML UI
    state["total_pnl"] = state.get("total_profit", 0.0)
    state["winrate"] = state.get("winrate_pct", 0.0)
    state["risk_level"] = state.get("risk_level_pct", 0.0)

    return DashboardSnapshot(**state)


def get_dashboard_snapshot_sync(
    symbol: str = "BTCUSDT",
    timeframe: str = "15m",
    mode: str | None = None,
) -> DashboardSnapshot:
    return asyncio.run(
        get_dashboard_snapshot(symbol=symbol, timeframe=timeframe, mode=mode)
    )
