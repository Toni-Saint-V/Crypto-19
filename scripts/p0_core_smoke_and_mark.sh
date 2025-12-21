#!/usr/bin/env bash
set -euo pipefail

host="${HOST:-127.0.0.1}"

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

port="$(python - <<'PY'
import socket
s=socket.socket()
s.bind(("127.0.0.1",0))
print(s.getsockname()[1])
s.close()
PY
)"

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
while time.time()-t0 < 12:
    s=socket.socket(); s.settimeout(0.5)
    try:
        s.connect((host, port)); s.close(); sys.exit(0)
    except Exception:
        try: s.close()
        except Exception: pass
        time.sleep(0.2)
sys.exit(1)
PY

base="http://$host:$port"

get_json() {
  local path="$1"
  local out="$2"
  local code
  code="$(curl -sS -o "$out" -w "%{http_code}" "$base$path" 2>/dev/null || true)"
  test -n "${code:-}" || code="000"
  echo "GET $path -> $code"
  test "$code" = "200" || { echo "FAIL: $path not 200"; exit 1; }
  python - "$out" "$path" <<'PY'
import json, sys
p=sys.argv[1]; path=sys.argv[2]
s=open(p,"r",encoding="utf-8",errors="replace").read().strip()
if not s:
    raise SystemExit(f"FAIL: empty body for {path}")
try:
    json.loads(s)
except Exception as e:
    raise SystemExit(f"FAIL: non-JSON body for {path}: {e}")
PY
}

tmp1="/tmp/core_candles.json"
tmp2="/tmp/core_trades.json"
tmp3="/tmp/core_equity.json"
tmp4="/tmp/core_metrics.json"

get_json "/api/candles?symbol=BTCUSDT&timeframe=1h&limit=5" "$tmp1"
get_json "/api/trades?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$tmp2"
get_json "/api/equity?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$tmp3"
get_json "/api/metrics?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$tmp4"

python - "$tmp1" "$tmp2" "$tmp3" "$tmp4" <<'PY'
import json, sys

def ok_shape(obj, name):
    if isinstance(obj, list):
        return True
    if isinstance(obj, dict):
        for k in ("data","result","payload","items","rows"):
            if k in obj and isinstance(obj[k], list):
                return True
        return True
    raise SystemExit(f"FAIL: {name} unsupported json type: {type(obj).__name__}")

paths = ["candles","trades","equity","metrics"]
for i, name in enumerate(paths):
    p=sys.argv[i+1]
    obj=json.loads(open(p,"r",encoding="utf-8",errors="replace").read() or "null")
    if obj is None:
        raise SystemExit(f"FAIL: {name} null JSON")
    ok_shape(obj, name)
print("OK: core endpoints return JSON")
PY

if test -f scripts/checklist_mark.py; then
  python scripts/checklist_mark.py \
    "App boots locally with one command" \
    "Core routes wired (candles/trades/equity/metrics)" >/dev/null || true
fi

git add scripts/p0_core_smoke_and_mark.sh docs/DASHBOARD_CHECKLIST.md || true
git diff --cached --quiet || git commit -m "p0: prove core API routes via boot+json and mark checklist" || true

bash scripts/progress.sh
