# Dashboard checklist (source of truth)

## P0 Core
- [ ] App boots locally with one command
- [ ] UI loads without console errors
- [ ] Core routes wired (candles/trades/equity/metrics)
- [ ] Backtest engine runs end-to-end (baseline strategy)
- [ ] Data pipeline stable (fetch/cache/resample)
- [ ] Deterministic runs (seed, reproducible results)
- [ ] Error handling + user-facing messages
- [ ] Config system (env + defaults + validation)

## P1 Quality
- [x] Local verify script (compile/lint/type/test if available)
- [x] API smoke test returns 200 for key endpoints
- [x] Autoscan pinned doc link (docs/AUTOSCAN.md)
- [x] Pytest warning suppressed (starlette multipart)
- [ ] Logging structured (levels, request ids)
- [ ] Tests: unit coverage for core modules
- [ ] CI pipeline (lint/test/smoke) runs on PR
- [ ] Formatting + lint rules enforced

## P2 Product
- [ ] UI redesign applied (layout, typography, spacing)
- [ ] Performance pass (slow endpoints, caching)
- [ ] ML/AI module integrated (score endpoint + feature pipeline)
- [ ] Metrics & charts validated
- [ ] Export/report (csv/json) works
- [ ] Docs: setup, run, architecture
- [ ] Release/deploy instructions
