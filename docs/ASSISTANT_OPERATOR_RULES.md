# Assistant Operator Rules (local)

Hard format:
- One terminal command only per task.
- Copy -> paste -> run = task done (minimum user actions).

Safety:
- No sudo.
- No rm -rf.
- No destructive chmod/chown.
- No curl | sh.
- Point edits only, with backup when changing files.

Shell hygiene:
- Prefer: bash -lc '...' wrapper (avoid zsh parse errors).
- set -euo pipefail.
- No dangerous line continuations.
- No hidden UTF characters.

Heredoc rules:
- Clean EOF.
- No extra lines after EOF.

Output requirement:
- At the end of the command output:
  TASK: <what we did>
  STEP_PROGRESS: <percent>
  DASHBOARD_PROGRESS: <percent>
