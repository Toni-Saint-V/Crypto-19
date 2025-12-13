#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ts="$(date "+%Y%m%d_%H%M%S")"
out="$PROJECT_ROOT/reports/dashboard_action_plan_${ts}.md"

have_rg=0
command -v rg >/dev/null 2>&1 && have_rg=1

scan() {
  title="$1"
  shift
  echo ""
  echo "## ${title}"
  echo ""
  if [ "$have_rg" -eq 1 ]; then
    rg -n "$@" 2>/dev/null || true
  else
    grep -RIn "$1" "${@:2}" 2>/dev/null || true
  fi
}

{
  echo "# DASHBOARD ACTION PLAN (FACTS FROM CODE)"
  echo ""
  echo "Generated: $(date -Iseconds)"
  echo ""

  echo "## Frontend root"
  if [ -d "$PROJECT_ROOT/web/dashboard-react" ]; then
    echo "- Path: web/dashboard-react"
  else
    echo "- Path: web/dashboard-react (NOT FOUND)"
  fi
  echo ""

  echo "## Frontend files (src)"
  if [ -d "$PROJECT_ROOT/web/dashboard-react/src" ]; then
    (cd "$PROJECT_ROOT/web/dashboard-react" && find src -maxdepth 3 -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | sort) | sed -n "1,220p"
  else
    echo "web/dashboard-react/src not found"
  fi
  echo ""

  echo "## Frontend routing hints"
  if [ -d "$PROJECT_ROOT/web/dashboard-react/src" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "createBrowserRouter|BrowserRouter|Routes\\b|Route\\b|useRoutes\\b|react-router" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,260p" || true
    else
      grep -RIn "BrowserRouter" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,260p" || true
    fi
  fi
  echo ""

  echo "## Frontend API calls (fetch/axios/websocket + /api usage)"
  if [ -d "$PROJECT_ROOT/web/dashboard-react/src" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "fetch\\(|axios\\.|/api/|openapi\\.json|ws://|wss://|WebSocket\\b|localhost:8000|127\\.0\\.0\\.1:8000" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,340p" || true
    else
      grep -RIn "/api/" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,340p" || true
    fi
  fi
  echo ""

  echo "## Frontend backtest/date/filter keywords (where to fix the missing dates)"
  if [ -d "$PROJECT_ROOT/web/dashboard-react/src" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "backtest|Backtest|date|Date|range|Range|filter|Filter|calendar|Calendar|startDate|endDate|from|to" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,360p" || true
    else
      grep -RIn "backtest" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,360p" || true
    fi
  fi
  echo ""

  echo "## Backend routes (server.py)"
  if [ -f "$PROJECT_ROOT/server.py" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "@app\\.(get|post|put|delete)\\(\"|@app\\.websocket\\(\"|add_api_route\\(" "$PROJECT_ROOT/server.py" 2>/dev/null || true
    else
      grep -nE "@app\\.(get|post|put|delete)\\(\"|@app\\.websocket\\(\"|add_api_route\\(" "$PROJECT_ROOT/server.py" 2>/dev/null || true
    fi
  else
    echo "server.py not found"
  fi
  echo ""

  echo "## Backend duplicate check (same path declared multiple times)"
  if [ -f "$PROJECT_ROOT/server.py" ]; then
    if [ "$have_rg" -eq 1 ]; then
      rg -n "@app\\.post\\(\"/api/backtest/run\"" "$PROJECT_ROOT/server.py" 2>/dev/null || true
    else
      grep -n "@app.post(\"/api/backtest/run\"" "$PROJECT_ROOT/server.py" 2>/dev/null || true
    fi
  fi
  echo ""

  echo "## What to do next (generated)"
  echo ""
  echo "- Open this report and I will pick конкретные файлы/строки для правок UI и API (без догадок)."
  echo "- If routing is unclear, we will start from the Router file and map pages."
  echo "- If backtest UI exists, we will add date range inputs and wire them to /api/backtest (or /api/backtest/run params)."
} >"$out"

echo "WROTE: $out"
