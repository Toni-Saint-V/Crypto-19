# Work Log

## 2025-12-24 17:38:14 — Dashboard: Backtest/Chart stabilization
- Done:
  - P2: Chart uses /api/candles (mocks removed), trade markers normalize to UNIX seconds (per Cursor report).
  - Found blocker: POST /api/backtest/run returns 400 when symbol/timeframe missing.
- Verify:
  - bash scripts/verify.sh (pytest OK, API smoke OK; ruff warnings remain non-blocking)
- Next:
  - Fix Run Backtest payload: include symbol + timeframe from UI; surface backend error text in UI.
