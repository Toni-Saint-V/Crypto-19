#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ts="$(date "+%Y%m%d_%H%M%S")"
out="$PROJECT_ROOT/reports/dashboard_state_${ts}.md"

{
  echo "# DASHBOARD STATE REPORT"
  echo ""
  echo "Timestamp: $(date -Iseconds)"
  echo ""
  echo "## TL;DR (FACTS)"
  if [ -d "$PROJECT_ROOT/web/dashboard-react" ]; then
    echo "- Frontend: web/dashboard-react (Vite/React)"
  else
    echo "- Frontend: web/dashboard-react NOT FOUND"
  fi
  if [ -f "$PROJECT_ROOT/server.py" ]; then
    echo "- Backend: server.py (Python)"
  else
    echo "- Backend: server.py NOT FOUND"
  fi
  echo ""

  echo "## GIT"
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo n/a)"
    echo "- Last commit: $(git log -1 --oneline 2>/dev/null || echo n/a)"
    echo ""
    echo "### Status"
    git status --porcelain || true
  else
    echo "Not a git repo."
  fi
  echo ""

  echo "## PROCESSES / PORTS"
  echo "### :8000"
  lsof -nP -iTCP:8000 -sTCP:LISTEN 2>/dev/null || echo "no listener on :8000"
  echo ""
  echo "### :5173"
  lsof -nP -iTCP:5173 -sTCP:LISTEN 2>/dev/null || echo "no listener on :5173"
  echo ""

  echo "## FRONTEND"
  echo "### package.json (name + scripts)"
  if [ -f "$PROJECT_ROOT/web/dashboard-react/package.json" ]; then
    node -p "const p=require(./web/dashboard-react/package.json); ({name:p.name, scripts:p.scripts})" 2>/dev/null || true
  else
    echo "web/dashboard-react/package.json not found"
  fi
  echo ""
  echo "### Framework check"
  if [ -f "$PROJECT_ROOT/web/dashboard-react/angular.json" ] || [ -f "$PROJECT_ROOT/angular.json" ]; then
    echo "Angular artifacts found (unexpected vs Vite logs) -> verify."
  else
    echo "No angular.json detected (consistent with Vite/React)."
  fi
  echo ""
  echo "### Key files"
  ls -la "$PROJECT_ROOT/web/dashboard-react" 2>/dev/null | sed -n "1,120p" || true
  echo ""
  echo "### API calls (quick scan)"
  if command -v rg >/dev/null 2>&1; then
    rg -n "fetch\\(|axios\\.|/api|VITE_|localhost:8000|8000" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,220p" || true
  else
    grep -RIn "fetch(" "$PROJECT_ROOT/web/dashboard-react/src" 2>/dev/null | sed -n "1,220p" || true
  fi
  echo ""

  echo "## BACKEND (server.py)"
  if [ -f "$PROJECT_ROOT/server.py" ]; then
    echo "### Backend framework hints"
    if command -v rg >/dev/null 2>&1; then
      rg -n "FastAPI|Flask|Starlette|Sanic|uvicorn|@app\\.|add_api_route|APIRouter|Blueprint" "$PROJECT_ROOT/server.py" 2>/dev/null | sed -n "1,220p" || true
    else
      grep -nE "FastAPI|Flask|Starlette|uvicorn|@app\\.|add_api_route" "$PROJECT_ROOT/server.py" 2>/dev/null | sed -n "1,220p" || true
    fi
    echo ""
    echo "### Routes (best-effort scan)"
    if command -v rg >/dev/null 2>&1; then
      rg -n "@app\\.(get|post|put|delete)|add_api_route\\(" "$PROJECT_ROOT/server.py" 2>/dev/null | sed -n "1,260p" || true
    else
      grep -nE "@app\\.(get|post|put|delete)|add_api_route\\(" "$PROJECT_ROOT/server.py" 2>/dev/null | sed -n "1,260p" || true
    fi
  else
    echo "server.py not found"
  fi
  echo ""

  echo "## LOGS (last 120 lines)"
  echo "### logs/backend_dev.log"
  tail -n 120 "$PROJECT_ROOT/logs/backend_dev.log" 2>/dev/null || echo "no logs/backend_dev.log"
  echo ""
  echo "### logs/vite_dev.log"
  tail -n 120 "$PROJECT_ROOT/logs/vite_dev.log" 2>/dev/null || echo "no logs/vite_dev.log"

  echo ""
  echo "## NOTES"
  echo "- If you run grep manually in zsh with pattern containing ERR!, use single quotes or disable history expansion."
  echo "  Example safe: grep -nE 'ERROR|ERR!|TypeError' file.log"
} >"$out"

echo "WROTE: $out"
