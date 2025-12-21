# PROJECT LOG
## 2025-12-16 19:43 Repo size audit and migration candidates

- Workspace plan: /Users/user/crypto_19_workspace/notes/migration_candidates.md
- Largest files list: /Users/user/crypto_19_workspace/notes/largest_files_top50.txt
- du report: /Users/user/crypto_19_workspace/notes/repo_size_top40.txt

Next: pick конкретные папки/файлы для выноса + добавить .gitignore правила + (по необходимости) перенос с сохранением относительной структуры.
## 2025-12-16 19:47 Repo cleanup: moved heavy artifacts out of repo

- Migration folder: '"$DEST"'
- Moves log: (nothing moved)
- Added .gitignore rules for venv/node_modules/reports/pkg/zip/snapshots
- If any of these were tracked, they were untracked via git rm --cached (no deletion in workspace)
## 2025-12-16 19:49 Staged cleanup changes (artifacts moved out of repo)

- Added archive/README_MOVED.md explaining snapshot relocation
- Ensured .gitignore ignores venv/node_modules/reports/pkg/zip/snapshots
- Next: commit cleanup separately from UI changes (e.g., ChartArea.tsx)
## 2025-12-17 05:20 Repo hygiene: moved backups/caches/logs out of repo

- Moved junk into workspace: /Users/user/crypto_19_workspace/migrations/20251217_052005/repo_junk
- Manifest: /Users/user/crypto_19_workspace/migrations/20251217_052005/repo_junk/moved_manifest.txt
- Count moved: 113
- Updated .gitignore: __pycache__, *.pyc, *.log, *.bak*
## 2025-12-17 05:21 Safe terminal command rules locked

- Enforced: clean EOF heredocs, no extra lines after EOF, no emojis, no dangerous line breaks
- Documented in: /Users/user/cryptobot_19_clean/SAFE_COMMANDS.md
## 2025-12-17 05:23 AUDIT+MAP: UI and BACKTEST layout scan generated

- Generated: MAP.md, UX_ISSUES.md, CURSOR_UI_PROMPT.md
- Next: paste CURSOR_UI_PROMPT.md into Cursor and implement Bottom Drawer strategy for BACKTEST.
## 2025-12-17 05:24 UI handoff to Cursor

- Cursor prompt copied to clipboard (from CURSOR_UI_PROMPT.md)
- External archive:
  - ~/crypto_19_workspace/prompts/cursor/CURSOR_UI_PROMPT_LATEST.md
## 2025-12-17 05:54 Fix: Vite proxy /api and API compat routes for backtest/assistant/ml

- Added Vite proxy for /api to backend (dev)
- Added server.py routes:
  - POST /api/backtest/run (compat)
  - GET  /api/backtest (latest result)
  - POST /api/assistant (stub)
  - POST /api/ml/score (stub)
## 2025-12-17 05:59 UI wiring audit: chart not reacting + backtest params missing

- Generated an audit report in workspace: ~/crypto_19_workspace/notes/ui_wiring_audit_*.md
- Next: implement single UI state contract + wire chart updates + add Backtest param form and run pipeline.
## 2025-12-17 06:00 UI wiring: Cursor prompt archived

- Audit report: (not found in workspace notes)
- Cursor prompt archived: /Users/user/crypto_19_workspace/prompts/cursor/CURSOR_UI_PROMPT_WIRING_LATEST.md
## 2025-12-17 06:03 Prune dashboards: keep web/dashboard-react, move others to workspace

- Kept: web/dashboard-react
- Moved dashboards to: /Users/user/crypto_19_workspace/migrations/20251217_060301/dashboards_prune
- Moved count: 1
  - web/dashboard
## 2025-12-17 06:05 Docs cleanup: remove legacy dashboard references

- Regenerated MAP.md to exclude node_modules and removed web/dashboard references
- Rewrote CURSOR_UI_PROMPT.md to reference only web/dashboard-react


## 2025-12-18 06:29:46 - PROJECT_INSTRUCTIONS
- File: docs/PROJECT_INSTRUCTIONS.md
- Copied to clipboard: yes (pbcopy)

## 2025-12-18 17:27:57 - Terminal rules locked
- File: docs/TERMINAL_RULES.md
- Copied to clipboard: yes

## 2025-12-18 17:31:40 - Remove confusing root prompt files
- Removed: PROJECT_ORCHESTRATOR.md
- Removed: PROJECT_RULES.md
- Removed: CRYPTOBOT_PRO_VSCODE_AI_PROMPT.md
- Removed: CURSOR_UI_PROMPT.md

## 2025-12-18 18:26:46 - Lead brief
- Wrote: docs/LEAD_BRIEF.md
- Copied to clipboard: yes

## 2025-12-18 18:28:57 - AUDIT + MAP + CURSOR PROMPT
- Frontend: web/dashboard-react
- Backend: .
- Wrote: docs/MAP.md
- Wrote: docs/UX_ISSUES.md
- Wrote: docs/CURSOR_UI_PROMPT.md
- Copied to clipboard: docs/CURSOR_UI_PROMPT.md

## 2025-12-18 18:30:15 - Chat prompts created
- docs/chat_prompts/PM.md (copied to clipboard)
- docs/chat_prompts/FRONTEND.md
- docs/chat_prompts/BACKEND.md
- docs/chat_prompts/QA.md
- TASKS: P0-1 set to IN_PROGRESS

## 2025-12-18 18:33:39 - Operator rules locked
- Wrote: docs/OPERATOR_RULES.md
- Clipboard: docs/OPERATOR_RULES.md

## 2025-12-18 18:36:55 - Cleanup old markdown files
- Archived to: docs/_archive_cleanup_20251218_183655
- Kept: PROJECT_LOG.md and core docs (operator/instructions/tasks/contracts/testplan/map/ux/cursor prompt/research snapshot + chat_prompts)

## 2025-12-18 18:37:39 - Repo cleanup checkpoint
- Updated: .gitignore (archive + temp hits ignored)
- Commit: created if there were staged changes

## 2025-12-18 18:38:53 - Clipboard
- Copied: docs/PROJECT_INSTRUCTIONS.md
- Action: paste into Project Instructions

## %s - Design target updated (ref + Monte Carlo)
2025-12-18 19:04:51
- Wrote: docs/DESIGN_TARGET.md
- Wrote: docs/CURSOR_DESIGN_PROMPT.md
- Clipboard: docs/CURSOR_DESIGN_PROMPT.md

## 2025-12-18 19:11:02 - Cursor prompt
- Wrote: docs/CURSOR_FRONTEND_PROMPT.md
- Copied to clipboard: docs/CURSOR_FRONTEND_PROMPT.md

## %s - Reference design locked + cursor prompt rebuilt
2025-12-18 19:14:36
- Wrote: docs/REFERENCE_STYLE.md
- Wrote: docs/FEATURES_SCOPE.md
- Wrote: docs/CURSOR_FRONTEND_PROMPT.md
- Clipboard: docs/CURSOR_FRONTEND_PROMPT.md

## %s - Cursor prompt updated (removed phone/device requirement)
2025-12-18 19:18:53
- Updated: docs/CURSOR_FRONTEND_PROMPT.md
- Clipboard: docs/CURSOR_FRONTEND_PROMPT.md

## %s - New chat handoff prepared
2025-12-18 19:22:16
- Wrote: docs/NEW_CHAT_HANDOFF.md
- Clipboard: docs/NEW_CHAT_HANDOFF.md

## 2025-12-18 20:04:09 - Next step
- Clipboard: docs/chat_prompts/PM.md
- Action: create chat inside Project named 'PM/Architect' and paste clipboard
- Then reply in this chat with //

## 2025-12-18 20:08:46 - Next step
- Clipboard: docs/CURSOR_FRONTEND_PROMPT.md
- Action: create chat inside Project named 'Frontend/Cursor' and paste clipboard
- Then wait for Cursor response (changed files + check steps) and paste that response back here

## 2025-12-18 20:23:12 - Project orchestrator chat seed
- Wrote: docs/PROJECT_ORCHESTRATOR_CHAT.md
- Clipboard: docs/PROJECT_ORCHESTRATOR_CHAT.md

## 2025-12-18 22:32:03
- Generated docs/AUDIT_REVIEW.md (extracted issues/plan from audit).
- Generated docs/REPO_INSPECTION.md (auto scan: entrypoints, endpoints, mode references).
- Generated docs/CONTEXT_GAPS.md (explicit unknowns to confirm).

## 2025-12-18 22:33:24
- Read docs/AUDIT_REVIEW.md + docs/REPO_INSPECTION.md + docs/CONTEXT_GAPS.md to ground next task on real entrypoints/endpoints.

## 2025-12-18 22:35:43
- Generated docs/API_CONTRACT_AUDIT.md: discovered backend /api routes + compared (heuristically) against docs/CONTRACTS.md; captured frontend /api/backtest references.

## 2025-12-18 22:40:10
- Generated docs/CONTRACT_GAP_MATRIX.md: backend /api routes + heuristic return keys + backtest Trades/Equity/Metrics presence flags; extracted /api mentions and quick signals from docs/CONTRACTS.md.

## 2025-12-18 22:44:48
- Generated docs/AST_ROUTE_MAP.md using Python AST (authoritative decorator->function binding + heuristic return-shape/keys).

## 2025-12-18 22:46:43
- Generated docs/AST_ROUTE_MAP_V2.md (AST scan incl. nested defs).
- Generated docs/ROUTE_CODE_SNIPPETS.md (code excerpts for backtest/candles/trades/equity/metrics endpoints).

## 2025-12-18 22:48:48
- Generated docs/CONTRACTS_EXTRACT.md (focused extract of Candles/Trades/Equity/Metrics/Backtest/Errors).
- Generated docs/ENDPOINT_CONTRACT_MAP.md (AST-based endpoint-to-contract mapping + likely gap flags).

## 2025-12-18 23:07:50
- Generated docs/BACKEND_P0_2_3_PLAN.md (grounded plan from AST_ROUTE_MAP_V2 + snippets + CONTRACTS.md).

## 2025-12-18 23:12:04
- Wrote docs/REDESIGN_TIMING.md: recommended timing for redesign (structural now, visual+AI/ML after API/mode/backtest stabilization).

## 2025-12-18 23:13:32
- Wrote docs/STATUS_SUMMARY.md to consolidate current grounded findings and the two-wave redesign plan.

## 2025-12-18 23:47:19
- Backend P0-3 groundwork applied:
  - Added canonical backtest normalizer -> always {trades,equity,metrics} and coerced common time fields to epoch ms.
  - Added FastAPI HTTPException handler -> JSON {status:'error', message:'...'} (replaces default {detail}).
  - Hardened GET /api/backtest to never return {} (normalized output).
  - Best-effort: /api/candles raises HTTPException if local 'error' var exists (standardizes error path).

## 2025-12-18 23:48:59
- Discovery: api.py is missing; generated docs/BACKEND_ENDPOINT_FILES.md to locate real /api/backtest job endpoints module.
- Wrote /tmp/py_compile_list.txt (server.py + top endpoint candidates) to avoid compile crash.

## 2025-12-19 00:22:06
- Backend P0-3 fix: patched core/backtest/api.py (real backtest job module).
- /api/backtest/result now returns canonical {trades,equity,metrics} via _normalize_backtest_result (maps equity_curve/statistics; coerces time keys to epoch ms).
- HTTPException detail strings converted to detail={"message": "..."} for status/result so server handler returns {"status":"error","message":"..."} consistently.

## 2025-12-19 00:30:05
- Generated docs/CORE_BACKTEST_API_MAP.md (AST route map + snippets for core/backtest/api.py).
- This is used to patch the correct backtest job endpoints (previous patch assumed status/result names and did not match).

## 2025-12-19 00:34:10
- Patched core/backtest/api.py handlers (authoritative from docs/CORE_BACKTEST_API_MAP.md):
  - result(job_id): returns _normalize_backtest_result(job.result) so payload always has trades/equity/metrics.
  - status/result HTTPException detail -> {"message": ...} so server returns {"status":"error","message":"..."} consistently.

## 2025-12-19 00:44:47
- Backend P0-3: fixed core/backtest/api.py decorator+def integrity for /api/backtest/status and /api/backtest/result.
- Removed detached decorators: 0.
- status/result now: HTTPException detail is {"message": ...}; result returns _normalize_backtest_result(job.result) (always trades/equity/metrics).

## 2025-12-19 00:51:58
- Fixed core/backtest/api.py: removed duplicate backtest status/result routes and reinserted single canonical blocks.
- Removed blocks/decorators count (best-effort): 8.
- Canonical: result(job_id) returns _normalize_backtest_result(job.result); HTTPException detail uses {"message": ...}.

## 2025-12-19 02:51:18
- Ran backtest smoke check at http://127.0.0.1:8000; wrote docs/_ai_memory/SMOKE_BACKTEST_LAST.md.

## 2025-12-19 02:55:00
- Fix: GET /api/backtest returned empty payload in smoke check. Patched all exact '/api/backtest' handlers to always return canonical {trades,equity,metrics}.
- Patched files:
  - /Users/user/cryptobot_19_clean/server.py (blocks replaced: 1)

## 2025-12-19 02:57:08
- Diagnosed why GET /api/backtest still returns {} after patch: captured port-8000 listener PID/command and printed server.py handler snippet.
- Appended observed GET /api/backtest response to docs/_ai_memory/SMOKE_BACKTEST_LAST.md.

## 2025-12-19 02:59:59
- Restarted uvicorn on :8000 with --reload so server.py changes apply immediately.
- Appended GET /api/backtest response to docs/_ai_memory/SMOKE_BACKTEST_LAST.md.
- Log: /tmp/uvicorn_8000.log

## 2025-12-19 03:02:52
- Tried to restart uvicorn with --reload; captured listener state + tailed /tmp/uvicorn_8000.log.
- Appended GET /api/backtest response to docs/_ai_memory/SMOKE_BACKTEST_LAST.md.

## 2025-12-19 03:04:41
- P0-3 smoke OK: GET /api/backtest returns canonical keys. Proceeding to P0-2.
- Wrote docs/_ai_memory/P0_2_GAP_REPORT.md (contracts vs live payload gap report).

## 2025-12-19 03:07:20
- P0-3 smoke OK: GET /api/backtest returns canonical keys. Proceeding to P0-2.
- Wrote docs/_ai_memory/P0_2_GAP_REPORT.md (contracts vs live payload gap report).

## 2025-12-19 03:08:31
- P0-2 discovery: wrote /Users/user/cryptobot_19_clean/docs/_ai_memory/P0_2_CONTRACTS_AND_ROUTES.md (CONTRACTS headings index + repo-wide route discovery for trades/equity/metrics).

## 2025-12-19 03:11:03
- P0-2 blocker: docs/CONTRACTS.md appears empty/non-markdown (0 headings).
- Wrote docs/_ai_memory/CONTRACTS_HEALTH_REPORT.md to identify best available contract source in repo.

## 2025-12-19 03:14:58
- Restored docs/CONTRACTS.md from /Users/user/cryptobot_19_clean/docs/_ai_memory/CONTRACTS_HEALTH_REPORT.md (previous CONTRACTS.md had no headings/keywords).

## 2025-12-19 03:23:09
- Fixed docs/CONTRACTS.md: previous content was a health report; restored proper contracts from docs/CONTRACTS.md.

## 2025-12-19 03:23:39
- Fixed docs/CONTRACTS.md: previous content was a health report; restored proper contracts from docs/CONTRACTS.md.

## 2025-12-19 03:25:00
- Hard-restored docs/CONTRACTS.md from docs/_archive_cleanup_20251218_183655/dashboard_api_contract.md (avoided self-referential restore).

## 2025-12-19 03:28:31
- P0-2: generated docs/_ai_memory/ENDPOINT_CONTRACT_DIFF.md (contract endpoints vs implemented routes map).

## 2025-12-19 03:30:04
- P0-2/P0-3: extended docs/CONTRACTS.md to include Candles/Trades/Equity/Metrics/Backtest sections (previously only dashboard snapshot).
- Source: /Users/user/cryptobot_19_clean/docs/CONTRACTS_EXTRACT.md

## 2025-12-19 03:54:55
- Prepared chat transition snapshot: docs/_ai_memory/CHAT_HANDOFF.md
- Prepared bootstrap command: docs/_ai_memory/BOOTSTRAP_COMMAND.sh (copied to clipboard).

## 2025-12-19 04:11:52
- Ran bootstrap for clean chat transition: docs/_ai_memory/BOOTSTRAP_COMMAND.sh

## 2025-12-19 04:13:42
- P0-2: added missing endpoints /api/trades, /api/equity, /api/metrics (proxy from latest canonical backtest).
- P0-2: fixed /api/candles candle.time to unix epoch milliseconds.

## 2025-12-19 04:15:44
- P0-2: fixed /api/candles to return unix epoch milliseconds for candle time.
- P0-2: ensured /api/trades,/api/equity,/api/metrics exist and respond quickly (proxy from last_backtest_context).

## 2025-12-19 04:18:26
- Updated progress tracker: docs/_ai_memory/PROGRESS.md (P0-2/P0-3 percentages + blockers).
- Updated redesign timing plan: docs/REDESIGN_TIMING.md.
- Refreshed Cursor Pro+ handoff: docs/CURSOR_UI_PROMPT.md (copied to clipboard).
## 2025-12-19 04:42 — Context restored: UI Premium spec -> Cursor handoff

- UI spec parsed: NO
- Audit present: NO
- Generated: docs/CURSOR_UI_PROMPT.md (detailed Cursor task spec)

Progress (rough, %):
- Step 1 (AUDIT + MAP): 60%
- Step 2 (CURSOR HANDOFF UI/UX): 95%
- Step 3 (AI Assistant MVP): 0%
- Step 4 (ML Skeleton): 0%
- Step 5 (QA / Tighten): 0%

Next action:
- Paste docs/CURSOR_UI_PROMPT.md into Cursor and execute P0 UI tasks (100vh, drawer, right panel, mode isolation UI).

## 2025-12-19 12:34 — Consolidated review notes -> single Cursor task

Created: docs/CURSOR_REVIEW_TASK.md

процент прогресса текущего шага: 90%
процент прогресса до конца дашборда: 58%

Next:
- Apply P0 fixes from CURSOR_REVIEW_TASK.md (App CTAs/KPIs, token validity, drawer max-height CSS, TS event types, chat mode isolation).
- Re-run manual acceptance checks (no scroll, chart pinned, drawers 40vh, 10x mode switch).

## 2025-12-19 13:50 — Cursor task: Premium Dark Terminal Redesign + P0 fixes

- Created docs/CURSOR_UI_PROMPT.md with a single structured task for Cursor: premium dark terminal redesign (Backtest/Live/Test) on one layout + strict constraints (100vh/no page scroll/chart always visible/right panel fixed/bottom drawer) + mode isolation (abort + race guard) + concrete per-file fixes (App/TopBar/Sidebar/AIChatPanel/BacktestResultsPanel/Drawers/StatsTicker/index.css).


## 2025-12-19 13:52 — Cursor task prepared (premium dark terminal + mode isolation)

- Wrote docs/CURSOR_UI_PROMPT.md: premium dark terminal redesign for Backtest/Live/Test on one 100vh layout + bottom drawer + fixed right panel + token-only styling + abort/race-guard mode isolation.
- Progress: step 90%, dashboard 58%.


## 2025-12-19 13:53 — Cursor task prepared (premium dark terminal + mode isolation)

- Wrote/updated docs/CURSOR_UI_PROMPT.md for Cursor: premium dark terminal redesign for Backtest/Live/Test on one 100vh layout + bottom drawer + fixed right panel + token-only styling + abort/race-guard mode isolation.
- Progress: step 90%, dashboard 58%.


## 2025-12-19 14:00 - Cursor task ready (premium dark terminal + mode isolation)

- Updated docs/CURSOR_UI_PROMPT.md: single structured task (3 modes on one 100vh layout, fixed right panel, bottom drawer, token-only styling, abort+racesafe mode isolation).
- Progress: step 100%, dashboard 58%.


## 2025-12-19 18:43 - Cursor follow-up task (review pass)

- Generated follow-up Cursor task focusing on LiveResultsDrawer: make it a true bottom drawer that does not push the chart; remove JS height/resizing coupling; enforce CSS max-height 40vh + internal overflow; keep token-only styling.


## 2025-12-19 18:46 - Parallel plan while Cursor works: Business Logic Track

- Added docs/BUSINESS_LOGIC_NEXT.md: AI Assistant MVP (/api/assistant stub + TradingContext) and ML skeleton plan (features->scoring->UI hook) with acceptance criteria.


## 2025-12-19 18:51 - Cursor follow-up (ChartArea review)

- Added Cursor follow-up task: remove  ML context in ChartArea.tsx via minimal typed context, and ensure drawers mount as true bottom overlays so they never push the chart.


## 2025-12-19 18:54 - Business logic track started: backend audit for /api/assistant + ML skeleton

- Added docs/BUSINESS_LOGIC_AUDIT.md with repo scan: backend entrypoints, framework hints, existing /api routes, and next insertion steps.


## 2025-12-19 19:27 - Business logic: mode normalization for dashboard compatibility

- Patched backend Pydantic contracts to accept UI modes 'live/test/backtest' and normalize to 'LIVE/TEST/BACKTEST' for:
  - core/assistant/contract.py (TradingContext.mode)
  - core/ml/contract.py (MLContext.mode)
- This removes 422 validation risk when React sends lowercase mode.

## 2025-12-19 20:23 - Cursor one-shot issued (speed up)

- Replaced follow-ups with a single ONE-SHOT task: implement shared overlay bottom-drawer wrapper in ChartArea, remove Live drawer JS resizing, enforce mode isolation + chat reset/typing, and run a quick token-only styling audit.


## 2025-12-19 20:39 - Cursor follow-up: index.css mode accent + scrollbar token + no-scroll polish

- Issued Cursor follow-up task for web/dashboard-react/src/index.css: make --accent-active mode-scoped, add scrollbar hover token, remove redundant height rules, add overscroll-behavior:none, verify data-mode is applied to root.


## 2025-12-19 20:42 - Cursor follow-up: wire data-mode to root (so CSS mode tokens apply)

- index.css already has mode-scoped --accent-active and scrollbar hover tokens.
- Follow-up: ensure App/top-level wrapper sets data-mode with exact lowercase values (live/test/backtest) so mode styling actually applies.


## 2025-12-20 02:37
- Added docs/RECOVER_CURSOR_CHAT_BUGFIX.md (Cursor continuation prompt for finishing bugfixes: Pydantic field order, keyboard undefined, backtest metadata None).

## 2025-12-20 02:42
- Captured bugfix snippets into docs/BUGFIX_SNIPPETS.md (DashboardSnapshot field order, keyboard undefined, BacktestEngine.run metadata).

## 2025-12-20 02:45
- Added docs/ASSISTANT_FOOTER_RULES.md (mandatory footer: task purpose + step% + dashboard%).

## 2025-12-20 02:48
- Fixed Bug 3 SyntaxError: removed guard block injected into BacktestEngine.run() signature and re-inserted it into the function body; compileall clean.

## 2025-12-20 02:50
- Fixed Bug 3 SyntaxError: removed guard block injected into BacktestEngine.run() signature and re-inserted it into the function body; compileall clean.

## 2025-12-20 02:51
- Cleaned working tree: restored unrelated tracked edits, moved untracked scratch docs into docs/_scratch/20251220_025127, added .gitignore for .backup/docs/_scratch/docs/_ai_memory, and re-verified compile for bugfix files.

## 2025-12-20 02:53
- Started dashboard (best-effort): backend/frontend via nohup with pid/log files in .run; printed ports and tailed logs.

## 2025-12-20 02:53
- Started dashboard (best-effort): backend/frontend via nohup with pid/log files in .run; printed ports and tailed logs.

## 2025-12-20 03:12
- Backend run fix: resolved aiogram/pydantic conflict by pinning pydantic<2.10 + fastapi==0.121.3, restarted server.py with system python, captured logs in .run/backend_fix_20251220_031215.log.

## 2025-12-20 03:39
- Verified local run: checked listeners on 5173/8000, probed API (/docs), tailed logs, and opened frontend + API docs in browser.

## 2025-12-20 04:05
- Verified runtime: captured PIDs for :5173 and :8000 into .run/*.pid, probed backend paths (/docs, /openapi.json, /health, /metrics), and opened frontend + backend docs in browser.

## 2025-12-20 04:07
- Restored PATH to include system tools, verified server listeners, probed API routes with curl/python fallback, tailed logs, and opened dashboard URLs.

## 2025-12-20 04:10
- Investigated why chart didn't open: verified listeners, fetched frontend root HTML, extracted likely backend data endpoints from /openapi.json, searched frontend for API base/candles fetch, tailed frontend/backend logs.

## 2025-12-20 04:14
- Restarted dashboard without pip: killed listeners on 5173/5174/8000, started backend via uvicorn (pyenv python if available), started Vite on 5173, verified /docs and /openapi.json, tailed logs, opened browser.

## 2025-12-20 04:32
- Autogenerated planning/docs package: CONTRACT_COMPLIANCE_REPORT, CLICKMAP, VISUAL_BLOCKS, MODE_MATRIX, UX_SPEC, UX_ACCEPTANCE, REDESIGN_CHUNKS, ROUTE_INVENTORY.

## 2025-12-20 04:34
- Restarted Vite with stdin=/dev/null to avoid 'suspended (tty input)'. Generated docs/OPENAPI_SNAPSHOT.json + docs/OPENAPI_FRONTEND_MAP.md to pinpoint /api/ml/score 422 contract mismatch and list API usage.

## 2025-12-20 04:35
- Generated docs/WORKTREE_STATE.md (status + diffstat + diffs) and moved untracked docs clutter into docs/_scratch/20251220_043545 to keep repo clean; kept canonical planning docs + OpenAPI maps.

## 2025-12-20 04:45
- Stabilized repo after zsh parse glitch: snapshotted diffs to docs/_scratch/20251220_044533_stabilize_fix, restored accidental tracked edits (server/contracts/assistant/ml/backtest api), moved untracked docs clutter to scratch, updated .gitignore.

## 2025-12-20 04:46
- Verified Bug1/Bug3 fixes: compileall OK; printed DashboardSnapshot field order and BacktestEngine.run guard placement context.

## 2025-12-20 05:09
- Fixed Bug 2 (keyboard undefined): ensured keyboard=None is defined before reply_markup usage (file: core/notifications/notification_manager.py). Verified compileall for bugfix files.

## 2025-12-20 05:17
- Cleaned accidental .tmp_target from repo root after Bug2 automation run; re-verified compile for core/notifications/notification_manager.py.

## 2025-12-20 14:11
- Added remaining untracked docs: BUGFIX_SNIPPETS.md and RECOVER_CURSOR_CHAT_BUGFIX.md (kept for reference).

## 2025-12-20 14:40
- Recovered after terminal window closed: restarted backend(:8000) + frontend(:5173) via nohup with logs/pids in .run, verified listeners and opened browser.

## 2025-12-20 14:47
- Fixed backend startup (bash-safe): ensured uvicorn in .venv (fallback trusted-host), started server.py on :8000, verified /docs, tailed .run/backend.log, ignored docs/COMPLIANCE_SAMPLES/.

## 2025-12-21 02:31
- Fixed backend boot: installed requests + PyYAML + Jinja2 (was blocking Jinja2Templates), restarted server.py on :8000, verified /docs. Log: .run/fix_backend_jinja2_20251221_023151.log

## 2025-12-21 02:35
- Fixed autoscan script (SyntaxError), generated real autoscan outputs at docs/COMPLIANCE_SAMPLES/20251221_023541 (probe_index + summary + raw bodies). Next: fix FAIL endpoints to match docs/CONTRACTS.md starting with /api/ml/score.

## 2025-12-21 02:50
- Added local assistant execution rules: docs/ASSISTANT_OPERATOR_RULES.md (one-command, safe ops, clean EOF, no hidden UTF, bash -lc wrapper, end-of-command TASK/STEP/DASHBOARD lines).

## 2025-12-21 03:00
- Added stub TEST endpoints in server.py: /api/trades,/api/equity,/api/metrics (no 404). Restarted backend and confirmed via autoscan: docs/COMPLIANCE_SAMPLES/20251221_030039/SUMMARY.md. Backup: .backup/20251221_030037_stub_test_endpoints

## 2025-12-21 05:40
- Pinned latest autoscan in docs/AUTOSCAN.md -> docs/COMPLIANCE_SAMPLES/20251221_030039 (SUMMARY.md + probe_index.json)

## 2025-12-21 05:47
- Added scripts/verify.sh to run compile/lint/type/test (if available) + API smoke + autoscan pin.
