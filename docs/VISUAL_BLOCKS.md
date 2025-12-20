# Visual blocks (draft)

Generated: 2025-12-20 04:32

## Цель
Определить блоки UI и их входные данные, чтобы не “рисовать пустоту”.

## Блоки
1) Header KPI strip
   - Inputs: metrics (pnl/winrate/exposure/drawdown), positions count, risk profile

2) Chart (hero)
   - Inputs: candles (OHLCV), overlays (ema50/ema200), volume, optional equity series

3) Trades list
   - Inputs: trades (list)

4) Equity curve
   - Inputs: equity (timeseries)

5) Metrics panel
   - Inputs: metrics (summary)

6) AI Predictor
   - Inputs: mlScore (score/confidence/reasons/dataHealth)

7) AI Chat
   - Inputs: assistant conversation + actions

8) BACKTEST drawer (bottom)
   - Inputs: backtestResult (trades+equity+metrics + logs)

## Состояния по умолчанию (обязательно)
Для каждого блока: loading / empty / error / partial-data
