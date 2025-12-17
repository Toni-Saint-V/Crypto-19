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

