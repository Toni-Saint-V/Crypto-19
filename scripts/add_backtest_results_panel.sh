#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

COMP_DIR="$PROJECT_ROOT/web/dashboard-react/src/components"
CHART="$COMP_DIR/ChartArea.tsx"
PANEL="$COMP_DIR/BacktestResultsPanel.tsx"

if [ ! -f "$CHART" ]; then
  echo "ERROR: not found: $CHART"
  exit 1
fi

if [ ! -f "$PANEL" ]; then
  cat > "$PANEL" << 'TSX'
import { useEffect, useMemo, useState } from "react";

type AnyObj = Record<string, any>;

function num(v: any, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function pickKpi(data: AnyObj) {
  const src = (data && (data.kpi || data.summary || data)) || {};
  return {
    totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
    profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
    maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
  };
}

export default function BacktestResultsPanel() {
  const [data, setData] = useState<AnyObj | null>(null);

  useEffect(() => {
    const handler = (e: any) => setData(e?.detail || null);
    window.addEventListener("backtest:updated", handler as any);
    return () => window.removeEventListener("backtest:updated", handler as any);
  }, []);

  const kpi = useMemo(() => pickKpi(data || {}), [data]);

  const pretty = useMemo(() => {
    try {
      return data ? JSON.stringify(data, null, 2) : "";
    } catch {
      return "";
    }
  }, [data]);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-sm font-semibold">Backtest result</div>

      {!data ? (
        <div className="mt-2 text-xs text-white/60">
          No results yet. Run a backtest to see output here.
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] text-white/60">Total Trades</div>
              <div className="text-sm font-semibold">{kpi.totalTrades}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] text-white/60">Profit Factor</div>
              <div className="text-sm font-semibold">{kpi.profitFactor.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] text-white/60">Max Drawdown</div>
              <div className="text-sm font-semibold">{kpi.maxDrawdown.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[11px] text-white/60">Raw payload (first 160 lines)</div>
            <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[11px] leading-4">
{pretty.split("\n").slice(0, 160).join("\n")}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
TSX
  echo "INFO: created $PANEL"
else
  echo "INFO: exists $PANEL"
fi

python3 - "$CHART" << 'PY'
import sys, pathlib, re

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")

if "BacktestResultsPanel" in s:
    print("INFO: ChartArea already wired")
    sys.exit(0)

# Add import near other imports
lines = s.splitlines()
import_line = 'import BacktestResultsPanel from "./BacktestResultsPanel";'

# Find last import
last_import = -1
for i, line in enumerate(lines):
    if line.startswith("import "):
        last_import = i

if last_import >= 0:
    lines.insert(last_import + 1, import_line)
else:
    lines.insert(0, import_line)

s2 = "\n".join(lines) + "\n"

# Replace the backtest panel render with panel + results
pat = r"\{\s*mode\s*===\s*'backtest'\s*&&\s*<BacktestConfigPanel\s*/>\s*\}"
m = re.search(pat, s2)
if not m:
    pat2 = r"\{\s*mode\s*===\s*\"backtest\"\s*&&\s*<BacktestConfigPanel\s*/>\s*\}"
    m = re.search(pat2, s2)

if m:
    repl = "{mode === 'backtest' && (<><BacktestConfigPanel /><BacktestResultsPanel /></>)}"
    s2 = s2[:m.start()] + repl + s2[m.end():]
    p.write_text(s2, encoding="utf-8")
    print("INFO: patched ChartArea.tsx to include BacktestResultsPanel")
else:
    # Non-fatal: maybe ChartArea structure changed
    p.write_text(s2, encoding="utf-8")
    print("WARN: could not find BacktestConfigPanel render block; only added import")
PY

echo "DONE: backtest results panel wired"
exit 0
