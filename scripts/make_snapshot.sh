#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

OUT_DIR="${HOME}/Desktop/_CBP_snapshots"
mkdir -p "${OUT_DIR}"

TS="$(date +"%Y-%m-%d_%H-%M-%S")"
ARCHIVE="${OUT_DIR}/cryptobot_19_clean_${TS}.zip"

echo "INFO: creating snapshot at ${ARCHIVE}"
# исключаем тяжёлое и служебное
zip -r "${ARCHIVE}" . \
  -x ".git/*" \
  -x "venv/*" \
  -x "node_modules/*" \
  -x "web/dashboard-react/node_modules/*" \
  -x "__pycache__/*" \
  -x "*.pyc" \
  -x "*/.DS_Store" \
  >/tmp/cbp_snapshot.log 2>&1

echo "DONE: snapshot created -> ${ARCHIVE}"
