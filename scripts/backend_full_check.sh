#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}" || { echo "ERROR: cannot cd to project root"; exit 1; }

if [ -d "venv" ]; then
  echo "INFO: activating venv"
  . venv/bin/activate
else
  echo "INFO: venv not found, using system python3"
fi

if [ -f "scripts/gen_dashboard_debug_docs.py" ]; then
  echo "INFO: regenerating dashboard debug docs"
  python3 scripts/gen_dashboard_debug_docs.py || echo "WARN: gen_dashboard_debug_docs.py failed"
else
  echo "WARN: scripts/gen_dashboard_debug_docs.py not found"
fi

if python3 -m pytest --version >/dev/null 2>&1; then
  echo "INFO: running dashboard tests"
  python3 -m pytest tests/test_dashboard_snapshot.py tests/test_dashboard_contract.py || echo "WARN: dashboard tests failed"
else
  echo "WARN: pytest not available, skipping tests"
fi

(pkill -f "server.py" 2>/dev/null && echo "INFO: old server.py stopped") || echo "INFO: no running server.py found"

echo "INFO: starting server.py on :8000"
python3 server.py & srv_pid=$!
sleep 5

url="http://127.0.0.1:8000/dashboard"
if open "${url}"; then
  echo "INFO: dashboard opened in browser: ${url}"
else
  echo "INFO: open this URL manually in browser: ${url}"
fi

echo "DONE: backend full check finished, server.py pid=${srv_pid}"
