# CryptoBot Pro · Dashboard Backend Overview

This document describes how the backend prepares data for the new dashboard UI.

## 1. Entry points

Python service layer:

- Module: core.dashboard.service
- Functions:
  - async get_dashboard_snapshot(symbol: str, timeframe: str, mode: str | None = None) -> DashboardSnapshot
  - sync  get_dashboard_snapshot_sync(symbol: str, timeframe: str, mode: str | None = None) -> DashboardSnapshot

Business logic module:

- Module: core.dashboard.logic
- Main function:
  - build_dashboard_state(symbol: str, timeframe: str, mode: str = "live", limit: int = 200) -> dict

All UI data comes through these functions.

## 2. REST and WebSocket

REST endpoint:

- Method: GET
- URL: /api/dashboard/snapshot
- Query params:
  - symbol (string, default: "BTCUSDT")
  - timeframe (string, default: "15m")
  - mode (string, default: "live")
    - "live"      – synthetic live-like data
    - "test"      – synthetic test environment
    - "backtest"  – synthetic backtest environment

Response JSON structure is equal to DashboardSnapshot.

WebSocket endpoint:

- URL: /ws/dashboard
- Query params:
  - symbol, timeframe, mode (same as REST)
- Server messages:
  - type: "dashboard_update"
  - payload: DashboardSnapshot as JSON

UI flow:

1) Load initial snapshot via REST.
2) Subscribe to WebSocket for live updates (same parameters).

## 3. DashboardSnapshot schema

Pydantic model: core.dashboard.service.DashboardSnapshot

Top-level fields:

- balance: float
- daily_pnl_pct: float
- total_profit: float
- winrate_pct: float
- active_positions: int
- risk_level_pct: float

- symbol: str
- timeframe: str

- candles: List[Candle]
- ai_signals: List[AISignal]
- trades: List[Trade]

Candle:

- time: int      (unix seconds)
- open: float
- high: float
- low: float
- close: float
- volume: float

AISignal:

- symbol: str
- side: str          ("buy" or "sell")
- confidence: float  (0–100)
- entry: float
- target: float
- stop_loss: float
- timeframe: str
- comment: str | None

Trade:

- id: str
- symbol: str
- side: str
- price: float
- qty: float
- timestamp: int     (unix seconds)
- realized_pnl: float | None

These fields are the stable contract for the new UI.

## 4. Business logic flow (core.dashboard.logic)

Main function:

- build_dashboard_state(symbol, timeframe, mode="live", limit=200) -> dict

It calls:

1) generate_synthetic_candles(symbol, timeframe, mode, limit) -> List[CandleData]

- Builds synthetic candle series for requested symbol/timeframe.
- Deterministic seed based on (symbol, timeframe, mode).
- Each candle has:
  - time, open, high, low, close, volume.

2) compute_portfolio_metrics(candles) -> dict

Returns:

- balance
- daily_pnl_pct
- total_profit
- winrate_pct
- active_positions
- risk_level_pct

3) build_ai_signals(symbol, timeframe, candles, mode) -> List[AISignalData]

- Builds one synthetic AI signal based on last candle:
  - side: "buy" if close >= open else "sell"
  - confidence based on body size
  - entry / target / stop_loss around last close

4) load_trades_history(symbol, timeframe, mode) -> List[TradeData]

- Currently returns empty list (placeholder).
- UI must handle empty trades list safely.

Finally build_dashboard_state returns dict with:

- metrics
- symbol, timeframe
- candles[] as plain dicts
- ai_signals[] as plain dicts
- trades[] as plain dicts

Service layer:

- DashboardSnapshot(**state) wraps this dict into a Pydantic model.

## 5. Files for frontend developers

Generated debug files:

- docs/dashboard_snapshot_sample.json
  - Full example DashboardSnapshot JSON.
- docs/dashboard_logic_check.md
  - Summary of keys and sample values.
- docs/dashboard_logic_snapshots.md (optional)
  - Top-level key comparison for modes (live/test/backtest), if generated.

Frontend should treat these files as the reference for field names and structure.

## 6. Safe vs breaking changes

Safe backend changes (do NOT break UI):

- Changes inside:
  - generate_synthetic_candles
  - compute_portfolio_metrics
  - build_ai_signals
  - load_trades_history
- Internal formulas, numeric values, mock data details.

Potentially breaking changes (require UI update):

- Removing or renaming top-level keys in DashboardSnapshot.
- Changing types of:
  - candles, ai_signals, trades (they must stay lists).
- Removing required numeric fields:
  - balance, daily_pnl_pct, total_profit, winrate_pct,
    active_positions, risk_level_pct.

