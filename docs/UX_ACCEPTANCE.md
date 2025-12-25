# UX acceptance checklist (draft)

Generated: 2025-12-20 04:32

## Layout
- [ ] No page scroll at 100% zoom (desktop)
- [ ] Chart always visible
- [ ] Right chat fixed width; input pinned
- [ ] Backtest drawer collapsed by default; does not affect chart height
- [ ] Internal scroll only in: chat, raw payload, long lists (trades/logs)

## Modes
- [ ] Mode switch visible always
- [ ] 10x mode switching does not leak state/data
- [ ] Controls enabled/disabled correctly per mode (see MODE_MATRIX.md)

## Data UX
- [ ] Candles load: loading -> success/empty/error
- [ ] Trades/Equity/Metrics: same state discipline
- [ ] No silent failures (errors visible with status/message)

## Polish
- [ ] Consistent spacing/radii/typography
- [ ] No placeholder junk in KPIs
