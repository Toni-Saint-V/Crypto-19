#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_LOG="$PROJECT_ROOT/logs/backend_dev.log"
VITE_LOG="$PROJECT_ROOT/logs/vite_dev.log"

echo "=== backend_dev.log (last 200) ==="
tail -n 200 "$BACKEND_LOG" 2>/dev/null || echo "no $BACKEND_LOG"
echo ""
echo "=== vite_dev.log (last 200) ==="
tail -n 200 "$VITE_LOG" 2>/dev/null || echo "no $VITE_LOG"
echo ""
echo "=== errors (backend/vite) ==="
{
  grep -nE 'ERROR|Traceback|Exception' "$BACKEND_LOG" 2>/dev/null || true
  echo ""
  grep -nE 'ERROR|ERR!|TypeError|ReferenceError' "$VITE_LOG" 2>/dev/null || true
} | tail -n 300
