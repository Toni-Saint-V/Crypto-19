# Ticket Board

## Iteration 1 (MVP backtest -> trades on chart)
- [ ] 0001 Define API contract (candles + backtest) and align FE/BE
- [ ] 0002 Backend: /api/candles stable + deterministic
- [ ] 0003 Backend: /api/backtest returns trades + metrics
- [ ] 0004 Frontend: wire params -> calls -> render trades markers
- [ ] 0005 Frontend: trades table + metrics panel + loading/errors
- [ ] 0006 QA: smoke test checklist + curl scripts

## Iteration 2 (Phase 1: Mode Semantics + Safety)
- [ ] 0009 Mode Shell: semantic controls, color tokens, CTA labels (READY)
- [ ] 0010 Metrics Row: labels, units, as-of, source, formatters (READY)
- [ ] 0011 LIVE Safety UI: Kill Switch + Confirm Modal + Audit Log skeleton (READY)

## Backlog
- [ ] 0007 ui-redesign: make `npm run -s verify` PASS + PR auto-merge (ui-redesign -> main)
- [ ] 0008 Dashboard Chart: real candles + trade markers
- [ ] 0016 DX Scripts Pack: dev:clean, ports:free, verify:ci, pr:auto, logs:dev (READY)
- [ ] 0012 (future) AI Assistant: Autonomy levels + Safety Policy
- [ ] 0013 (future) ML Widgets: Regime detector, Volatility, Trade Quality
- [ ] 0014 (future) Strategy Builder: No-code + Pro mode
- [ ] 0015 (future) Backtest Lab: Monte Carlo, Strategy comparison
