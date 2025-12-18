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
