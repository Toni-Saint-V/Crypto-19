#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ Не найден python3. Установите Python 3."
  exit 1
fi

if [ ! -d "venv" ]; then
  echo "🌀 Создаю виртуальное окружение ./venv ..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Устанавливаю зависимости (FastAPI, Uvicorn и др.)..."
python3 -m pip install --upgrade pip >/dev/null 2>&1 || echo "⚠️ Не удалось обновить pip, продолжаю..."
python3 -m pip install "uvicorn[standard]" fastapi jinja2 python-multipart python-dotenv requests numpy pandas >/dev/null 2>&1 || echo "⚠️ Не все зависимости установились, пробую продолжить..."

SERVER_FILE="start_server.py"
if [ ! -f "$SERVER_FILE" ]; then
  if [ -f "server.py" ]; then
    SERVER_FILE="server.py"
  else
    echo "❌ Не найден start_server.py или server.py"
    exit 1
  fi
fi

echo "🚀 Запускаю сервер CryptoBot Pro: $SERVER_FILE ..."
pkill -f "$SERVER_FILE" >/dev/null 2>&1 || true
python3 "$SERVER_FILE" > server.log 2>&1 &

SERVER_PID=$!
sleep 5

DASHBOARD_URL="http://127.0.0.1:8000/dashboard"
echo "🌐 Открываю дашборд: $DASHBOARD_URL"
if command -v open >/dev/null 2>&1; then
  open "$DASHBOARD_URL" || true
fi

echo "✅ Сервер запущен (PID: $SERVER_PID). Дашборд должен быть доступен по адресу $DASHBOARD_URL"
