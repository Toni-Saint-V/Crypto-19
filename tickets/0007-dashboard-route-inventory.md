# Ticket 0007 - Dashboard route inventory
Status: READY
Updated: 2025-12-24 02:52:06
Owner: Terminal generator

## Scope
- /api/assistant
- /api/ml/*
- /api/backtest*

## Focused routes (all occurrences)
| method | path | line | handler | tag |
|---|---|---:|---|---|
| POST | /api/assistant | 1277 | api_assistant | compat,shim |
| POST | /api/assistant | 1313 | api_assistant_stub_v2 | compat,shim,stub |
| GET | /api/backtest | 1308 | api_backtest_latest_v2 | compat,shim,stub |
| GET | /api/backtest/info | 1286 | api_backtest_info | compat,shim |
| POST | /api/backtest/run | 1304 | api_backtest_run_v2 | compat,shim,stub |
| GET | /api/backtest_legacy | 644 | api_backtest_current | legacy |
| GET | /api/backtest_legacy/legacy | 743 | api_backtest_legacy | legacy,compat |
| GET | /api/backtest_legacy/mock | 674 | api_backtest_current_mock | legacy,compat |
| POST | /api/backtest_legacy/run | 555 | api_backtest_run | legacy |
| GET | /api/ml/predict | 801 | api_ml_predict | unknown |
| POST | /api/ml/score | 1264 | api_ml_score | unknown |
| POST | /api/ml/score | 1317 | api_ml_score_stub_v2 | compat,shim,stub |

## Duplicates (dashboard-related)
| method | path | occurrences | details |
|---|---|---:|---|
| POST | /api/assistant | 2 | line 1277 -> api_assistant (compat,shim); line 1313 -> api_assistant_stub_v2 (compat,shim,stub) |
| POST | /api/ml/score | 2 | line 1264 -> api_ml_score (unknown); line 1317 -> api_ml_score_stub_v2 (compat,shim,stub) |

## Canonical Dashboard API (proposal)
Use only ONE of each route family below (remove/disable duplicates):
- GET /api/candles
- POST /api/backtest/run (or job-based backtest if already present)
- POST /api/ml/score
- POST /api/assistant

## Keep/Remove recommendation (rule)
- If two handlers share the same method+path:
  - Keep the one that is NOT tagged legacy/compat/stub (or whose handler function is newer).
  - Remove/disable the compat/stub one to avoid UI calling the wrong handler.

## Notes
- Tags are heuristic-based (searching nearby code for legacy/compat/stub words). Validate by reading the handler bodies if ambiguous.
