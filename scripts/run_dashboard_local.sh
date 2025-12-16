#!/usr/bin/env bash
set -u -o pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

say(){ printf "%s\n" "$*"; }

have_curl=0
command -v curl >/dev/null 2>&1 && have_curl=1

start_backend() {
  local base="http://127.0.0.1:8000"

  if [ "$have_curl" -eq 1 ] && curl -fsS --max-time 1 "$base/api/selfcheck" >/dev/null 2>&1; then
    say "INFO: backend already running on :8000"
    return 0
  fi

  if [ ! -f "$ROOT/server.py" ]; then
    say "WARN: server.py not found, backend not started"
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    say "WARN: python3 not found, backend not started"
    return 0
  fi

  say "INFO: starting backend on :8000 (logs: /tmp/cbp_backend.log)"
  python3 "$ROOT/server.py" >/tmp/cbp_backend.log 2>&1 &
  echo "$!" >/tmp/cbp_backend.pid 2>/dev/null || true

  if [ "$have_curl" -eq 1 ]; then
    i=0
    while [ $i -lt 30 ]; do
      if curl -fsS --max-time 1 "$base/api/selfcheck" >/dev/null 2>&1; then
        say "OK: backend responds on :8000"
        return 0
      fi
      i=$((i+1))
      sleep 0.2
    done
    say "WARN: backend not responding yet; check /tmp/cbp_backend.log"
  else
    say "INFO: curl not found; skipping backend healthcheck"
  fi
  return 0
}

start_frontend() {
  local fe="$ROOT/web/dashboard-react"

  if [ ! -d "$fe" ]; then
    say "WARN: frontend dir not found: $fe"
    return 0
  fi

  if command -v lsof >/dev/null 2>&1; then
    if lsof -ti tcp:5173 >/dev/null 2>&1; then
      say "INFO: frontend already running on :5173"
      return 0
    fi
  fi

  if ! command -v npm >/dev/null 2>&1; then
    say "WARN: npm not found; frontend not started"
    return 0
  fi

  cd "$fe" || return 0

  if [ ! -f "package.json" ]; then
    say "WARN: package.json not found in $fe"
    cd "$ROOT" || true
    return 0
  fi

  if [ ! -d "node_modules" ]; then
    say "INFO: node_modules missing -> npm install (logs: /tmp/cbp_frontend_install.log)"
    npm install >/tmp/cbp_frontend_install.log 2>&1 || say "WARN: npm install failed; see /tmp/cbp_frontend_install.log"
  fi

  say "INFO: starting frontend on :5173 (logs: /tmp/cbp_frontend.log)"
  npm run dev -- --host 127.0.0.1 --port 5173 >/tmp/cbp_frontend.log 2>&1 &
  echo "$!" >/tmp/cbp_frontend.pid 2>/dev/null || true

  cd "$ROOT" || true

  if [ "$have_curl" -eq 1 ]; then
    i=0
    while [ $i -lt 40 ]; do
      if curl -fsS --max-time 1 "http://127.0.0.1:5173/" >/dev/null 2>&1; then
        say "OK: frontend responds on :5173"
        return 0
      fi
      i=$((i+1))
      sleep 0.2
    done
    say "WARN: frontend not responding yet; check /tmp/cbp_frontend.log"
  else
    say "INFO: curl not found; skipping frontend healthcheck"
  fi

  return 0
}

say "RUN DASHBOARD LOCAL"
say "ROOT: $ROOT"
say ""

start_backend
start_frontend

say ""
say "OPEN:"
say "- Frontend: http://127.0.0.1:5173/"
say "- Backend:  http://127.0.0.1:8000/api/selfcheck"
say "- Backtest: http://127.0.0.1:8000/api/backtest"
say ""
say "LOGS:"
say "- /tmp/cbp_backend.log"
say "- /tmp/cbp_frontend.log"
say ""
say "PIDS (if started by this script):"
if [ -f /tmp/cbp_backend.pid ]; then say "- backend:  $(cat /tmp/cbp_backend.pid 2>/dev/null || true)"; fi
if [ -f /tmp/cbp_frontend.pid ]; then say "- frontend: $(cat /tmp/cbp_frontend.pid 2>/dev/null || true)"; fi

exit 0
