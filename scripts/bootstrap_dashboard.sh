#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}" || { echo "ERROR: не удалось перейти в ${PROJECT_ROOT}"; exit 1; }

echo "INFO: PROJECT_ROOT=${PROJECT_ROOT}"

# НИКАКИХ pip install здесь — чтобы обходить SSL/сертификатные ошибки
if [ -d "venv" ]; then
  echo "INFO: venv найден, активирую"
  . venv/bin/activate
else
  echo "INFO: venv не найден, работаю на системном python3"
fi

chmod +x scripts/dashboard_smoke.sh

echo "INFO: запускаю scripts/dashboard_smoke.sh"
./scripts/dashboard_smoke.sh

echo "DONE: bootstrap_dashboard завершен"
