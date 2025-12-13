#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

mkdir -p logs
BACKEND_LOG="logs/backend_dev.log"
VITE_LOG="logs/vite_dev.log"

if [ -d "venv" ]; then
  echo "INFO: activating venv"
  . venv/bin/activate
else
  echo "WARN: venv not found, using system python3"
fi

if ! pgrep -f "python(3)? .*server\.py" >/dev/null 2>&1; then
  echo "INFO: starting backend server.py on :8000"
  python3 -u server.py >>"$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
else
  echo "INFO: backend server.py already running"
  BACKEND_PID=""
fi

PIDS_5173="$(lsof -ti tcp:5173 2>/dev/null || true)"
if [ -n "${PIDS_5173}" ]; then
  echo "INFO: killing old dev server on port 5173: ${PIDS_5173}"
  kill ${PIDS_5173} 2>/dev/null || true
  sleep 2
  STILL_5173="$(lsof -ti tcp:5173 2>/dev/null || true)"
  if [ -n "${STILL_5173}" ]; then
    echo "INFO: forcing kill on port 5173: ${STILL_5173}"
    kill -9 ${STILL_5173} 2>/dev/null || true
  fi
fi

cd web/dashboard-react || { echo "ERROR: web/dashboard-react not found"; exit 1; }

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js and rerun."
  exit 1
fi

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
echo "Open: http://127.0.0.1:5173"
echo "Logs: ${BACKEND_LOG} and ${VITE_LOG}"
