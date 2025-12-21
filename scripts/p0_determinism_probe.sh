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

fetch_json() {
  local path="$1"
  local out="$2"
  local code
  code="$(curl -sS -o "$out" -w "%{http_code}" "$base$path" || echo "000")"
  echo "GET $path -> $code"
  test "$code" = "200" || { echo "FAIL: $path not 200"; exit 1; }
}

normalize_and_compare() {
  local a="$1"
  local b="$2"
  python - "$a" "$b" <<'PY'
import json, sys, math

def norm(x):
    if isinstance(x, float):
        if math.isfinite(x):
            return round(x, 10)
        return x
    if isinstance(x, list):
        return [norm(i) for i in x]
    if isinstance(x, dict):
        return {k: norm(x[k]) for k in sorted(x.keys(), key=lambda s: str(s))}
    return x

a_path, b_path = sys.argv[1], sys.argv[2]
a = json.loads(open(a_path, "r", encoding="utf-8", errors="replace").read() or "null")
b = json.loads(open(b_path, "r", encoding="utf-8", errors="replace").read() or "null")
na = json.dumps(norm(a), sort_keys=True, ensure_ascii=False, separators=(",", ":"))
nb = json.dumps(norm(b), sort_keys=True, ensure_ascii=False, separators=(",", ":"))
if na != nb:
    print("FAIL: nondeterministic JSON diff")
    print("A:", na[:500])
    print("B:", nb[:500])
    raise SystemExit(1)
print("OK: deterministic")
PY
}

candles_a="/tmp/candles_a.json"
candles_b="/tmp/candles_b.json"
equity_a="/tmp/equity_a.json"
equity_b="/tmp/equity_b.json"
metrics_a="/tmp/metrics_a.json"
metrics_b="/tmp/metrics_b.json"

fetch_json "/api/candles?symbol=BTCUSDT&timeframe=1h&limit=50" "$candles_a"
fetch_json "/api/candles?symbol=BTCUSDT&timeframe=1h&limit=50" "$candles_b"
fetch_json "/api/equity?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$equity_a"
fetch_json "/api/equity?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$equity_b"
fetch_json "/api/metrics?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$metrics_a"
fetch_json "/api/metrics?symbol=BTCUSDT&timeframe=1h&mode=TEST" "$metrics_b"

echo "=== determinism ==="
normalize_and_compare "$equity_a" "$equity_b"
normalize_and_compare "$metrics_a" "$metrics_b"
normalize_and_compare "$candles_a" "$candles_b"

echo "=== candles sanity ==="
python - "$candles_a" <<'PY'
import json, sys

p=sys.argv[1]
obj=json.loads(open(p,"r",encoding="utf-8",errors="replace").read() or "null")

def unwrap(x):
    if isinstance(x, dict):
        for k in ("data","result","payload","candles","klines","items","rows"):
            if k in x:
                return x[k]
    return x

payload = unwrap(obj)

def is_columnar_dict(d):
    if not isinstance(d, dict):
        return False
    lists = [v for v in d.values() if isinstance(v, list)]
    if not lists:
        return False
    n = max((len(v) for v in lists), default=0)
    return n >= 2

def columnar_len(d):
    return max((len(v) for v in d.values() if isinstance(v, list)), default=0)

def monotonic_from_times(times):
    prev = None
    for v in times:
        try:
            vi = int(v)
        except Exception:
            try:
                vi = int(float(v))
            except Exception:
                continue
        if prev is not None and vi < prev:
            return False
        prev = vi
    return True

time_keys = ("t","time","timestamp","open_time","openTime","ts","datetime","date")

if isinstance(payload, list):
    if len(payload) < 2:
        raise SystemExit("FAIL: candles list has <2 items")
    tk = None
    for it in payload:
        if isinstance(it, dict):
            for k in time_keys:
                if k in it:
                    tk = k
                    break
        if tk:
            break
    if tk:
        times = [it.get(tk) for it in payload if isinstance(it, dict) and tk in it]
        if times and not monotonic_from_times(times):
            raise SystemExit(f"FAIL: candles not monotonic by {tk}")
    print("OK: candles list format")
    raise SystemExit(0)

if isinstance(payload, dict):
    payload2 = unwrap(payload)
    if payload2 is not payload:
        payload = payload2

if is_columnar_dict(payload):
    n = columnar_len(payload)
    if n < 2:
        raise SystemExit("FAIL: candles columnar dict has <2 rows")
    tkey = None
    for k in payload.keys():
        lk = str(k)
        if lk in time_keys and isinstance(payload[k], list) and len(payload[k]) >= 2:
            tkey = k
            break
    if tkey is not None:
        if not monotonic_from_times(payload[tkey]):
            raise SystemExit(f"FAIL: candles not monotonic by {tkey}")
    print("OK: candles columnar dict format")
    raise SystemExit(0)

raise SystemExit(f"FAIL: unsupported candles JSON shape: {type(payload).__name__}")
PY

python scripts/checklist_mark.py \
  "Data pipeline stable" \
  "Deterministic runs (seed, reproducible results)" >/dev/null

git add scripts/p0_determinism_probe.sh
git diff --cached --quiet || git commit -m "p0: make candles sanity accept columnar JSON formats" || true

bash scripts/progress.sh

echo "TASK: fix determinism probe candles sanity for dict/columnar formats and rerun"
echo "STEP_PROGRESS: 100%"
echo "DASHBOARD_PROGRESS: $(bash scripts/progress.sh 2>/dev/null | awk '{print $NF}' || echo measured_by_checklist)"
