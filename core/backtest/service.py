from __future__ import annotations

from typing import Any, Dict, Optional

from .data import load_candles
from .engine import run_backtest
from .strategies import get_strategy


class BacktestService:
    def run(
        self,
        symbol: str,
        timeframe: str,
        start: Optional[str],
        end: Optional[str],
        strategy: str,
        initial_balance: float,
        fee_rate: float,
        slippage: float,
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        candles = load_candles(symbol=symbol, timeframe=timeframe, start=start, end=end, limit=int((params or {}).get("limit", 5000)))
        strat = get_strategy(strategy)
        signals = strat(candles, params or {})
        result = run_backtest(candles, signals, float(initial_balance), float(fee_rate), float(slippage))
        result["meta"] = {"symbol": symbol, "timeframe": timeframe, "strategy": strategy, "params": params or {}}
        return result
