#!/usr/bin/env zsh

set -euo pipefail

PROJECT_ROOT="/Users/user/cryptobot_pro"
COMBINED_SRC="/Users/user/Desktop/Combined_CryptoBotPro.md"
COMBINED_DST="$PROJECT_ROOT/Combined_CryptoBotPro.md"
CBP_SRC="$HOME/cbp.sh"
TOOLS_DIR="$PROJECT_ROOT/tools"
PROJECT_LOG_PATH="$PROJECT_ROOT/PROJECT_LOG.md"
REMOTE_URL="https://github.com/Toni-Saint-V/New_Dashboard.git"

ts() { date +"[%H:%M:%S]"; }

echo "$(ts) 📂 PROJECT_ROOT: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# 1) Дублируем Combined-промпт в проект
if [[ -f "$COMBINED_SRC" ]]; then
  cp "$COMBINED_SRC" "$COMBINED_DST"
  echo "$(ts) ✅ Скопировал Combined_CryptoBotPro.md в проект."
else
  echo "$(ts) ⚠️ Не нашёл $COMBINED_SRC — пропускаю копирование промпта."
fi

# 2) Дублируем cbp.sh в tools/
if [[ -f "$CBP_SRC" ]]; then
  mkdir -p "$TOOLS_DIR"
  cp "$CBP_SRC" "$TOOLS_DIR/cbp.sh"
  echo "$(ts) ✅ Скопировал cbp.sh в tools/cbp.sh."
else
  echo "$(ts) ⚠️ Не нашёл $CBP_SRC — пропускаю копирование cbp.sh."
fi

# 3) PROJECT_LOG.md — если вдруг нет
if [[ ! -f "$PROJECT_LOG_PATH" ]]; then
  echo "$(ts) 📝 Создаю PROJECT_LOG.md"
  cat << EOF > "$PROJECT_LOG_PATH"
# CryptoBot Pro — PROJECT LOG

## Init
- Лог создан перед первым пушем на GitHub.
- Дата создания: $(date +"%Y-%m-%d %H:%M:%S")
- PROJECT_ROOT: $PROJECT_ROOT

## Changes
- (изменения появятся после работы Bot Architect)
EOF
else
  echo "$(ts) ✅ PROJECT_LOG.md уже существует."
fi

# 4) Git init (если нужно)
if [[ ! -d ".git" ]]; then
  echo "$(ts) 🧬 git init"
  git init
else
  echo "$(ts) ✅ Git-репозиторий уже инициализирован."
fi

# 5) Привязываем remote origin к New_Dashboard
if git remote | grep -q "^origin$"; then
  echo "$(ts) 🔁 Удаляю старый origin."
  git remote remove origin
fi
echo "$(ts) 🔗 Добавляю origin: $REMOTE_URL"
git remote add origin "$REMOTE_URL"

# 6) Добавляем всё в индекс
echo "$(ts) ➕ git add ."
git add .

# 7) Коммит
echo "$(ts) 💾 git commit"
if ! git commit -m "Initial commit: CryptoBot Pro dashboard & tooling"; then
  echo "$(ts) ℹ️ Коммит не создан (возможно, нет изменений)."
fi

# 8) Ветка main и пуш
echo "$(ts) 🌿 Переключаюсь на main"
git branch -M main || true

echo "$(ts) 🚀 git push -u origin main"
git push -u origin main

echo "$(ts) ✅ Готово: проект залит в GitHub → $REMOTE_URL"
