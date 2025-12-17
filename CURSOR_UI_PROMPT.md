# Cursor UI Prompt: Make dashboard functional (single dashboard)

Context:
- Canonical dashboard is web/dashboard-react
- Legacy web/dashboard/* was removed from the repo

Hard acceptance criteria:
1) LIVE/TEST: any change in symbol/timeframe/strategy params must update the chart (no dead toggles).
2) BACKTEST: dedicated parameter form (date range, initial balance, fees/slippage, risk, strategy params).
3) BACKTEST pipeline: Run -> loading/progress -> store result -> show Results/Trades/Logs/Raw.
4) Layout: no page scroll (100vh/100dvh shell), internal scroll only in chat/raw/trades/logs/drawer, chart always visible.

Implementation guidance:
- Single source of truth for UI state: mode, symbol, timeframe, params, backtest params, backtest result.
- ChartArea must subscribe to that state and re-fetch/re-render on dependency changes.

Start from these files:
- web/dashboard-react/src/App.tsx
- web/dashboard-react/src/main.tsx
- web/dashboard-react/src/components/ChartArea.tsx
- web/dashboard-react/src/components/ChartParametersRow.tsx
- web/dashboard-react/src/components/BacktestConfigPanel.tsx
- web/dashboard-react/src/components/BacktestSheet.tsx
- web/dashboard-react/src/components/BacktestResultsPanel.tsx
