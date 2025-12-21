#!/usr/bin/env bash
set -euo pipefail

port="8010"
host="127.0.0.1"

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

python -c "import uvicorn" >/dev/null 2>&1 || { echo "FAIL: uvicorn not installed in this env"; exit 1; }

python -m uvicorn "$target" --host "$host" --port "$port" --log-level warning >/dev/null 2>&1 &
pid="$!"

cleanup() {
  kill "$pid" >/dev/null 2>&1 || true
  wait "$pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT

python - "$host" "$port" <<'PY'
import socket, sys, time
host=sys.argv[1]; port=int(sys.argv[2])
t0=time.time()
while time.time()-t0 < 10:
    s=socket.socket()
    s.settimeout(0.5)
    try:
        s.connect((host, port))
        s.close()
        sys.exit(0)
    except Exception:
        try: s.close()
        except Exception: pass
        time.sleep(0.2)
sys.exit(1)
PY

base="http://$host:$port"

get_code() { curl -sS -o /dev/null -w "%{http_code}" "$1" || echo "000"; }
post_code() { curl -sS -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$2" "$1" || echo "000"; }

c1="$(get_code "$base/api/candles?symbol=BTCUSDT&timeframe=1h&limit=5")"
c2="$(get_code "$base/api/trades?symbol=BTCUSDT&timeframe=1h&mode=TEST")"
c3="$(get_code "$base/api/equity?symbol=BTCUSDT&timeframe=1h&mode=TEST")"
c4="$(get_code "$base/api/metrics?symbol=BTCUSDT&timeframe=1h&mode=TEST")"
c5="$(post_code "$base/api/ml/score" '{"symbol":"BTCUSDT","timeframe":"1h","mode":"TEST"}')"

echo "GET /api/candles -> $c1"
echo "GET /api/trades  -> $c2"
echo "GET /api/equity  -> $c3"
echo "GET /api/metrics -> $c4"
echo "POST /api/ml/score -> $c5"

ok="1"
test "$c1" = "200" || ok="0"
test "$c2" = "200" || ok="0"
test "$c3" = "200" || ok="0"
test "$c4" = "200" || ok="0"
test "$c5" = "200" || ok="0"

test "$ok" = "1" || { echo "FAIL: one or more endpoints not 200"; exit 1; }
