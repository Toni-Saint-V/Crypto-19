#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

fail=0
ok(){ echo "OK: $*"; }
warn(){ echo "WARN: $*"; }
bad(){ echo "FAIL: $*"; fail=1; }

echo "SELFCHECK"
echo "root=$ROOT"
echo

echo "GIT"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [ -n "$(git status --porcelain)" ]; then
    warn "working tree is not clean"
    git status --porcelain | head -n 80 || true
  else
    ok "working tree clean"
  fi
else
  warn "not a git repo"
fi
echo

echo "BACKEND (http://127.0.0.1:8000)"
code_health="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health || true)"
if [ "$code_health" = "200" ]; then
  ok "GET /health -> 200"
else
  bad "GET /health -> HTTP $code_health (is backend running?)"
fi

code_bt="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/backtest || true)"
if [ "$code_bt" = "200" ]; then
  ok "GET /api/backtest -> 200"
else
  bad "GET /api/backtest -> HTTP $code_bt"
fi

code_as="$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}],"context":{"mode":"TEST","symbol":"BTCUSDT","timeframe":"1h"}}' \
  http://127.0.0.1:8000/api/assistant || true)"
if [ "$code_as" = "200" ]; then
  ok "POST /api/assistant -> 200"
else
  bad "POST /api/assistant -> HTTP $code_as"
fi

code_ml="$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"context":{"mode":"TEST","symbol":"BTCUSDT","timeframe":"1h"},"market":{"volatility":0.5,"trend_strength":0.3,"spread_estimate":0.01}}' \
  http://127.0.0.1:8000/api/ml/score || true)"
if [ "$code_ml" = "200" ]; then
  ok "POST /api/ml/score -> 200"
else
  bad "POST /api/ml/score -> HTTP $code_ml"
fi
echo

echo "SERVER SYNTAX"
if python3 -m py_compile server.py >/dev/null 2>&1; then
  ok "python3 -m py_compile server.py"
else
  bad "python3 -m py_compile server.py"
fi
echo

echo "SMOKE"
if [ -x scripts/smoke_dashboard.sh ]; then
  if bash scripts/smoke_dashboard.sh >/dev/null 2>&1; then
    ok "scripts/smoke_dashboard.sh PASS"
  else
    bad "scripts/smoke_dashboard.sh FAIL"
    bash scripts/smoke_dashboard.sh || true
  fi
else
  bad "scripts/smoke_dashboard.sh missing or not executable"
fi
echo

echo "FRONTEND (TypeScript)"
if [ -f web/dashboard-react/tsconfig.json ]; then
  if (cd web/dashboard-react && npx -y tsc -p tsconfig.json --noEmit) >/dev/null 2>&1; then
    ok "tsc --noEmit"
  else
    bad "tsc --noEmit FAIL"
    (cd web/dashboard-react && npx -y tsc -p tsconfig.json --noEmit) || true
  fi
else
  warn "web/dashboard-react/tsconfig.json missing"
fi
echo

echo "MOCK SCAN"
if [ -d web/dashboard-react/src ]; then
  if grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    -E "local mock|mock response|mocked|FAKE_ANSWER|DUMMY|stub response" \
    web/dashboard-react/src >/dev/null 2>&1; then
    warn "possible mock markers found:"
    grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
      -E "local mock|mock response|mocked|FAKE_ANSWER|DUMMY|stub response" \
      web/dashboard-react/src | head -n 80 || true
  else
    ok "no obvious mock markers"
  fi
else
  warn "web/dashboard-react/src missing"
fi
echo

echo "LAYOUT STATIC HINTS"
if [ -d web/dashboard-react/src ]; then
  if grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    -E "100vh|overflow:\s*hidden|min-height:\s*0|minWidth:\s*0|min-width:\s*0" \
    web/dashboard-react/src web/dashboard-react/src/styles >/dev/null 2>&1; then
    ok "found 100vh/overflow/min-height hints (static scan)"
  else
    warn "no 100vh/overflow hints found in src/styles (static scan)"
  fi
fi
echo

if [ "$fail" -eq 0 ]; then
  echo "SELFCHECK RESULT: PASS"
  exit 0
else
  echo "SELFCHECK RESULT: FAIL"
  exit 1
fi
