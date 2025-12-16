#!/usr/bin/env bash
set -euo pipefail

echo "SMOKE DASHBOARD"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

fail=0
ok(){ echo "OK: $*"; }
warn(){ echo "WARN: $*"; }
bad(){ echo "FAIL: $*"; fail=1; }

BASE="http://127.0.0.1:8000"

if python3 -m py_compile server.py >/dev/null 2>&1; then
  ok "py_compile server.py"
else
  bad "py_compile server.py"
fi

count_post_bt_run="$(python3 - <<'PY' 2>/dev/null || echo 0
from pathlib import Path
t = Path("server.py").read_text(encoding="utf-8", errors="ignore")
print(t.count("/api/backtest/run"))
PY
)"
count_post_bt_run="$(echo "$count_post_bt_run" | tr -d '[:space:]' || true)"
[ -n "$count_post_bt_run" ] || count_post_bt_run=0

has_get_bt="$(python3 - <<'PY' 2>/dev/null || echo 0
from pathlib import Path
t = Path("server.py").read_text(encoding="utf-8", errors="ignore")
print(1 if (('@app.get("/api/backtest")' in t) or ("@app.get('/api/backtest')" in t) or ('@app.route("/api/backtest"' in t) or ("@app.route('/api/backtest'" in t)) else 0)
PY
)"
has_get_bt="$(echo "$has_get_bt" | tr -d '[:space:]' || true)"
[ -n "$has_get_bt" ] || has_get_bt=0

if [ "$count_post_bt_run" -gt 1 ]; then
  bad "POST /api/backtest/run duplicated ($count_post_bt_run)"
else
  ok "POST /api/backtest/run count=$count_post_bt_run"
fi

if [ "$has_get_bt" -ge 1 ]; then
  ok "GET /api/backtest present (server.py)"
else
  bad "GET /api/backtest not found (server.py)"
fi

echo
echo "HTTP SMOKE"

code_health="$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" || true)"
if [ "$code_health" = "200" ]; then
  ok "GET /health -> 200"
elif [ "$code_health" = "404" ]; then
  warn "GET /health -> 404 (backend responds, route missing)"
elif [ -z "$code_health" ] || [ "$code_health" = "000" ]; then
  bad "GET /health -> no response"
else
  warn "GET /health -> HTTP $code_health"
fi

code_backtest="$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backtest" || true)"
if [ "$code_backtest" = "200" ]; then
  ok "GET /api/backtest -> 200"
else
  bad "GET /api/backtest -> HTTP $code_backtest"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "OK: SMOKE RESULT: PASS"
  exit 0
else
  echo "FAIL: SMOKE RESULT: FAIL"
  exit 1
fi
