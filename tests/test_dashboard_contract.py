from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Dict


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.dashboard.service import get_dashboard_snapshot      # noqa: E402


SAMPLE_PATH = ROOT_DIR / "docs" / "dashboard_snapshot_sample.json"


def load_sample() -> Dict[str, Any]:
    if not SAMPLE_PATH.exists():
        raise AssertionError(f"Sample snapshot file not found: {SAMPLE_PATH}")
    with SAMPLE_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def test_dashboard_snapshot_contract_matches_sample_keys() -> None:
    sample = load_sample()
    snapshot = asyncio.run(
        get_dashboard_snapshot(
            symbol="BTCUSDT",
            timeframe="15m",
        )
    )
    snapshot_dict = snapshot.model_dump()

    sample_keys = set(sample.keys())
    snapshot_keys = set(snapshot_dict.keys())

    assert snapshot_keys == sample_keys, (
        "DashboardSnapshot top-level keys changed. "
        "Update docs/dashboard_snapshot_sample.json and UI mapping if this is intentional."
    )


def test_dashboard_snapshot_has_required_fields_and_types() -> None:
    sample = load_sample()
    required_keys = [
        "balance",
        "daily_pnl_pct",
        "total_profit",
        "winrate_pct",
        "active_positions",
        "risk_level_pct",
        "symbol",
        "timeframe",
        "candles",
        "ai_signals",
    ]
    for key in required_keys:
        assert key in sample, f"Missing required key in sample snapshot: {key}"

    assert isinstance(sample["candles"], list), "candles must be a list"
    assert isinstance(sample["ai_signals"], list), "ai_signals must be a list"

    if sample.get("trades") is not None:
        assert isinstance(sample["trades"], list), "trades must be a list when present"
