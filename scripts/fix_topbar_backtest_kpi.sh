#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

F="$PROJECT_ROOT/web/dashboard-react/src/components/TopBar.tsx"
if [ ! -f "$F" ]; then
  echo "ERROR: not found: $F"
  exit 1
fi

python3 - "$F" << 'PY'
import sys, pathlib, re

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")

changed = False

# 1) Fix UI: use live state (kpi) instead of constant backtestKPI inside BACKTEST block
if "backtestKPI." in s:
    s2 = s.replace("backtestKPI.totalTrades", "kpi.totalTrades") \
          .replace("backtestKPI.profitFactor", "kpi.profitFactor") \
          .replace("backtestKPI.maxDrawdown", "kpi.maxDrawdown")
    if s2 != s:
        s = s2
        changed = True

# 2) Add polling + dispatch only once
marker = "/* BACKTEST_POLL */"
if marker not in s:
    # Insert after the existing useEffect that registers window event listener (we saw it in trace)
    # We locate the first "useEffect(() => {" that contains addEventListener("backtest:updated"
    m = re.search(
        r"useEffect\s*\(\s*\(\)\s*=>\s*\{.*?addEventListener\(\s*['\"]backtest:updated['\"].*?\}\s*,\s*\[\s*\]\s*\)\s*;",
        s,
        flags=re.DOTALL
    )
    poll_block = """
  %s
  useEffect(() => {
    if (mode !== 'backtest') return;

    let cancelled = false;

    const tick = async () => {
      const data = await fetchBacktestKpi(apiBase).catch(() => ({
        totalTrades: 0,
        profitFactor: 0,
        maxDrawdown: 0,
      }));

      if (cancelled) return;

      setBacktestKpiLive(data);
      window.dispatchEvent(new CustomEvent("backtest:updated", { detail: data }));
    };

    tick();
    const id = window.setInterval(tick, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [mode, apiBase]);
""" % marker

    if m:
        insert_at = m.end()
        s = s[:insert_at] + poll_block + s[insert_at:]
        changed = True
    else:
        # Fallback: insert before "return (" of component
        m2 = re.search(r"\n\s*return\s*\(", s)
        if m2:
            insert_at = m2.start()
            s = s[:insert_at] + "\n" + poll_block + s[insert_at:]
            changed = True

if changed:
    p.write_text(s, encoding="utf-8")
    print("OK: patched TopBar.tsx")
else:
    print("INFO: no changes needed (already patched?)")
PY

echo ""
echo "SNIPPET (BACKTEST metrics lines):"
grep -n "MetricCard label=\"Total Trades\"\\|Profit Factor\\|Max Drawdown\\|BACKTEST_POLL\\|setInterval\\|backtest:updated" "$F" 2>/dev/null | sed -n '1,80p' || true

exit 0
