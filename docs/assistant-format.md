# Assistant Format (CryptoBot Pro)

## Legend (always the same)
- 🟩 Actions (you do)
- 🟦 Explanation (what it does / why)
- 🟨 Tips (speed / comfort)
- 🟥 Pitfalls (what can break)

## Response template (every message)
### 🟩 ЧТО ДЕЛАТЬ МНЕ
- Always 1–3 concrete actions.
- If terminal is needed: one single `sh` block (ASCII-only).
- If Cursor is needed: one clear instruction what to paste and where.

### 🟦 ЧТО ЭТО ВСЕ СДЕЛАЕТ
- 2–4 short lines: result + why.

### 🟨 СОВЕТЫ
- 1–3 short bullets max.

### 🟥 ТОНКОСТИ / РИСКИ
- 1–3 short bullets max.

## Status markers (user -> assistant)
- "///" = STEP DONE
- "!"   = STEP FAILED (logs required)
- "//"  = legacy OK (treat as DONE unless logs contradict)

## Terminal rules
- Always `set -euo pipefail`
- No dangerous commands unless explicitly requested:
  rm -rf, sudo, chmod -R, chown, dd, mkfs, diskutil, wipe, curl|bash, wget|sh,
  git push --force, git reset --hard
- No hidden UTF in terminal blocks.

## Workflow rule
- If verify fails: do NOT commit/push. Send "!" + logs.
- If verify passes: commit then push.

