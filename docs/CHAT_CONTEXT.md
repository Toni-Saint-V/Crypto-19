# Chat Context (for Agents)

Goal: crypto trading bot + web dashboard with 3 isolated modes:
- LIVE: real trading (guardrails, monitoring)
- TEST: paper trading (safe experimentation)
- BACKTEST: offline simulation via async job contract

Non-negotiables:
- Page never scrolls; only chat and drawer content scroll.
- Chart is hero and always visible.
- Chat is fixed width on the right; messages scroll; input pinned.
- Backtest results are a bottom overlay drawer, collapsed by default, max height ~38vh, internal scroll only.
- Modes never leak after 10 rapid switches.
- Canonical modes are UPPER: LIVE/TEST/BACKTEST; lowercase input is normalized immediately.
- Backtest is job-only: POST -> job_id, poll status, then fetch result.
- MVP uses polling (smart interval + backoff); stop/abort on mode switch.
- Signal Score MVP is deterministic heuristic with stable contract (score/confidence/reasons/data_health).
