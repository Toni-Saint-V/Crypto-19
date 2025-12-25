#!/usr/bin/env bash
set -euo pipefail
f="docs/DASHBOARD_CHECKLIST.md"
python - <<'PY'
import re, pathlib
p = pathlib.Path("docs/DASHBOARD_CHECKLIST.md")
s = p.read_text(encoding="utf-8").splitlines()
done = sum(1 for l in s if re.match(r"^\s*-\s*\[x\]\s+", l))
todo = sum(1 for l in s if re.match(r"^\s*-\s*\[\s\]\s+", l))
total = done + todo
pct = int(round((done / total) * 100)) if total else 0
print(f"done={done} total={total} percent={pct}%")
PY
