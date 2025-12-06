# CryptoBot Pro — PROJECT LOG

## 0. Meta
- PROJECT_ROOT: /Users/user/cryptobot_pro
- Repo: https://github.com/Toni-Saint-V/New_Dashboard
- AI: BotArchitect (ChatGPT) + GitHub Copilot + Codex

## 1. Current State (dashboard)
- Есть старый и новый дашборд (templates + static/js + static/css).
- Подключен lightweight-charts, но график ведёт себя странно.
- WebSocket-логика частично реализована, местами дублируется.
- Статусы подключения и индикаторы сделаны не до конца.
- Бэк-тест как система ещё не реализован, есть только основа.

## 2. Known Problems
- Странное поведение графика (свечи, масштаб, цена, уход в никуда).
- Возможные ошибки в WebSocket-подписках/обновлении данных.
- Дублирование CSS/JS между старым и новым дашбордом.
- Нет нормальных маркеров входа/выхода по сделкам.
- Нет удобной подсветки информации по сделке (tooltip).
- Нет бэктеста с выбором периода и стратегий.
- Нет AI/ML слоя, который помогает со стратегиями.

## 3. Immediate TODO (priority)
1) Привести в порядок dashboard_new.js:
   - нормализовать работу с lightweight-charts
   - сделать стабильное обновление по WebSocket
   - реализовать адекватное переключение таймфреймов (1m–1w)
2) Добавить на график сделки:
   - маркеры входа/выхода (стрелочки long/short)
   - линию между входом и выходом
   - tooltip с полной информацией по сделке
3) Заложить основу для бэктеста:
   - endpoint /api/backtest
   - формат запросов/ответов
   - вывод сделок и equity curve на фронте
4) Подготовить hook для AI/ML:
   - сбор результатов бэктестов
   - простой endpoint /api/strategy_suggestions

## 4. Done (history)
- 2025-12-07: Инициализирован репозиторий New_Dashboard, добавлены BotArchitect-промт, скрипты и базовый PROJECT_LOG.
