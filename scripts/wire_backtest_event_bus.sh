#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

PANEL="$PROJECT_ROOT/web/dashboard-react/src/components/BacktestConfigPanel.tsx"
TOPBAR="$PROJECT_ROOT/web/dashboard-react/src/components/TopBar.tsx"

if [ ! -f "$PANEL" ]; then
  echo "ERROR: not found: $PANEL"
  exit 1
fi

if [ ! -f "$TOPBAR" ]; then
  echo "ERROR: not found: $TOPBAR"
  exit 1
fi

python3 - "$PANEL" "$TOPBAR" << 'PY'
import sys, pathlib, re

panel_path = pathlib.Path(sys.argv[1])
topbar_path = pathlib.Path(sys.argv[2])

panel = panel_path.read_text(encoding="utf-8", errors="ignore")
topbar = topbar_path.read_text(encoding="utf-8", errors="ignore")

changed = False

# -----------------------
# BacktestConfigPanel: dispatch event after successful setResult(data)
# -----------------------
if "backtest:updated" not in panel:
    m = re.search(r"\bsetResult\s*\(\s*data\s*\)\s*;\s*", panel)
    if m:
        insert = 'setResult(data);\n      window.dispatchEvent(new CustomEvent("backtest:updated", { detail: data }));\n'
        panel = panel[:m.start()] + insert + panel[m.end():]
        changed = True
        print("INFO: BacktestConfigPanel: added backtest:updated dispatch")
    else:
        print("WARN: BacktestConfigPanel: could not find setResult(data); to patch")
else:
    print("INFO: BacktestConfigPanel: already has backtest:updated")

# -----------------------
# TopBar: listen to event and update backtestKpiLive
# -----------------------
if "backtest:updated" not in topbar:
    if "setBacktestKpiLive" not in topbar or "function num(" not in topbar:
        print("WARN: TopBar: expected Step5 wiring not found; skipping event listener patch")
    else:
        # Insert a new useEffect after the existing fetchBacktestKpi effect.
        pattern = r"useEffect\(\(\)\s*=>\s*\{\s*\n\s*fetchBacktestKpi\(apiBase\)\.then\(setBacktestKpiLive\);\s*\n\s*\},\s*\[apiBase\]\s*\);\s*"
        m = re.search(pattern, topbar, flags=re.MULTILINE)
        if m:
            effect2 = """
  useEffect(() => {
    const handler = (e: any) => {
      const data = e?.detail || {};
      const src = (data && (data.kpi || data.summary || data)) || {};
      setBacktestKpiLive({
        totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
        profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
        maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
      });
    };

    window.addEventListener("backtest:updated", handler as any);
    return () => window.removeEventListener("backtest:updated", handler as any);
  }, []);
"""
            topbar = topbar[:m.end()] + effect2 + topbar[m.end():]
            changed = True
            print("INFO: TopBar: added backtest:updated listener")
        else:
            print("WARN: TopBar: could not locate fetchBacktestKpi useEffect block; skipping")
else:
    print("INFO: TopBar: already has backtest:updated")

if changed:
    panel_path.write_text(panel, encoding="utf-8")
    topbar_path.write_text(topbar, encoding="utf-8")
    print("DONE: patches applied")
else:
    print("DONE: no changes needed")
PY

exit 0
