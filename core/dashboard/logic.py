from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass
from typing import List, Sequence


@dataclass
class CandleData:
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class AISignalData:
    symbol: str
    side: str  # "buy" | "sell"
    confidence: float
    entry: float
    target: float
    stop_loss: float
    timeframe: str
    comment: str | None = None


@dataclass
class TradeData:
    id: str
    symbol: str
    side: str
    price: float
    qty: float
    timestamp: int
    realized_pnl: float | None = None


def _generate_base_price(symbol: str) -> float:
    symbol_upper = symbol.upper()
    if "BTC" in symbol_upper:
        return 65000.0
    if "ETH" in symbol_upper:
        return 2500.0
    if "SOL" in symbol_upper:
        return 100.0
    return 1000.0


def _timeframe_seconds(timeframe: str) -> int:
    tf = timeframe.lower().strip()
    if tf.endswith("m"):
        return int(tf[:-1]) * 60
    if tf.endswith("h"):
        return int(tf[:-1]) * 3600
    if tf.endswith("d"):
        return int(tf[:-1]) * 86400
    return 60


def generate_synthetic_candles(
    symbol: str,
    timeframe: str,
    mode: str = "live",
    limit: int = 200,
) -> List[CandleData]:
    base_price = _generate_base_price(symbol)
    now = int(time.time())
    step = _timeframe_seconds(timeframe)
    seed = hash((symbol, timeframe, mode)) & 0xFFFFFFFF
    random.seed(seed)

    candles: List[CandleData] = []
    for i in range(limit):
        t = now - (limit - 1 - i) * step
        phase = i / 10.0
        wave = math.sin(phase) * 0.015
        noise = (random.random() - 0.5) * 0.005
        price = base_price * (1.0 + wave + noise)

        body = price * 0.002
        high = price + abs(body) * (0.6 + random.random() * 0.4)
        low = price - abs(body) * (0.6 + random.random() * 0.4)
        open_price = price - body / 2.0
        close_price = price + body / 2.0
        volume = abs(base_price * 0.2 * (0.5 + random.random()))

        candles.append(
            CandleData(
                time=t,
                open=open_price,
                high=high,
                low=low,
                close=close_price,
                volume=volume,
            )
        )

    return candles


def compute_portfolio_metrics(candles: Sequence[CandleData]) -> dict:
    if not candles:
        return {
            "balance": 0.0,
            "daily_pnl_pct": 0.0,
            "total_profit": 0.0,
            "winrate_pct": 0.0,
            "active_positions": 0,
            "risk_level_pct": 0.0,
        }

    last_close = candles[-1].close
    first_close = candles[0].close
    change_pct = (last_close - first_close) / first_close * 100.0 if first_close else 0.0
    balance = 10000.0
    total_profit = balance * change_pct / 100.0

    risk_level = min(max(abs(change_pct) * 1.5, 5.0), 95.0)
    winrate = 62.0

    return {
        "balance": balance,
        "daily_pnl_pct": round(change_pct, 2),
        "total_profit": round(total_profit, 2),
        "winrate_pct": round(winrate, 1),
        "active_positions": 0,
        "risk_level_pct": round(risk_level, 1),
    }


def build_ai_signals(
    symbol: str,
    timeframe: str,
    candles: Sequence[CandleData],
    mode: str = "live",
) -> List[AISignalData]:
    if not candles:
        return []

    last = candles[-1]
    side = "buy" if last.close >= last.open else "sell"
    magnitude = abs(last.close - last.open) / last.open if last.open else 0.0
    confidence = max(min(magnitude * 8000.0, 100.0), 5.0)

    if side == "buy":
        entry = last.close * 0.999
        target = last.close * 1.01
        stop = last.close * 0.99
        comment = "Trend up, buy on dip"
    else:
        entry = last.close * 1.001
        target = last.close * 0.99
        stop = last.close * 1.01
        comment = "Trend down, sell the bounce"

    signal = AISignalData(
        symbol=symbol,
        side=side,
        confidence=round(confidence, 1),
        entry=round(entry, 2),
        target=round(target, 2),
        stop_loss=round(stop, 2),
        timeframe=timeframe,
        comment=comment,
    )
    return [signal]


def load_trades_history(
    symbol: str,
    timeframe: str,
    mode: str = "live",
) -> List[TradeData]:
    return []


def build_dashboard_state(
    symbol: str,
    timeframe: str,
    mode: str = "live",
    limit: int = 200,
) -> dict:
    candles = generate_synthetic_candles(
        symbol=symbol,
        timeframe=timeframe,
        mode=mode,
        limit=limit,
    )
    metrics = compute_portfolio_metrics(candles)
    ai_signals = build_ai_signals(symbol, timeframe, candles, mode=mode)
    trades = load_trades_history(symbol, timeframe, mode=mode)

    payload = dict(metrics)
    payload.update(
        {
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "candles": [
                {
                    "time": c.time,
                    "open": c.open,
                    "high": c.high,
                    "low": c.low,
                    "close": c.close,
                    "volume": c.volume,
                }
                for c in candles
            ],
            "ai_signals": [
                {
                    "symbol": s.symbol,
                    "side": s.side,
                    "confidence": s.confidence,
                    "entry": s.entry,
                    "target": s.target,
                    "stop_loss": s.stop_loss,
                    "timeframe": s.timeframe,
                    "comment": s.comment,
                }
                for s in ai_signals
            ],
            "trades": [
                {
                    "id": t.id,
                    "symbol": t.symbol,
                    "side": t.side,
                    "price": t.price,
                    "qty": t.qty,
                    "timestamp": t.timestamp,
                    "realized_pnl": t.realized_pnl,
                }
                for t in trades
            ],
        }
    )
    return payload
