CryptoBot Pro · Backtest API Contract (draft)

Endpoint:
- GET /api/backtest_advanced

Query parameters:
- symbol: trading pair, example: BTCUSDT
- interval: timeframe, example: 1m, 5m, 15m, 1h
- strategy: backtest engine preset:
  - pattern3_extreme
  - ma_trend_follow
  - breakout_basic
- risk_per_trade (optional, default 100.0)
- rr_ratio (optional, default 4.0)
- limit (optional, default 500)

Successful response (HTTP 200) main structure:
- symbol: string
- timeframe: string (same as interval query)
- strategy: string (final strategy id)
- params:
  - risk_per_trade: number
  - rr_ratio: number
  - limit: integer
- trades: array of trade objects
- summary: object with metrics
- diagnostics: object with data diagnostics

Trade object:
- id: integer
- symbol: string
- direction: string ("long")
- entry_time: integer (unix seconds or ms, as in candles)
- exit_time: integer
- entry_price: number
- exit_price: number
- size: number (position size)
- risk_R: number (always 1.0 per trade)
- result_R: number (P/L in R-multiples)
- pnl: number (P/L in currency units, using risk_per_trade)
- max_favorable_excursion: number
- max_adverse_excursion: number
- stop: number
- target: number

Summary object:
- total_trades: integer
- wins: integer
- losses: integer
- winrate_pct: number
- gross_profit: number
- gross_loss: number
- net_profit: number
- profit_factor: number
- max_drawdown: number
- max_drawdown_pct: number
- average_R: number
- average_win_R: number
- average_loss_R: number

Sample payloads:
- docs/backtest_samples/backtest_pattern3_extreme.json
- docs/backtest_samples/backtest_ma_trend_follow.json
- docs/backtest_samples/backtest_breakout_basic.json
