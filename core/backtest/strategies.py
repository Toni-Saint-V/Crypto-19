from __future__ import annotations

from typing import Any, Dict, List
from .data import Candle


def buy_and_hold(candles: List[Candle], params: Dict[str, Any]) -> List[int]:
    if not candles:
        return []
    sig = [0] * len(candles)
    sig[0] = 1
    sig[-1] = -1
    return sig


def sma_cross(candles: List[Candle], params: Dict[str, Any]) -> List[int]:
    fast = int(params.get("fast", 10))
    slow = int(params.get("slow", 30))
    if slow <= fast:
        slow = fast + 5

    closes = [c.close for c in candles]
    sig = [0] * len(closes)

    def sma(i: int, n: int) -> float:
        if i + 1 < n:
            return sum(closes[: i + 1]) / float(i + 1)
        w = closes[i - n + 1 : i + 1]
        return sum(w) / float(n)

    prev = 0
    for i in range(len(closes)):
        f = sma(i, fast)
        s = sma(i, slow)
        cur = 1 if f > s else -1 if f < s else 0
        if i == 0:
            prev = cur
            continue
        if prev <= 0 and cur > 0:
            sig[i] = 1
        elif prev >= 0 and cur < 0:
            sig[i] = -1
        prev = cur

    return sig


def get_strategy(name: str):
    n = (name or "").strip()
    if n == "sma_cross":
        return sma_cross
    return buy_and_hold
