#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

PATTERN_SERVER="server.py"
PORT_REACT=5173

echo "INFO: stopping backend (server.py) if running"
server_pids="$(pgrep -f "${PATTERN_SERVER}" || true)"
if [ -n "${server_pids}" ]; then
  echo "INFO: killing server.py PIDs: ${server_pids}"
  kill ${server_pids} || true
else
  echo "INFO: server.py not running"
fi

echo "INFO: stopping React dev server on port ${PORT_REACT} if running"
vite_pids="$(lsof -ti tcp:${PORT_REACT} || true)"
if [ -n "${vite_pids}" ]; then
  echo "INFO: killing port ${PORT_REACT} PIDs: ${vite_pids}"
  kill ${vite_pids} || true
else
  echo "INFO: nothing running on port ${PORT_REACT}"
fi

echo "DONE: CryptoBot Pro dev stack stopped."
