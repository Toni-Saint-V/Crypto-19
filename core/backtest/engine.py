from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from .data import Candle


@dataclass
class Trade:
    entry_ts: int
    exit_ts: int
    entry_price: float
    exit_price: float
    qty: float
    entry_fee: float
    exit_fee: float
    pnl: float
    pnl_pct: float


def run_backtest(
    candles: List[Candle],
    signals: List[int],
    initial_balance: float,
    fee_rate: float,
    slippage: float,
) -> Dict[str, Any]:
    if not candles:
        raise RuntimeError("No candles")
    if len(signals) != len(candles):
        raise RuntimeError("signals length mismatch candles length")

    cash = float(initial_balance)
    position_qty = 0.0
    entry_price = 0.0
    entry_ts = 0
    entry_fee = 0.0

    equity_curve: List[Tuple[int, float]] = []
    trades: List[Trade] = []

    fr = float(fee_rate)
    sl = float(slippage)

    def fee(amount: float) -> float:
        return abs(float(amount)) * fr

    def _buy(price_close: float, ts_i: int) -> None:
        nonlocal cash, position_qty, entry_price, entry_ts, entry_fee
        if position_qty != 0.0:
            return
        buy_price = float(price_close) * (1.0 + sl)
        if buy_price <= 0.0:
            return

        # fee-aware sizing with float-safe adjustment
        denom = buy_price * (1.0 + fr)
        qty = (cash / denom) if denom > 0.0 else 0.0
        if qty <= 0.0:
            return

        cost = qty * buy_price
        f = fee(cost)
        total = cost + f

        if total > cash and total > 0.0:
            # scale down slightly to avoid epsilon overshoot
            scale = (cash / total) * (1.0 - 1e-9)
            qty *= scale
            cost = qty * buy_price
            f = fee(cost)
            total = cost + f

        if qty > 0.0 and total <= (cash + 1e-6):
            cash -= total
            position_qty = qty
            entry_price = buy_price
            entry_ts = int(ts_i)
            entry_fee = f

    def _sell(price_close: float, ts_i: int) -> None:
        nonlocal cash, position_qty, entry_price, entry_ts, entry_fee
        if position_qty <= 0.0:
            return
        sell_price = float(price_close) * (1.0 - sl)
        proceeds = position_qty * sell_price
        f = fee(proceeds)
        cash += (proceeds - f)

        pnl = (sell_price - entry_price) * position_qty - (entry_fee + f)
        pnl_pct = (sell_price / entry_price - 1.0) if entry_price > 0.0 else 0.0

        trades.append(
            Trade(
                entry_ts=int(entry_ts),
                exit_ts=int(ts_i),
                entry_price=float(entry_price),
                exit_price=float(sell_price),
                qty=float(position_qty),
                entry_fee=float(entry_fee),
                exit_fee=float(f),
                pnl=float(pnl),
                pnl_pct=float(pnl_pct),
            )
        )

        position_qty = 0.0
        entry_price = 0.0
        entry_ts = 0
        entry_fee = 0.0

    for i, c in enumerate(candles):
        price = float(c.close)
        sig = int(signals[i])

        if sig > 0:
            _buy(price, int(c.ts))
        elif sig < 0:
            _sell(price, int(c.ts))

        equity_curve.append((int(c.ts), float(cash + position_qty * price)))

    # forced close at end if still holding
    if position_qty > 0.0:
        last = candles[-1]
        _sell(float(last.close), int(last.ts))
        equity_curve[-1] = (int(last.ts), float(cash))

    metrics = compute_metrics(equity_curve, trades, float(initial_balance))
    return {
        "equity_curve": [{"ts": ts, "equity": eq} for ts, eq in equity_curve],
        "trades": [t.__dict__ for t in trades],
        "metrics": metrics,
    }


def compute_metrics(
    equity_curve: List[Tuple[int, float]],
    trades: List[Trade],
    initial_balance: float,
) -> Dict[str, Any]:
    eq = [v for _, v in equity_curve]
    if not eq:
        return {
            "initial_balance": float(initial_balance),
            "final_balance": float(initial_balance),
            "total_return": 0.0,
            "max_drawdown": 0.0,
            "trades": 0,
            "win_rate": 0.0,
        }

    total_return = (eq[-1] / float(initial_balance) - 1.0) if initial_balance > 0 else 0.0

    peak = eq[0]
    max_dd = 0.0
    for v in eq:
        if v > peak:
            peak = v
        dd = (v / peak - 1.0) if peak > 0 else 0.0
        if dd < max_dd:
            max_dd = dd

    wins = sum(1 for t in trades if t.pnl > 0)
    win_rate = (wins / len(trades)) if trades else 0.0

    return {
        "initial_balance": float(initial_balance),
        "final_balance": float(eq[-1]),
        "total_return": float(total_return),
        "max_drawdown": float(max_dd),
        "trades": int(len(trades)),
        "win_rate": float(win_rate),
    }


class BacktestEngine:
    def __init__(self, risk_limits=None, **kwargs) -> None:
        self.risk_limits = risk_limits
        self.kwargs = dict(kwargs)

    def run(
        self,
        candles=None,
        signals=None,
        symbol: Optional[str] = None,
        timeframe: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        strategy: str = "buy_and_hold",
        params: Optional[Dict[str, Any]] = None,
        initial_balance: float = 1000.0,
        fee_rate: float = 0.0,
        slippage: float = 0.0,
        **kwargs,
    ) -> Dict[str, Any]:
        if candles is None or signals is None:
            if not symbol or not timeframe:
                raise TypeError("BacktestEngine.run requires either (candles, signals) or (symbol, timeframe)")
            from core.backtest.data import load_candles
            from core.backtest.strategies import get_strategy

            p = params or {}
            candles = load_candles(
                symbol=str(symbol),
                timeframe=str(timeframe),
                start=start,
                end=end,
                limit=int(p.get("limit", 5000)),
            )
            strat = get_strategy(strategy)
            signals = strat(candles, p)

        out = run_backtest(
            candles=candles,
            signals=signals,
            initial_balance=float(initial_balance),
            fee_rate=float(fee_rate),
            slippage=float(slippage),
        )
        out["meta"] = {"symbol": symbol, "timeframe": timeframe, "strategy": strategy, "params": params or {}}
        return out
