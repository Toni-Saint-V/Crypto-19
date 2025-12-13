#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

FILE="$PROJECT_ROOT/web/dashboard-react/src/components/TopBar.tsx"
[ -f "$FILE" ] || { echo "ERROR: not found: $FILE"; exit 1; }

python3 - "$FILE" << 'PY'
import sys, pathlib, re

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")

if "VITE_API_BASE" in s and "fetchBacktestKpi" in s:
    print("INFO: TopBar.tsx already wired")
    sys.exit(0)

# Ensure React hooks import
if re.search(r'import\s+React', s) and "useEffect" in s:
    pass

# Patch strategy: insert helper + hook near top, then replace backtestKPI usage.
lines = s.splitlines()

# Find import line for React
imp_idx = None
for i, line in enumerate(lines):
    if line.startswith("import") and "react" in line.lower():
        imp_idx = i
        break

# If no explicit react import, still proceed, but we need hooks import somewhere.
# Look for: import { ... } from "react";
hook_import_idx = None
for i, line in enumerate(lines):
    if re.match(r'import\s*\{.*\}\s*from\s*[\'"]react[\'"]\s*;?\s*$', line):
        hook_import_idx = i
        break

if hook_import_idx is not None:
    if "useEffect" not in lines[hook_import_idx] or "useState" not in lines[hook_import_idx]:
        # add missing hooks
        inside = re.search(r"\{(.*)\}", lines[hook_import_idx]).group(1)
        items = [x.strip() for x in inside.split(",") if x.strip()]
        for need in ["useEffect", "useState"]:
            if need not in items:
                items.append(need)
        lines[hook_import_idx] = re.sub(r"\{.*\}", "{ " + ", ".join(items) + " }", lines[hook_import_idx])
else:
    # Insert hook import after first import or at top
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1
    lines.insert(insert_at, 'import { useEffect, useState } from "react";')

# Insert helper after imports block
last_import = 0
for i, line in enumerate(lines):
    if line.startswith("import "):
        last_import = i
insert_at = last_import + 1

helper = [
    "",
    "type BacktestKpi = {",
    "  totalTrades: number;",
    "  profitFactor: number;",
    "  maxDrawdown: number;",
    "};",
    "",
    "function num(v: any, d: number): number {",
    "  const n = Number(v);",
    "  return Number.isFinite(n) ? n : d;",
    "}",
    "",
    "async function fetchBacktestKpi(apiBase: string): Promise<BacktestKpi> {",
    "  try {",
    "    const r = await fetch(`${apiBase}/api/backtest`);",
    "    const data = await r.json().catch(() => ({}));",
    "    const src = (data && (data.kpi || data.summary || data)) || {};",
    "    return {",
    "      totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),",
    "      profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),",
    "      maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),",
    "    };",
    "  } catch {",
    "    return { totalTrades: 0, profitFactor: 0, maxDrawdown: 0 };",
    "  }",
    "}",
    "",
]
lines[insert_at:insert_at] = helper

s2 = "\n".join(lines) + "\n"

# Replace static backtestKPI const if present: const backtestKPI: ... = { ... }
s2 = re.sub(
    r"const\s+backtestKPI\s*:\s*[^=]*=\s*\{[\s\S]*?\}\s*;",
    "const backtestKPI: BacktestKpi = { totalTrades: 0, profitFactor: 0, maxDrawdown: 0 };",
    s2,
    flags=re.MULTILINE,
)

# Inject hook inside TopBar component body: find apiBase and mode usage; add state+effect once.
if "const apiBase" not in s2:
    # Insert apiBase in component if not exist
    s2 = s2.replace(
        "export default function TopBar(",
        'export default function TopBar(',
    )

# Try to find start of function body: "export default function TopBar(...){"
m = re.search(r"export\s+default\s+function\s+TopBar\s*\([^\)]*\)\s*\{", s2)
if m:
    insert_pos = m.end()
    inject = """
  const apiBase = (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000";
  const [backtestKpiLive, setBacktestKpiLive] = useState<BacktestKpi>({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });

  useEffect(() => {
    fetchBacktestKpi(apiBase).then(setBacktestKpiLive);
  }, [apiBase]);
"""
    # Only inject if not already there
    if "setBacktestKpiLive" not in s2:
        s2 = s2[:insert_pos] + inject + s2[insert_pos:]
else:
    print("WARN: could not locate TopBar function for injection")

# Replace usage: const kpi = isBacktest ? backtestKPI : liveKPI;
s2 = s2.replace(
    "const kpi = isBacktest ? backtestKPI : liveKPI;",
    "const kpi = isBacktest ? backtestKpiLive : liveKPI;",
)

p.write_text(s2, encoding="utf-8")
print("INFO: patched TopBar.tsx to load backtest KPI from /api/backtest")
PY

echo "DONE: wired TopBar backtest KPI"
