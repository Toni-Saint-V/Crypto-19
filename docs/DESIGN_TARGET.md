# DESIGN TARGET - CryptoBot19Clean Dashboard (ref: dark neon terminal)

Цель: интерфейс в стиле "Bot Analytics Dashboard" (dark, glass, neon accent), с четкой иерархией: chart главный, чат справа, backtest результаты не ломают компоновку, и есть расширенная аналитика включая Monte Carlo.

## 1) Layout (строго)
- Нет page scroll: страница не прокручивается.
- Вся компоновка помещается в 100vh.
- Главная сетка: 2 колонки.
  - Левая: Top bar + KPI row + Chart (hero) + Bottom drawer (backtest analytics).
  - Правая: Chat panel фиксированной ширины.
- Внутренний скролл допускается только внутри:
  - chat messages
  - raw payload
  - длинные списки (trades/logs)
  - содержимое drawer (tabs), если контент длинный

## 2) Визуальный стиль (как на референсе)
- Темный фон + мягкий градиент.
- Панели "glass" (полупрозрачные карточки) + аккуратные тени.
- Неон-акцент (один основной цвет, например синий) для активных состояний и ключевых линий.
- Плотная типографика, единая сетка отступов.
- Никаких dev-текстов в UI (все debug только в raw/tooltip).

## 3) Верхняя зона (над chart)
Top bar (всегда виден):
- Mode selector: Backtest / Test / Live + всегда видимый badge активного режима.
- Symbol, Timeframe, Exchange (компактно).
- Run/Stop (по режиму), статус подключения, last update.

KPI row (всегда видна):
- Equity, Net PnL, Max Drawdown, WinRate, Trades, Sharpe (4-6 штук).
- Если данных нет: empty state, не показывать "0.00" как будто это реальная метрика.

## 4) Chart zone (hero)
- Всегда видим.
- Оверлеи:
  - entry/exit markers (обязательно)
  - позиции (опционально)
  - equity overlay (опционально)
- Легенда компактная, не перекрывает график.

## 5) Bottom drawer (backtest analytics) - ключ
- По умолчанию свернут.
- Открывается внутри экрана и не выталкивает chart вниз.
- Имеет max-height (примерно 35-45% экрана).
- Внутри drawer свой scroll.
- Вкладки drawer (минимум):
  1) Results (KPI + summary)
  2) Trades (таблица/список)
  3) Logs (список)
  4) Monte Carlo (обязательно)
  5) Raw (свернут по умолчанию)

## 6) Monte Carlo (обязательно)
Цель: оценка устойчивости стратегии и риска.

UI в табе "Monte Carlo":
- Controls:
  - Iterations (например 500/1000/5000)
  - Method: bootstrap returns / trade shuffling / block bootstrap
  - Horizon: N days / N trades
  - Seed (опционально)
- Output:
  - Histogram финального результата (equity или pnl)
  - Fan chart (percentile bands 5/25/50/75/95) поверх equity по времени/по сделкам
  - Risk KPIs: VaR, CVaR, Probability of ruin, Expected drawdown, Worst-case percentile
  - Short explanation текстом (1-3 абзаца) для пользователя

При отсутствии данных:
- Явный empty state: "Запусти backtest чтобы построить Monte Carlo".

## 7) Chat panel (справа)
- Фиксированная ширина.
- Header: Assistant + context chips (mode/symbol/tf).
- Messages: scroll внутри.
- Input pinned снизу.
- Быстрые action buttons:
  - Explain drawdown
  - Why entries?
  - Optimize params
  - Risk warnings

## 8) CSS требования (критично)
- Root/app: height:100vh и overflow:hidden.
- Для flex/grid детей с overflow: обязательно min-height:0.
- Chat container: overflow:hidden, messages list: overflow:auto.
- Drawer container не должен влиять на layout chart; overflow только внутри drawer.

## 9) Acceptance criteria (приемка)
- Нет page scroll.
- Chart всегда видим.
- Drawer открывается/закрывается, не ломая высоту chart.
- Chat работает как терминальная панель: сообщения скроллятся внутри, input всегда на месте.
- Monte Carlo таб присутствует, имеет controls + графики/плейсхолдеры + risk KPIs.
- Переключение режимов 10 раз не оставляет хвостов данных.
