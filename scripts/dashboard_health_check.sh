#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "=== CryptoBot Pro Dashboard Health Check ==="
echo "Project root: ${PROJECT_ROOT}"
echo

if [ -d "venv" ]; then
  echo "INFO: activating venv"
  . venv/bin/activate
else
  echo "INFO: venv not found, using system python3"
fi
echo

echo "INFO: checking processes"
server_pids="$(pgrep -f "server.py" || true)"
if [ -n "${server_pids}" ]; then
  echo " - backend server.py running, PIDs: ${server_pids}"
else
  echo " - backend server.py NOT running"
fi

vite_pids="$(lsof -ti tcp:5173 || true)"
if [ -n "${vite_pids}" ]; then
  echo " - React dev server on port 5173 running, PIDs: ${vite_pids}"
else
  echo " - React dev server on port 5173 NOT running"
fi
echo

check_url() {
  name="$1"
  url="$2"
  echo "Checking ${name} at ${url}"
  if command -v curl >/dev/null 2>&1; then
    http_code="$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "${url}" || echo "000")"
    if [ "${http_code}" != "000" ]; then
      echo " - OK: reachable (HTTP ${http_code})"
    else
      echo " - FAIL: not reachable (timeout or connection error)"
    fi
  else
    echo " - WARN: curl not installed, cannot check ${url}"
  fi
  echo
}

check_url "backend dashboard (legacy HTML)" "http://127.0.0.1:8000/dashboard"
check_url "backend root" "http://127.0.0.1:8000/"
check_url "React dashboard (new UI)" "http://127.0.0.1:5173/"

echo "=== Health check complete ==="
echo "Hint: to start full stack use ./scripts/run_dashboard_dev.sh"
echo "Hint: to stop full stack use ./scripts/stop_dashboard_dev.sh"
