#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

PANEL="$PROJECT_ROOT/web/dashboard-react/src/components/BacktestConfigPanel.tsx"
if [ ! -f "$PANEL" ]; then
  echo "ERROR: not found: $PANEL"
  exit 1
fi

python3 - "$PANEL" << 'PY'
import sys, pathlib, re

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")

if "backtest:updated" in s:
    print("INFO: already has backtest:updated dispatch")
    sys.exit(0)

# Find the first occurrence of the endpoint usage.
idx = s.find("/api/backtest/run")
if idx < 0:
    idx = s.find("api/backtest/run")
if idx < 0:
    print("WARN: cannot find api/backtest/run in BacktestConfigPanel.tsx; no changes made")
    sys.exit(0)

# Work on a window around the match to locate best anchor.
start = max(0, idx - 3000)
end = min(len(s), idx + 6000)
win = s[start:end]

# Helper to insert after a regex match within the window.
def insert_after(match_span, injection):
    a, b = match_span
    global win
    win = win[:b] + injection + win[b:]

# 1) Best: after "const X = await ....json();"
m = re.search(r"^(\s*)(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*await\s+.*?\.json\s*\(\s*\)\s*;\s*$",
              win, flags=re.MULTILINE)
if m:
    indent = m.group(1)
    var = m.group(2)
    inj = f"\n{indent}window.dispatchEvent(new CustomEvent(\"backtest:updated\", {{ detail: {var} }}));"
    insert_after(m.span(), inj)
    out = s[:start] + win + s[end:]
    p.write_text(out, encoding="utf-8")
    print(f"INFO: inserted dispatch after json() var={var}")
    sys.exit(0)

# 2) Next best: after any set*Result( VAR ); near the window
m = re.search(r"^(\s*)(set[A-Za-z0-9_]*Result)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;\s*$",
              win, flags=re.MULTILINE)
if m:
    indent = m.group(1)
    var = m.group(3)
    inj = f"\n{indent}window.dispatchEvent(new CustomEvent(\"backtest:updated\", {{ detail: {var} }}));"
    insert_after(m.span(), inj)
    out = s[:start] + win + s[end:]
    p.write_text(out, encoding="utf-8")
    print(f"INFO: inserted dispatch after {m.group(2)}({var})")
    sys.exit(0)

# 3) Fallback: after the fetch line that contains backtest/run
m = re.search(r"^(\s*).*(fetch\s*\(.*backtest\/run.*)\s*$", win, flags=re.MULTILINE)
if m:
    indent = m.group(1)
    inj = f"\n{indent}window.dispatchEvent(new CustomEvent(\"backtest:updated\", {{ detail: {{ ok: true }} }}));"
    insert_after(m.span(), inj)
    out = s[:start] + win + s[end:]
    p.write_text(out, encoding="utf-8")
    print("INFO: inserted fallback dispatch after fetch(backtest/run)")
    sys.exit(0)

print("WARN: could not find a safe anchor inside window; no changes made")
sys.exit(0)
PY

echo ""
echo "SNIPPET:"
python3 - "$PANEL" << 'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()
hits = [i for i,ln in enumerate(lines,1) if ("api/backtest/run" in ln) or ("backtest:updated" in ln)]
for i in hits[:60]:
    a = max(1, i-3)
    b = min(len(lines), i+4)
    print(f"\n--- {p} lines {a}-{b} ---")
    for j in range(a,b+1):
        print(f"{j:>5}: {lines[j-1]}")
PY

exit 0
