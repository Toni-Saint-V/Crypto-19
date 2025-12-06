#!/usr/bin/env zsh

set -euo pipefail

# ===== НАСТРОЙКИ ПОД ТЕБЯ =====
PROJECT_ROOT="/Users/user/cryptobot_pro"
COMBINED_PATH="/Users/user/Desktop/Combined_CryptoBotPro.md"
PROJECT_LOG_PATH="$PROJECT_ROOT/PROJECT_LOG.md"

ts() {
  date +"[%H:%M:%S]"
}

echo "$(ts) 🔧 Запуск cbp…"
echo "$(ts) 📂 PROJECT_ROOT: $PROJECT_ROOT"
echo "$(ts) 📘 CONTEXT:      $COMBINED_PATH"

# ===== ПРОВЕРКА CONTEXT-ФАЙЛА =====
if [[ ! -f "$COMBINED_PATH" ]]; then
  echo "$(ts) ❌ Не найден файл контекста:"
  echo "    $COMBINED_PATH"
  echo "    Проверь путь и запусти снова."
  exit 1
fi
echo "$(ts) ✅ Файл контекста найден."

# ===== ПРОЕКТНАЯ ПАПКА И PROJECT_LOG =====
if [[ ! -d "$PROJECT_ROOT" ]]; then
  echo "$(ts) ⚠️ Папка проекта не найдена, создаю: $PROJECT_ROOT"
  mkdir -p "$PROJECT_ROOT"
else
  echo "$(ts) ✅ Папка проекта существует."
fi

if [[ ! -f "$PROJECT_LOG_PATH" ]]; then
  echo "$(ts) 📝 Создаю PROJECT_LOG.md: $PROJECT_LOG_PATH"
  cat << EOF > "$PROJECT_LOG_PATH"
# CryptoBot Pro — PROJECT LOG

## Init
- Лог создан автоматически скриптом cbp.
- Дата создания: $(date +"%Y-%m-%d %H:%M:%S")
- PROJECT_ROOT: $PROJECT_ROOT

## Changes
- (изменения появятся после работы Bot Architect)
EOF
else
  echo "$(ts) ✅ PROJECT_LOG.md уже существует."
fi

# ===== ЗАПУСК CHATGPT DESKTOP =====
echo "$(ts) 🚀 Открываю ChatGPT…"
open -a "ChatGPT" || {
  echo "$(ts) ❌ Не удалось открыть ChatGPT.app"
  exit 1
}

sleep 1.5

# ===== СОЗДАНИЕ НОВОГО ЧАТА =====
echo "$(ts) ✨ Создаю новый чат…"
osascript << 'APPLES'
tell application "System Events"
  if application process "ChatGPT" exists then
    tell process "ChatGPT"
      keystroke "n" using {command down}
    end tell
  end if
end tell
APPLES

# ===== ВСТАВКА КОНТЕКСТА =====
echo "$(ts) 📋 Копирую контекст в буфер…"
pbcopy < "$COMBINED_PATH"

sleep 0.8
echo "$(ts) 📥 Вставляю контекст в чат и отправляю…"
osascript << 'APPLES2'
tell application "System Events"
  if application process "ChatGPT" exists then
    tell process "ChatGPT"
      keystroke "v" using {command down}
      delay 0.3
      key code 36
    end tell
  end if
end tell
APPLES2

echo "$(ts) ✅ Готово: новый чат с Bot Architect запущен."
echo "$(ts) 📂 PROJECT_ROOT: $PROJECT_ROOT"
echo "$(ts) 📄 PROJECT_LOG:  $PROJECT_LOG_PATH"
