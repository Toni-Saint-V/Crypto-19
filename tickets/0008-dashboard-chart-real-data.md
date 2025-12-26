# Ticket 0008 — Dashboard Chart: Real Candles + Trade Markers
Status: READY
Owner: Frontend Engineer
Priority: P0
Scope: web/dashboard-react

Goal
- Replace mock candles with real candles from backend and plot backtest trades as chart markers.

In Scope
- Disable/remove mock candle generation in chart components.
- Fetch candles from GET /api/candles using current symbol + tf.
- Plot backtest trades as markers (entry/exit).
- Normalize timestamps to UNIX seconds (int) in UI mapping if needed.
- Keep layout constraints (100vh, no page scroll).

Out of Scope
- Live trading
- Backend refactors
- Styling overhaul

Acceptance
- Chart uses /api/candles (no mocks).
- Trade markers reliably appear.
- Frontend builds without TS errors.
