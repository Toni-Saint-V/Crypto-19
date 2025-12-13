#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

mkdir -p "$PROJECT_ROOT/logs"
BACKEND_LOG="$PROJECT_ROOT/logs/backend_dev.log"
VITE_LOG="$PROJECT_ROOT/logs/vite_dev.log"
BACKEND_PID_FILE="$PROJECT_ROOT/logs/backend.pid"

is_backend_ours() {
  pid="$1"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  if echo "$cmd" | grep -Fq "$PROJECT_ROOT/server.py"; then
    return 0
  fi
  if echo "$cmd" | grep -Eq "uvicorn.*server:app"; then
    return 0
  fi
  return 1
}

kill_backend_on_port_if_ours() {
  pids="$(lsof -ti tcp:"$BACKEND_PORT" 2>/dev/null || true)"
  [ -z "$pids" ] && return 0

  for pid in $pids; do
    if is_backend_ours "$pid"; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  sleep 1

  pids_after="$(lsof -ti tcp:"$BACKEND_PORT" 2>/dev/null || true)"
  if [ -n "$pids_after" ]; then
    for pid in $pids_after; do
      if is_backend_ours "$pid"; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    done
  fi

  sleep 1

  still="$(lsof -ti tcp:"$BACKEND_PORT" 2>/dev/null || true)"
  if [ -n "$still" ]; then
    echo "ERROR: port :$BACKEND_PORT is still in use by non-project process(es): $still"
    echo "TIP: check: lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN"
    exit 1
  fi
}

backend_running_by_pidfile() {
  [ -f "$BACKEND_PID_FILE" ] || return 1
  pid="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null
}

if [ -d "$PROJECT_ROOT/venv" ]; then
  echo "INFO: activating venv"
  . "$PROJECT_ROOT/venv/bin/activate"
else
  echo "WARN: venv not found, using system python3"
fi

if [ "${FORCE_RESTART_BACKEND:-0}" = "1" ]; then
  echo "INFO: FORCE_RESTART_BACKEND=1 -> stopping backend on :$BACKEND_PORT (only project-owned)"
  rm -f "$BACKEND_PID_FILE" 2>/dev/null || true
  kill_backend_on_port_if_ours
fi

if backend_running_by_pidfile; then
  echo "INFO: backend already running (pidfile)"
  BACKEND_PID=""
else
  if lsof -ti tcp:"$BACKEND_PORT" >/dev/null 2>&1; then
    echo "ERROR: port :$BACKEND_PORT already in use. Use FORCE_RESTART_BACKEND=1 to stop project-owned backend."
    exit 1
  fi
  echo "INFO: starting backend server.py on ${BACKEND_HOST}:${BACKEND_PORT}"
  : >"$BACKEND_LOG" || true
  BACKEND_HOST="$BACKEND_HOST" BACKEND_PORT="$BACKEND_PORT" \
    python3 -u "$PROJECT_ROOT/server.py" >>"$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" >"$BACKEND_PID_FILE"
fi

PIDS_5173="$(lsof -ti tcp:5173 2>/dev/null || true)"
if [ -n "${PIDS_5173}" ]; then
  echo "INFO: killing old dev server on port 5173: ${PIDS_5173}"
  kill ${PIDS_5173} 2>/dev/null || true
  sleep 1
  STILL_5173="$(lsof -ti tcp:5173 2>/dev/null || true)"
  if [ -n "${STILL_5173}" ]; then
    echo "INFO: forcing kill on port 5173: ${STILL_5173}"
    kill -9 ${STILL_5173} 2>/dev/null || true
  fi
fi

cd "$PROJECT_ROOT/web/dashboard-react" || { echo "ERROR: web/dashboard-react not found"; exit 1; }

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js and rerun."
  exit 1
fi

: >"$VITE_LOG" || true

if [ ! -d "node_modules" ]; then
  echo "INFO: node_modules not found, running npm install (first run)"
  npm install >>"$VITE_LOG" 2>&1
fi

echo "INFO: starting Vite dev server on :5173"
npm run dev -- --host 127.0.0.1 --port 5173 >>"$VITE_LOG" 2>&1 &
REACT_PID=$!

sleep 2

echo "DONE: dashboard dev started."
echo "Backend PID: ${BACKEND_PID:-existing}, React PID: ${REACT_PID}"
echo "Frontend: http://127.0.0.1:5173"
echo "Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "Logs: ${BACKEND_LOG} and ${VITE_LOG}"
