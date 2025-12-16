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

