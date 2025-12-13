from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List

from core.dashboard.service import get_dashboard_snapshot


ROOT_DIR = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT_DIR / "docs"
SNAP_DIR = DOCS_DIR / "snapshots"


async def produce_matrix() -> None:
    symbols = ["BTCUSDT", "ETHUSDT"]
    timeframes = ["15m", "1h"]
    modes = ["live", "test", "backtest"]

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    SNAP_DIR.mkdir(parents=True, exist_ok=True)

    lines: List[str] = []
    lines.append("# Dashboard snapshot matrix")
    lines.append("")
    lines.append("| Symbol | Timeframe | Mode | File |")
    lines.append("|--------|-----------|------|------|")

    for symbol in symbols:
        for timeframe in timeframes:
            for mode in modes:
                snapshot = await get_dashboard_snapshot(
                    symbol=symbol,
                    timeframe=timeframe,
                    mode=mode,
                )
                data: Dict[str, Any] = snapshot.model_dump()

                filename = f"snapshot_{symbol}_{timeframe}_{mode}.json"
                out_path = SNAP_DIR / filename
                with out_path.open("w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                lines.append(
                    f"| {symbol} | {timeframe} | {mode} | docs/snapshots/{filename} |"
                )

    out_md = DOCS_DIR / "dashboard_mode_matrix.md"
    out_md.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    asyncio.run(produce_matrix())


if __name__ == "__main__":
    main()
