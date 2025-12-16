#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACK_LOG="/tmp/cbp_backend.log"
FE_LOG="/tmp/cbp_frontend.log"
BACK_URL="http://127.0.0.1:8000"
FE_URL="http://127.0.0.1:5173"

echo "== KILL OLD PROCESSES =="
pkill -f "uvicorn .*server:app" 2>/dev/null || true
pkill -f "python3 .*server.py" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true
pkill -f "npm.*run dev" 2>/dev/null || true
sleep 1

echo "== PYTHON ENV =="
if [ -d "venv" ]; then
  echo "activate: venv"
  . venv/bin/activate
elif [ -d ".venv" ]; then
  echo "activate: .venv"
  . .venv/bin/activate
else
  echo "no venv: using system python3"
fi

echo "== BACKEND START (uvicorn server:app) =="
: > "$BACK_LOG"
( python3 -m uvicorn server:app --reload --host 127.0.0.1 --port 8000 >>"$BACK_LOG" 2>&1 ) &
BACK_PID="$!"
echo "backend pid: $BACK_PID  log: $BACK_LOG"

echo "== BACKEND WAIT =="
python3 - <<'PY'
import time, urllib.request
url = "http://127.0.0.1:8000/docs"
for i in range(80):
    try:
        with urllib.request.urlopen(url, timeout=0.5) as r:
            if 200 <= r.status < 500:
                print("backend ok:", url, "status", r.status)
                raise SystemExit(0)
    except Exception:
        time.sleep(0.25)
raise SystemExit("ERROR: backend not responding on /docs")
PY

echo "== FRONTEND PREP =="
if [ -d "web/dashboard-react" ]; then
  cd "web/dashboard-react"
else
  echo "ERROR: web/dashboard-react not found"
  exit 1
fi

if [ ! -f ".env.local" ]; then
  cat > .env.local <<'ENV'
VITE_API_BASE=http://127.0.0.1:8000
ENV
fi

if [ ! -d "node_modules" ]; then
  echo "install deps..."
  if [ -f "package-lock.json" ]; then npm ci; else npm install; fi
fi

echo "== FRONTEND START (vite 5173) =="
: > "$FE_LOG"
( npm run dev -- --host 127.0.0.1 --port 5173 >>"$FE_LOG" 2>&1 ) &
FE_PID="$!"
echo "frontend pid: $FE_PID  log: $FE_LOG"

echo "== FRONTEND WAIT =="
python3 - <<'PY'
import socket, time
host, port = "127.0.0.1", 5173
for _ in range(120):
    s = socket.socket()
    s.settimeout(0.25)
    try:
        s.connect((host, port))
        s.close()
        print("frontend ok:", f"http://{host}:{port}")
        raise SystemExit(0)
    except Exception:
        time.sleep(0.25)
raise SystemExit("ERROR: frontend not responding on 5173")
PY

echo "== OPEN BROWSER =="
open "$FE_URL" || true

echo ""
echo "OK."
echo "Frontend: $FE_URL"
echo "Backend:  $BACK_URL/docs"
echo ""
echo "Tail logs:"
echo "  tail -n 80 $BACK_LOG"
echo "  tail -n 80 $FE_LOG"
