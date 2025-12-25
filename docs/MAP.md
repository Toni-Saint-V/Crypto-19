# Map

## Repos / Worktrees
- Main: `/Users/user/cryptobot_19_clean`
- UI: `/Users/user/cryptobot_19_clean__ui` (branch ui-redesign)
- Infra: `/Users/user/cryptobot_19_clean__infra` (branch infra-pre-redesign)

## Key UI
- `web/dashboard-react/src/App.tsx` (mode + orchestration)
- `web/dashboard-react/src/components/ChartArea.tsx` (hero chart + drawer overlay)
- `web/dashboard-react/src/components/Sidebar.tsx` (chat right)

## Key API
- `/api/dashboard/snapshot` (polling snapshot)
- `/api/backtest` job endpoints (POST/status/result)
- `/api/ml/score`
- `/api/assistant`

## Non-negotiables
- Mode UPPER, job-only backtest, polling MVP, 100vh layout contracts.
