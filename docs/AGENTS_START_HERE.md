# AGENTS START HERE (copy/paste)

## 0) Shared context (paste this first to both)
Paste the content of docs/CHAT_CONTEXT.md above your prompt.

## 1) HARD RULES (to avoid conflicts)
- Codex (infra/backend/quality) MAY edit: core/**, server.py, scripts/**, .github/**, tests/**, docs/** (including checklist).
- Cursor (UI/Frontend) MUST NOT edit: core/**, server.py, scripts/**, .github/**, docs/DASHBOARD_CHECKLIST.md.
- Only Codex updates docs/DASHBOARD_CHECKLIST.md. Cursor reports what to check off.

## 2) Codex prompt (infra/backend/quality)
You are the Codex agent in CryptoBot19Clean. Your zone: backend/infra/quality. Do not touch UI/layout.

Goal: finish everything BEFORE UI redesign and make repo "green by default":
- scripts/verify.sh is reliable and preferably strict
- CI (GitHub Actions) passes
- API has unified JSON error envelope + request_id + response time headers (422 too)
- determinism/stability: core endpoints consistent
- docs/DASHBOARD_CHECKLIST.md is the single source of truth; only check items you actually verified
- work in big batches: one big commit per completed checklist chunk

Algorithm:
1) Read docs/DASHBOARD_CHECKLIST.md and docs/CHAT_CONTEXT.md.
2) Take remaining P0/P1 items (top 10–15) and finish them in batches:
   - Observability: x-request-id + x-response-time-ms + unified JSON error envelope (including 422)
   - /api/dashboard snapshot endpoint + smoke + pytest test
   - ruff/mypy/pytest should not block progress; minimal per-file ignores only for legacy hotspots if needed
   - boot_once smoke starts server on random port and runs smoke without requiring a pre-running server
   - CI workflow runs scripts/verify.sh (+ key probes)
3) After each batch: run scripts/verify.sh, boot_once, pytest; then update checklist and commit.

Constraints:
- Do not break API contracts unless required.
- Do not touch frontend/layout.
- Avoid many tiny commits.

At the end output:
- checklist items closed
- commands to run locally
- remaining checklist items

## 3) Cursor prompt (UI/Frontend redesign)
You are the Cursor agent. Your zone: UI/Frontend redesign only. Do NOT touch backend/CI/scripts/checklist.

Hard UX requirements:
- 100vh, body overflow hidden, no page scroll
- chat right fixed width, internal scroll, input pinned
- chart always visible (does not jump)
- backtest results: bottom drawer (collapsed by default), internal scroll, does not resize chart

What to do:
1) Detect frontend stack and entry points (routes/pages/components/styles).
2) Implement AppShell: Sidebar + Sticky Topbar + main grid.
3) Build Dashboard layout:
   - Topbar controls: symbol/timeframe/mode/refresh/export/last updated
   - KPI cards
   - Chart card (loading/empty/error states)
   - Right rail: ML score + Equity (states)
   - Trades table (sticky header, sorting at least time/pnl, states)
   - Metrics panel (grouped, tooltips, states)
4) Add design tokens (CSS vars), typography, spacing, radius, hover/focus states.
5) Browser console must have 0 errors.
6) Add 2–4 UI smoke checks (render tests or minimal checks if no framework exists).

Work in 3–6 big commits max; each commit completes a full UI layer.

At the end write back to Codex:
- files/commits list
- how to run UI
- which acceptance criteria are met and which checklist items Codex can mark
