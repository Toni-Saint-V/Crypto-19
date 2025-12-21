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

HOST="$host" PORT="$port" bash scripts/smoke_api_200.sh

root_code="$(curl -sS -o /dev/null -w "%{http_code}" "http://$host:$port/" || echo "000")"
echo "GET / -> $root_code"

python - <<'PY'
from pathlib import Path
p = Path("docs/DASHBOARD_CHECKLIST.md")
if not p.exists():
    raise SystemExit("FAIL: docs/DASHBOARD_CHECKLIST.md missing")
lines = p.read_text(encoding="utf-8").splitlines()
out=[]
for line in lines:
    if line.strip() == "- [ ] App boots locally with one command":
        out.append("- [x] App boots locally with one command")
    else:
        out.append(line)
p.write_text("\n".join(out) + "\n", encoding="utf-8")
PY
