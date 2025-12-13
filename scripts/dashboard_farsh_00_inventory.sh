#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ts="$(date "+%Y%m%d_%H%M%S")"
out="reports/dashboard_farsh_inventory_${ts}.md"
mkdir -p reports

have_rg=0
command -v rg >/dev/null 2>&1 && have_rg=1

echo "WILL WRITE: $out"

{
  echo "# DASHBOARD FARSH — INVENTORY"
  echo ""
  echo "Generated: $(date -Iseconds)"
  echo "Project: $PROJECT_ROOT"
  echo ""

  echo "## Versions"
  echo ""
  echo "- bash: $(bash --version | head -n 1 || true)"
  echo "- node: $(node -v 2>/dev/null || echo 'N/A')"
  echo "- npm:  $(npm -v 2>/dev/null || echo 'N/A')"
  echo "- python: $(python3 -V 2>/dev/null || echo 'N/A')"
  echo ""

  echo "## Frontend root check"
  echo ""
  if [ -d "web/dashboard-react" ]; then
    echo "- web/dashboard-react: OK"
  else
    echo "- web/dashboard-react: MISSING"
  fi
  echo ""

  echo "## Frontend routing (react-router hints)"
  echo ""
  if [ -d "web/dashboard-react/src" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "react-router|createBrowserRouter|BrowserRouter|Routes\\b|Route\\b|useNavigate|useLocation" web/dashboard-react/src || true
    else
      grep -RIn "react-router\|createBrowserRouter\|BrowserRouter\|Routes\|Route\|useNavigate\|useLocation" web/dashboard-react/src || true
    fi
  fi
  echo ""

  echo "## Backtest UI entrypoints"
  echo ""
  if [ -d "web/dashboard-react/src" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "BacktestConfigPanel|mode === 'backtest'|\\bbacktest\\b" web/dashboard-react/src || true
    else
      grep -RIn "BacktestConfigPanel\|mode === 'backtest'\|backtest" web/dashboard-react/src || true
    fi
  fi
  echo ""

  echo "## Frontend API calls (/api + fetch/axios)"
  echo ""
  if [ -d "web/dashboard-react/src" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "fetch\\(|axios\\b|/api/" web/dashboard-react/src || true
    else
      grep -RIn "fetch(\|axios\|/api/" web/dashboard-react/src || true
    fi
  fi
  echo ""

  echo "## Backend routes (server.py) — focus around backtest"
  echo ""
  if [ -f "server.py" ]; then
    python3 - << 'PY'
import pathlib
p = pathlib.Path("server.py")
lines = p.read_text(errors="ignore").splitlines()
def show(a,b):
    a=max(1,a); b=min(len(lines),b)
    print(f"### server.py:{a}-{b}")
    for i in range(a,b+1):
        print(f"{i:>5}: {lines[i-1]}")
    print("")
# show key areas where your report already hinted (~480 and ~547)
show(430, 620)
PY
  else
    echo "server.py: MISSING"
  fi
  echo ""

  echo "## Duplicate check: exact /api/backtest/run occurrences"
  echo ""
  if [ -f "server.py" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "@app\\.post\\(\"/api/backtest/run\"\\)" server.py || true
    else
      grep -n "@app.post(\"/api/backtest/run\")" server.py || true
    fi
  fi
  echo ""

  echo "## Sanity compile (python)"
  echo ""
  if command -v python3 >/dev/null 2>&1; then
    python3 -m compileall server.py core >/dev/null 2>&1 && echo "OK: python compileall" || echo "FAIL: python compileall"
  fi
  echo ""

} > "$out"

echo "WROTE: $out"
echo ""
sed -n "1,220p" "$out"
