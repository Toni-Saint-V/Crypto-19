# Contracts — CryptoBot19Clean (Single Source of Truth)

## Canonical Modes
- Canonical (everywhere): `LIVE | TEST | BACKTEST` (UPPERCASE).
- Allowed input only: `live/test/backtest` -> MUST be normalized to UPPER immediately.
- UI state/stores/logs MUST store only UPPER modes.

## Deployment / Origins
- Prod: FastAPI serves Vite build + `/api/*` on same origin. Use relative `/api/*`.
- Dev: Vite runs separately with proxy to FastAPI. Still use relative `/api/*` (no CORS).

## API Base Rules (Frontend)
- Frontend must use a single API client:
  - `apiBase = import.meta.env.VITE_API_BASE ?? ""`
  - All calls use `${apiBase}/api/...`
  - Default is same-origin. Dev proxy makes it work.

## Backtest Contract (Job-only, async)
Only async job contract. No sync results endpoint.
- POST `/api/backtest` -> `{ job_id }`
- GET `/api/backtest/{job_id}/status` -> `{ status: queued|running|done|failed, progress: 0..1, message?, started_at?, updated_at? }`
- GET `/api/backtest/{job_id}/result` -> `{ summary, trades, equity, diagnostics, artifacts? }`

UI must:
- store `job_id`, poll status, then fetch result.
- never rely on window events for backtest updates.

## Snapshot / Polling (MVP)
- MVP uses polling with smart intervals + backoff.
- Mode switching MUST stop polling and abort in-flight requests.

## ML / Signal Score (MVP heuristic, stable contract)
Signal Score is deterministic heuristic baseline (not fake ML), but contract must be stable:
`{ mode, score(0..100), confidence(0..1), reasons[], data_health, updated_at }`

`reasons[]` is structured:
- `feature` (string)
- `impact` (number, signed)
- `note` (short)
- `caveat` (short)

`data_health` minimum:
- `staleness_sec`
- `missing_pct`
- `anomalies[]`

## Assistant Contract (actions are UI-first, safe)
Assistant response may include `actions[]`:
- Every action includes `scope` (allowed modes), `preview` (diff/summary), `requires_confirm=true`.
- No silent changes in LIVE.

## Definition of Done
- OpenAPI has no duplicate path+method.
- UI uses only UPPER modes in state/stores/logs.
- Backtest flow is job-only and always renders results in drawer.
- 10-switch test passes (no mode leakage, no stale polling).

## Common Pitfalls
- Keeping both sync + async backtest "just in case".
- UI storing lowercase mode for convenience.
- Hidden direct `fetch("/api/...")` bypassing the API client.
- Polling timers not stopped on mode switch -> leakage + load.
