# Tasks

## P0 (Must ship)
### Backend (Codex)
- Mode: accept any case input, store UPPER everywhere.
- Remove duplicate routes: `/api/assistant`, `/api/ml/score` must have exactly one handler each.
- Backtest job-only endpoints: POST -> job_id, GET status/result.
- OpenAPI clean (no duplicates), UI payloads pass without 422.
- Fix suspicious pydantic defaults/models in core services.

### Frontend (Cursor)
- Single API client with `apiBase = VITE_API_BASE ?? ""`.
- Mode lock: store UPPER only; normalize inputs.
- Backtest job flow in state; BacktestResultsPanel reads from state (no window events).
- Polling engine with abort+stop on mode switch.
- Layout vars: remove hardcoded offsets; drawer uses `right: var(--chat-w)`.

## P1 (Quality)
- Chart resize robustness (drawer/chat toggles).
- Error states show request_id and helpful UI.
- Add Playwright tests.

## Definition of Done
- P0 complete and verify passes; P1 starts only after P0 stability.

## Common Pitfalls
- Shipping UI polish before contract cleanup.
- Keeping old compat shims in production paths.
