#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

echo "=== backend_dev.log (last 120) ==="
tail -n 120 logs/backend_dev.log 2>/dev/null || echo "no logs/backend_dev.log"
echo ""
echo "=== vite_dev.log (last 120) ==="
tail -n 120 logs/vite_dev.log 2>/dev/null || echo "no logs/vite_dev.log"
echo ""
echo "=== errors (backend/vite) ==="
{
  grep -nE 'ERROR|Traceback|Exception' logs/backend_dev.log 2>/dev/null || true
  echo ""
  grep -nE 'ERROR|ERR!|TypeError|ReferenceError' logs/vite_dev.log 2>/dev/null || true
} | tail -n 200
