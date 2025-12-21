#!/usr/bin/env bash
set -euo pipefail

host="${HOST:-127.0.0.1}"
port="${PORT:-8010}"
log="${LOG_LEVEL:-info}"

pick_target() {
  if test -f server.py && grep -q "FastAPI" server.py && grep -qE "^[[:space:]]*app[[:space:]]*=" server.py; then
    echo "server:app"
    return 0
  fi
  py="$(grep -RIl --exclude-dir=".venv" --exclude-dir=".git" --exclude-dir="node_modules" "FastAPI" . 2>/dev/null | head -n 1 || true)"
  test -n "${py:-}" || return 1
  base="$(basename "$py" .py)"
  if grep -qE "^[[:space:]]*app[[:space:]]*=" "$py"; then
    echo "${base}:app"
    return 0
  fi
  return 1
}

target="$(pick_target || true)"
test -n "${target:-}" || { echo "FAIL: cannot find FastAPI app target"; exit 1; }

python -c "import uvicorn" >/dev/null 2>&1 || { echo "FAIL: uvicorn not installed"; exit 1; }

echo "Starting: uvicorn $target --host $host --port $port --reload (LOG_LEVEL=$log)"
exec python -m uvicorn "$target" --host "$host" --port "$port" --reload --log-level "$log"
