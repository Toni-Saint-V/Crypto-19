# Dashboard Logic Check

## Top-level keys in DashboardSnapshot

- active_positions
- ai_signals
- balance
- candles
- daily_pnl_pct
- risk_level_pct
- symbol
- timeframe
- total_profit
- trades
- winrate_pct

## Candles sample

- time: 1765465292
- open: 65849.4096288949
- high: 66024.403462792
- low: 65804.53198401014
- close: 65981.2402788026
- volume: 12346.865660526271

## AI signals sample

- symbol: BTCUSDT
- side: buy
- confidence: 16.0
- entry: 65915.26
- target: 66641.05
- stop_loss: 65321.43
- timeframe: 15m
- comment: Trend up, buy on dip

## Endpoints used by UI

- REST: GET /api/dashboard/snapshot
- WS:   /ws/dashboard (query params: symbol, timeframe, mode)

JSON sample: docs/dashboard_snapshot_sample.json