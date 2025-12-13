from __future__ import annotations

"""
Common backtest types for CryptoBot Pro.

These dataclasses are internal to the backtest engine but are simple enough
to be converted to dicts for JSON responses.
"""

from dataclasses import dataclass


@dataclass
class Candle:
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float | None = None


@dataclass
class Trade:
    id: int
    symbol: str
    direction: str  # "long" (short можно добавить позже)
    entry_time: int
    exit_time: int
    entry_price: float
    exit_price: float
    size: float
    risk_R: float
    result_R: float
    pnl: float
    max_favorable_excursion: float
    max_adverse_excursion: float
    stop: float
    target: float


@dataclass
class BacktestConfig:
    symbol: str
    interval: str
    risk_per_trade: float = 100.0
    rr_ratio: float = 4.0
    limit: int = 500
    max_bars_in_trade: int = 50
    direction: str = "long"
    strategy: str = "pattern3_extreme"


@dataclass
class BacktestSummary:
    total_trades: int
    wins: int
    losses: int
    winrate_pct: float
    gross_profit: float
    gross_loss: float
    net_profit: float
    profit_factor: float
    max_drawdown: float
    max_drawdown_pct: float
    average_R: float
    average_win_R: float
    average_loss_R: float
