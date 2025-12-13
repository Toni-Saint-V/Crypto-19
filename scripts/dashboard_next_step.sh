#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

latest="$(ls -1t reports/dashboard_action_plan_*.md 2>/dev/null | head -n 1 || true)"
out="reports/dashboard_next_step.md"

if [ -z "$latest" ]; then
  {
    echo "# DASHBOARD NEXT STEP (EXTRACT)"
    echo ""
    echo "No dashboard_action_plan report found."
    echo "Run: ./scripts/dashboard_action_plan.sh"
  } >"$out"
  echo "WROTE: $out"
  exit 0
fi

python3 - "$latest" "$out" << 'PY'
import sys, pathlib, datetime

src = pathlib.Path(sys.argv[1])
dst = pathlib.Path(sys.argv[2])

wanted = {
    "## Frontend routing hints",
    "## Frontend API calls (fetch/axios/websocket + /api usage)",
    "## Frontend backtest/date/filter keywords (where to fix the missing dates)",
    "## Backend routes (server.py)",
    "## Backend duplicate check (same path declared multiple times)",
}

lines = src.read_text(errors="ignore").splitlines()

out_lines = []
out_lines.append("# DASHBOARD NEXT STEP (EXTRACT)")
out_lines.append("")
out_lines.append(f"Source: {src}")
out_lines.append(f"Generated: {datetime.datetime.now().isoformat(timespec='seconds')}")
out_lines.append("")

sec = ""
for line in lines:
    if line.startswith("## "):
        sec = line.strip()
    if sec in wanted:
        out_lines.append(line)

out_lines.append("")
out_lines.append("## WHAT I WILL CHANGE NEXT")
out_lines.append("")
out_lines.append("- Open router file(s) shown above and map pages 1:1.")
out_lines.append("- Open backtest UI file(s) shown above and add date range inputs + wire to backend endpoint.")
out_lines.append("- Remove/merge duplicate backend route declaration for /api/backtest/run (if confirmed).")

dst.write_text("\n".join(out_lines) + "\n", encoding="utf-8")

print(f"WROTE: {dst}")
print("")
print("\n".join(out_lines[:260]))
PY
