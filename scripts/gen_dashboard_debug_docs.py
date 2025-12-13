from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import List


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.dashboard.service import get_dashboard_snapshot


DOCS_DIR = ROOT_DIR / "docs"


async def make_single_sample() -> None:
    snapshot = await get_dashboard_snapshot(
        symbol="BTCUSDT",
        timeframe="15m",
    )

    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    snapshot_dict = snapshot.model_dump()

    out_json = DOCS_DIR / "dashboard_snapshot_sample.json"
    with out_json.open("w", encoding="utf-8") as file:
        json.dump(snapshot_dict, file, ensure_ascii=False, indent=2)

    top_level_keys = sorted(snapshot_dict.keys())
    candles = snapshot.candles
    ai_signals = snapshot.ai_signals

    lines: List[str] = []
    lines.append("# Dashboard Logic Check")
    lines.append("")
    lines.append("## Top-level keys in DashboardSnapshot")
    lines.append("")
    for key in top_level_keys:
        lines.append(f"- {key}")
    lines.append("")
    lines.append("## Candles sample")
    lines.append("")
    if candles:
        candle = candles[-1]
        lines.append(f"- time: {candle.time}")
        lines.append(f"- open: {candle.open}")
        lines.append(f"- high: {candle.high}")
        lines.append(f"- low: {candle.low}")
        lines.append(f"- close: {candle.close}")
        lines.append(f"- volume: {candle.volume}")
    else:
        lines.append("- no candles in snapshot")
    lines.append("")
    lines.append("## AI signals sample")
    lines.append("")
    if ai_signals:
        signal = ai_signals[0]
        lines.append(f"- symbol: {signal.symbol}")
        lines.append(f"- side: {signal.side}")
        lines.append(f"- confidence: {signal.confidence}")
        lines.append(f"- entry: {signal.entry}")
        lines.append(f"- target: {signal.target}")
        lines.append(f"- stop_loss: {signal.stop_loss}")
        lines.append(f"- timeframe: {signal.timeframe}")
        lines.append(f"- comment: {signal.comment}")
    else:
        lines.append("- no ai_signals in snapshot")
    lines.append("")
    lines.append("## Endpoints used by UI")
    lines.append("")
    lines.append("- REST: GET /api/dashboard/snapshot")
    lines.append("- WS:   /ws/dashboard (query params: symbol, timeframe, mode)")
    lines.append("")
    lines.append("JSON sample: docs/dashboard_snapshot_sample.json")

    out_md = DOCS_DIR / "dashboard_logic_check.md"
    out_md.write_text("\n".join(lines), encoding="utf-8")


async def main() -> None:
    await make_single_sample()


if __name__ == "__main__":
    asyncio.run(main())
