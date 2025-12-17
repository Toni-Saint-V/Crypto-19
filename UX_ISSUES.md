# UX ISSUES

Updated: 2025-12-17 05:23

## Non-negotiables
- No page scroll. App fits 100vh or 100dvh.
- Only internal scroll in: chat messages, raw payload, trades/logs lists, drawer content.
- Chart is always visible (hero).
- Right chat panel fixed width; input pinned to bottom; messages scroll inside.
- BACKTEST must not push chart down.

## Chosen BACKTEST strategy
- Bottom drawer inside the main left area for Results/Trades/Logs/Raw.
- Collapsed by default; internal scroll; max-height capped (about 35-45% of left area).
- Tabs inside drawer: Results | Trades | Logs | Raw.

## Product polish
- Consistent spacing/typography; align top edges of chart and right panel.
- Clear BACKTEST Run button plus loading/progress/disabled state.
- Empty/loading states instead of misleading zeroes.
