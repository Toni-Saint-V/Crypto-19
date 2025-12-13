#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ts="$(date "+%Y%m%d_%H%M%S")"
report="reports/dashboard_audit_${ts}.txt"

have_rg=0
command -v rg >/dev/null 2>&1 && have_rg=1

say() { printf "%s\n" "$*"; }
hr() { say ""; say "--------------------------------------------------------------------------------"; }
sec() { hr; say "## $1"; }

run_cmd() {
  local title="$1"; shift
  sec "$title"
  say "\$ $*"
  ( "$@" ) 2>&1 || true
}

search() {
  local title="$1"; shift
  local pattern="$1"; shift || true
  sec "$title"
  if [ "$have_rg" -eq 1 ]; then
    rg -n -S --hidden --follow --glob '!.git/**' --glob '!**/node_modules/**' --glob '!**/.venv/**' --glob '!**/venv/**' --glob '!**/dist/**' --glob '!**/build/**' "$pattern" . 2>&1 || true
  else
    grep -RInE --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.venv --exclude-dir=dist --exclude-dir=build "$pattern" . 2>&1 || true
  fi
}

tail_if_exists() {
  local title="$1"; shift
  local path="$1"; shift || true
  local n="${1:-200}"
  sec "$title"
  if [ -f "$path" ]; then
    say "FILE: $path"
    say ""
    tail -n "$n" "$path" 2>&1 || true
  elif [ -d "$path" ]; then
    say "DIR:  $path"
    say ""
    find "$path" -maxdepth 2 -type f 2>/dev/null | sort | while IFS= read -r f; do
      say ""
      say "---- tail -n $n $f ----"
      tail -n "$n" "$f" 2>&1 || true
    done
  else
    say "NOT FOUND: $path"
  fi
}

{
  say "=== DASHBOARD AUDIT REPORT ==="
  say "DATE: $(date)"
  say "ROOT: $PROJECT_ROOT"

  run_cmd "System" uname -a
  run_cmd "Git (if any)" bash -lc 'git rev-parse --is-inside-work-tree >/dev/null 2>&1 && { git status --porcelain=v1; echo; git log -1 --oneline; } || echo "no git repo"'
  run_cmd "Top level listing" ls -la
  run_cmd "File tree (depth 5, excluding heavy dirs)" bash -lc 'find . -maxdepth 5 -type d \( -name node_modules -o -name .git -o -name venv -o -name .venv -o -name dist -o -name build \) -prune -false -o -type f -print | sed "s|^\./||" | sort'

  sec "Runtime/tooling versions"
  say "node:   $(command -v node >/dev/null 2>&1 && node -v || echo "not found")"
  say "npm:    $(command -v npm >/dev/null 2>&1 && npm -v || echo "not found")"
  say "pnpm:   $(command -v pnpm >/dev/null 2>&1 && pnpm -v || echo "not found")"
  say "yarn:   $(command -v yarn >/dev/null 2>&1 && yarn -v || echo "not found")"
  say "python: $(command -v python >/dev/null 2>&1 && python -V || echo "not found")"
  say "python3:$(command -v python3 >/dev/null 2>&1 && python3 -V || echo "not found")"
  say "uvicorn:$(command -v uvicorn >/dev/null 2>&1 && uvicorn --version || echo "not found")"

  sec "Running processes (backend/dashboard hints)"
  if command -v pgrep >/dev/null 2>&1; then
    pgrep -fl "uvicorn|gunicorn|fastapi|flask|server\.py|node|next|vite|react-scripts|ng serve|webpack" 2>&1 || true
  else
    say "pgrep not found"
  fi

  sec "Listening ports (best-effort)"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP -sTCP:LISTEN 2>&1 | head -n 200 || true
  else
    say "lsof not found"
  fi

  sec "Frontend detection"
  run_cmd "package.json (scripts/deps) if present" bash -lc 'test -f package.json && { echo "--- package.json (scripts + deps keys) ---"; node -e "const fs=require(\"fs\"); const p=JSON.parse(fs.readFileSync(\"package.json\",\"utf8\")); console.log(\"name:\",p.name); console.log(\"scripts:\",p.scripts); console.log(\"dependencies keys:\",p.dependencies?Object.keys(p.dependencies):[]); console.log(\"devDependencies keys:\",p.devDependencies?Object.keys(p.devDependencies):[]);" 2>/dev/null || cat package.json; } || echo "no package.json"'

  sec "Python backend detection"
  run_cmd "pyproject/requirements if present" bash -lc 'for f in pyproject.toml requirements.txt requirements-dev.txt; do if [ -f "$f" ]; then echo "--- $f ---"; sed -n "1,200p" "$f"; echo; fi; done; true'

  sec "Key files likely related to dashboard"
  if command -v find >/dev/null 2>&1; then
    find . -type f \( -iname "*dash*board*" -o -iname "*ui*" -o -iname "*front*" -o -iname "*panel*" \) 2>/dev/null | sed 's|^\./||' | sort || true
  fi

  sec "Backend entrypoints (best guess)"
  find . -maxdepth 3 -type f \( -name "server.py" -o -name "app.py" -o -name "main.py" -o -name "wsgi.py" -o -name "asgi.py" -o -name "server.js" -o -name "index.js" -o -name "app.js" \) 2>/dev/null | sed 's|^\./||' | sort || true

  search "Dashboard keywords" "(dashboard|Dashboard|дашборд|panel|widgets?|metrics?)"
  search "API routes / endpoints signatures" "(/api\\b|router\\.|app\\.(get|post|put|delete)\\(|FastAPI\\(|Flask\\(|@app\\.(get|post|put|delete)|APIRouter\\(|Blueprint\\()"
  search "Data fetching (frontend)" "(HttpClient|fetch\\(|axios|react-query|swr|useEffect\\(|createAsyncThunk|RTK|pinia|vuex)"
  search "Stubs / mocks / hardcoded data signals" "(stub|mock|fixtures?|hardcoded|TODO:.*api|FAKE|demo data|sample data|test data|return \\{|return \\[)"
  search "TODO / FIXME / HACK" "(TODO|FIXME|HACK)"

  sec "Env/config hints"
  if command -v find >/dev/null 2>&1; then
    find . -maxdepth 4 -type f \( -iname ".env*" -o -iname "*config*.py" -o -iname "*config*.ts" -o -iname "*config*.js" -o -iname "settings*.py" \) 2>/dev/null | sed 's|^\./||' | sort || true
  fi

  sec "Logs (best-effort)"
  tail_if_exists "logs/ (tail files if exist)" "logs" 120
  tail_if_exists "reports/ (tail latest if exist)" "reports" 120

  sec "Quick visual status (heuristic)"
  say "UI present:        $(test -d src -o -d frontend -o -f package.json && echo YES || echo UNKNOWN)"
  say "API signatures:    $( ( [ "$have_rg" -eq 1 ] && rg -n -S "(/api\\b|app\\.(get|post)|FastAPI\\(|@app\\.(get|post))" . >/dev/null 2>&1 ) || ( [ "$have_rg" -eq 0 ] && grep -RInE "(/api\\b|app\\.(get|post)|FastAPI\\(|@app\\.(get|post))" . >/dev/null 2>&1 ); echo $? ) | awk '{print ($1==0)?"FOUND":"NOT FOUND"}')"
  say "Stub signals:      $( ( [ "$have_rg" -eq 1 ] && rg -n -S "(stub|mock|hardcoded|demo data|sample data)" . >/dev/null 2>&1 ) || ( [ "$have_rg" -eq 0 ] && grep -RInE "(stub|mock|hardcoded|demo data|sample data)" . >/dev/null 2>&1 ); echo $? ) | awk '{print ($1==0)?"LIKELY":"NONE SEEN"}')"
  say "TODO/FIXME count:  $( ( [ "$have_rg" -eq 1 ] && rg -n -S "(TODO|FIXME|HACK)" . | wc -l ) || ( [ "$have_rg" -eq 0 ] && grep -RInE "(TODO|FIXME|HACK)" . | wc -l ) )"

  hr
  say "REPORT: $report"
  say "NEXT: send me this file content (or at least sections: Dashboard keywords + API routes + Stubs + TODO)"
} > "$report"

echo "$report"
