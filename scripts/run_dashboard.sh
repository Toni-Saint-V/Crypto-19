#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}" || { echo "ERROR: не удалось перейти в ${PROJECT_ROOT}"; exit 1; }

echo "INFO: PROJECT_ROOT=${PROJECT_ROOT}"

# Активируем venv, если есть
if [ -d "venv" ]; then
  echo "INFO: активирую venv"
  . venv/bin/activate
else
  echo "INFO: venv не найден, использую системный python3"
fi

if [ ! -f "server.py" ]; then
  echo "ERROR: server.py не найден в ${PROJECT_ROOT}"
  exit 1
fi

# Останавливаем старый server.py, если он был
(pkill -f "server.py" 2>/dev/null && echo "INFO: старый server.py остановлен") || echo "INFO: запущенного server.py не найдено"

echo "INFO: запускаю server.py..."
python3 server.py & srv_pid=$!
sleep 5

dashboard_url="http://127.0.0.1:8000/dashboard"

# Пробуем открыть дашборд в браузере
if open "${dashboard_url}"; then
  echo "INFO: дашборд открыт в браузере (${dashboard_url})"
else
  echo "INFO: открой вручную в браузере: ${dashboard_url}"
fi

echo "INFO: server.py запущен (PID ${srv_pid})"
