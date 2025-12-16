from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


@dataclass
class Candle:
    ts: int
    open: float
    high: float
    low: float
    close: float
    volume: float


def _parse_dt(s: Optional[str]) -> Optional[int]:
    if not s:
        return None
    s2 = str(s).strip()
    try:
        if s2.isdigit():
            return int(s2)
        dt = datetime.fromisoformat(s2.replace("Z", "+00:00"))
        return int(dt.timestamp())
    except Exception:
        return None


def load_candles(symbol: str, timeframe: str, start: Optional[str], end: Optional[str], limit: int = 5000) -> List[Candle]:
    start_ts = _parse_dt(start)
    end_ts = _parse_dt(end)

    safe_symbol = symbol.replace("/", "")
    csv_paths = [
        os.path.join("data", f"{symbol}_{timeframe}.csv"),
        os.path.join("data", f"{safe_symbol}_{timeframe}.csv"),
    ]

    for path in csv_paths:
        if os.path.exists(path):
            return _load_csv(path, start_ts, end_ts, limit)

    raise RuntimeError(
        "No candles source found. Put CSV at data/{SYMBOL}_{TF}.csv with columns ts,open,high,low,close,volume"
    )


def _load_csv(path: str, start_ts: Optional[int], end_ts: Optional[int], limit: int) -> List[Candle]:
    rows: List[Candle] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            ts = int(float(r.get("ts") or r.get("time") or r.get("timestamp") or 0))
            if ts > 10_000_000_000:
                ts //= 1000
            if start_ts is not None and ts < start_ts:
                continue
            if end_ts is not None and ts > end_ts:
                continue
            rows.append(
                Candle(
                    ts=ts,
                    open=float(r["open"]),
                    high=float(r["high"]),
                    low=float(r["low"]),
                    close=float(r["close"]),
                    volume=float(r.get("volume", 0.0) or 0.0),
                )
            )
            if len(rows) >= int(limit):
                break

    rows.sort(key=lambda x: x.ts)
    if not rows:
        raise RuntimeError(f"CSV loaded but empty after filters: {path}")
    return rows
