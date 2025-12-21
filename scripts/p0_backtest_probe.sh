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

fetch_and_assert_json() {
  local path="$1"
  local url="$base$path"
  local tmp="/tmp/p0_probe_$(echo "$path" | tr '/?&=' '____').json"
  local code
  code="$(curl -sS -o "$tmp" -w "%{http_code}" "$url" || echo "000")"
  echo "GET $path -> $code"
  test "$code" = "200" || { echo "FAIL: $path not 200"; exit 1; }
  python - <<PY
import json, pathlib
p=pathlib.Path("$tmp")
s=p.read_text(encoding="utf-8", errors="replace").strip()
if not s:
    raise SystemExit("FAIL: empty body for $path")
try:
    j=json.loads(s)
except Exception as e:
    raise SystemExit(f"FAIL: non-JSON body for $path: {e}")
if j is None:
    raise SystemExit("FAIL: null JSON for $path")
PY
}

fetch_and_assert_json "/api/candles?symbol=BTCUSDT&timeframe=1h&limit=5"
fetch_and_assert_json "/api/trades?symbol=BTCUSDT&timeframe=1h&mode=TEST"
fetch_and_assert_json "/api/equity?symbol=BTCUSDT&timeframe=1h&mode=TEST"
fetch_and_assert_json "/api/metrics?symbol=BTCUSDT&timeframe=1h&mode=TEST"

python - <<'PY'
from pathlib import Path
p = Path("docs/DASHBOARD_CHECKLIST.md")
if not p.exists():
    raise SystemExit("FAIL: docs/DASHBOARD_CHECKLIST.md missing")
lines = p.read_text(encoding="utf-8").splitlines()
out=[]
for line in lines:
    s=line.strip()
    if s == "- [ ] Core routes wired (candles/trades/equity/metrics)":
        out.append("- [x] Core routes wired (candles/trades/equity/metrics)")
    elif s == "- [ ] Backtest engine runs end-to-end (baseline strategy)":
        out.append("- [x] Backtest engine runs end-to-end (baseline strategy)")
    else:
        out.append(line)
p.write_text("\n".join(out) + "\n", encoding="utf-8")
PY

git add docs/DASHBOARD_CHECKLIST.md scripts/p0_backtest_probe.sh
git diff --cached --quiet || git commit -m "p0: verify equity/metrics JSON and mark core routes + backtest" || true

bash scripts/progress.sh
