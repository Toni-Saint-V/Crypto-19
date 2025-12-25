#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}" || { echo "ERROR: не удалось перейти в ${PROJECT_ROOT}"; exit 1; }

echo "INFO: PROJECT_ROOT=${PROJECT_ROOT}"

# Активируем venv, если есть, но БЕЗ pip-install
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

echo "INFO: пробую запустить pytest tests/test_dashboard_snapshot.py"
if python3 -m pytest tests/test_dashboard_snapshot.py; then
  echo "INFO: pytest успешно отработал"
else
  echo "WARN: pytest завершился с ошибкой (или не установлен) — продолжаю запуск сервера"
fi

# Останавливаем старый сервер, если был
(pkill -f "server.py" 2>/dev/null && echo "INFO: старый server.py остановлен") || echo "INFO: запущенного server.py не найдено"

echo "INFO: запускаю server.py..."
python3 server.py & srv_pid=$!
sleep 5

# Health-check для live / test / backtest (если сервер поднялся)
for mode in live test backtest; do
  url="http://127.0.0.1:8000/api/dashboard/snapshot?symbol=BTCUSDT&timeframe=15m&mode=${mode}"
  out="/tmp/dashboard_snapshot_${mode}.json"
  if curl -sf "${url}" -o "${out}"; then
    echo "OK: snapshot mode=${mode} -> ${out}"
  else
    echo "WARN: snapshot mode=${mode} не отвечает по адресу ${url}"
  fi
done

# Открываем UI
if open "http://127.0.0.1:8000/dashboard"; then
  echo "OK: дашборд открыт в браузере (http://127.0.0.1:8000/dashboard)"
else
  echo "INFO: открой вручную: http://127.0.0.1:8000/dashboard"
fi

echo "DONE: server.py запущен (PID ${srv_pid}), снапшоты проверены для live/test/backtest"
