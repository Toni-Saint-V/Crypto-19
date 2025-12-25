#!/usr/bin/env bash
set -o pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)"
cd "$ROOT" 2>/dev/null || { echo "ERROR: cannot cd to repo root: $ROOT"; exit 0; }

BACK_URL="http://127.0.0.1:8000"
FRONT_URL="http://127.0.0.1:5173"
BACK_LOG="/tmp/cbp_backend.log"
FRONT_LOG="/tmp/cbp_frontend.log"

kill_port() {
  port="$1"
  label="$2"
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      echo "== STOP $label (port $port) =="
      echo "$pids" | tr " " "\n" | while read -r pid; do
        [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
      done
      sleep 1
    fi
  else
    echo "WARN: lsof not found; skipping port kill for $port"
  fi
}

echo "== ROOT =="
echo "$ROOT"

kill_port 8000 "BACKEND"
kill_port 5173 "FRONTEND"

echo "== START BACKEND (server.py -> $BACK_LOG) =="
if [ -d "venv" ]; then
  . venv/bin/activate 2>/dev/null || true
fi
: > "$BACK_LOG" 2>/dev/null || true
nohup python3 server.py >"$BACK_LOG" 2>&1 &
sleep 1

echo "== START FRONTEND (Vite -> $FRONT_LOG) =="
cd "$ROOT/web/dashboard-react" 2>/dev/null || { echo "ERROR: missing web/dashboard-react"; exit 0; }

PM="npm"
if [ -f "pnpm-lock.yaml" ] && command -v pnpm >/dev/null 2>&1; then PM="pnpm"; fi
if [ -f "yarn.lock" ] && command -v yarn >/dev/null 2>&1; then PM="yarn"; fi

: > "$FRONT_LOG" 2>/dev/null || true
if [ "$PM" = "pnpm" ]; then
  nohup pnpm run dev -- --host 127.0.0.1 --port 5173 >"$FRONT_LOG" 2>&1 &
elif [ "$PM" = "yarn" ]; then
  nohup yarn dev --host 127.0.0.1 --port 5173 >"$FRONT_LOG" 2>&1 &
else
  nohup npm run dev -- --host 127.0.0.1 --port 5173 >"$FRONT_LOG" 2>&1 &
fi

cd "$ROOT" 2>/dev/null || exit 0

echo "== OPEN FRONTEND =="
if command -v open >/dev/null 2>&1; then
  open "$FRONT_URL" >/dev/null 2>&1 || true
else
  echo "OPEN THIS URL MANUALLY: $FRONT_URL"
fi

echo ""
echo "== BACKEND LOG (last 80) =="
tail -n 80 "$BACK_LOG" 2>/dev/null || echo "INFO: no backend log yet: $BACK_LOG"

echo ""
echo "== FRONTEND LOG (last 120) =="
tail -n 120 "$FRONT_LOG" 2>/dev/null || echo "INFO: no frontend log yet: $FRONT_LOG"

echo ""
echo "NEXT:"
echo "1) Open $FRONT_URL"
echo "2) Switch to Backtest"
echo "3) If it crashes: copy ErrorBoundary text (message+stack) and paste into chat"
exit 0
