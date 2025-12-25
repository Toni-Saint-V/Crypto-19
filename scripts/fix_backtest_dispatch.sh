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
    print("INFO: already dispatching backtest:updated")
    sys.exit(0)

# 1) Best: after first setResult(VAR);
m = re.search(r"\bsetResult\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;", s)
if m:
    var = m.group(1)
    inject = f'setResult({var});\n      window.dispatchEvent(new CustomEvent("backtest:updated", {{ detail: {var} }}));'
    s2 = s[:m.start()] + inject + s[m.end():]
    p.write_text(s2, encoding="utf-8")
    print(f"INFO: inserted dispatch after setResult({var})")
    sys.exit(0)

# 2) Fallback: after first "const VAR = await <something>.json("
m = re.search(r"\bconst\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*await\s+[A-Za-z0-9_$.()]+\s*\.json\s*\(\s*\)\s*;", s)
if m:
    var = m.group(1)
    insert_at = m.end()
    inject = f'\n      window.dispatchEvent(new CustomEvent("backtest:updated", {{ detail: {var} }}));'
    s2 = s[:insert_at] + inject + s[insert_at:]
    p.write_text(s2, encoding="utf-8")
    print(f"INFO: inserted dispatch after json() into var {var}")
    sys.exit(0)

print("WARN: could not find setResult(...) or const X = await ...json(); no changes made")
sys.exit(0)
PY

exit 0
