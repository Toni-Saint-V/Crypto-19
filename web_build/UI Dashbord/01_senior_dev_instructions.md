# Инструкция для старшего разработчика — CryptoBot Pro Dashboard

## 1. Контекст и цель
Этот пакет — хэнд-офф по UI/UX для реализации дашборда CryptoBot Pro.
Цель: быстрый контроль статуса бота и управление бэктестом / стратегиями с TTR < 5 c.

Основные пользователи:
- Trader Pro — быстрый просмотр позиций, PnL и рисков.
- Quant/Research — запуск и сравнение бэктестов, изменение параметров стратегий.
- Novice — безопасный вход через TESTNET и подсказки.

## 2. Архитектура фронтенда (рекомендуемая)
Технологический стек — на усмотрение команды, но рекомендовано:
- React / Next.js (SSR желательно, но не обязательно)
- State management: Zustand или Redux Toolkit
- Charts: Lightweight-Charts v4 (standalone)
- i18n: локализация RU/EN через словарь (strings.json)
- Стили: CSS variables (design tokens) + CSS Modules/Styled Components/Tailwind

### Структура проекта (пример)
src/
 ├─ components/
 │   ├─ TopBar/
 │   ├─ KPICards/
 │   ├─ Chart/
 │   ├─ StrategyPanel/
 │   ├─ Tabs/
 │   ├─ Toasts/
 │   └─ Tables/
 ├─ modules/
 │   ├─ trading/          # работа с позициями, ордерами
 │   ├─ backtest/         # запуск/статус/метрики бэктеста
 │   └─ strategies/       # пресеты и параметры стратегий
 ├─ store/
 │   ├─ ui/               # табы, состояния загрузки, модалки
 │   ├─ data/             # свечи, сделки, equity
 │   └─ connection/       # статус сети, режим LIVE/TESTNET
 ├─ styles/
 │   ├─ tokens.css        # дизайн-токены
 │   └─ theme.css         # базовые темы и reset
 ├─ assets/
 └─ utils/

## 3. Design Tokens (CSS переменные)
Файл: styles/tokens.css

:root {
  --bg: #0b1321;
  --panel: #111a2b;
  --grid: #1b2740;
  --text: #c3cee5;
  --accent: #4dabf7;
  --ok: #2bb988;
  --bad: #ff6b6b;

  --font-family-base: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;

  --font-12: 12px;
  --font-14: 14px;
  --font-16: 16px;
  --font-20: 20px;
  --font-24: 24px;

  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --space-32: 32px;

  --radius-8: 8px;
  --radius-10: 10px;
  --radius-12: 12px;

  --shadow-card: 0 8px 16px rgba(0,0,0,0.16);
}

## 4. Основные экраны и зоны

### 4.1 Top-bar
Содержимое:
- Logo
- Symbol selector (BYBIT, например BTCUSDT)
- Timeframe select (1m / 5m / 15m / 1h / 4h / 1d)
- Mode switch (LIVE / TESTNET) с цветовым бейджем
- Network status (online / offline)
- Кнопка "Ask AI"

Требования:
- Минимум визуального шума.
- На десктопе занимает одну строку, без переносов.

### 4.2 KPI Cards (всегда закреплены)
Набор KPI:
- Balance
- P/L 24h
- Positions (кол-во активных)
- Margin usage / Leverage
- Regime (LIVE/TESTNET)
- Model status (Idle / Running / Error)

Поведение:
- Виден на всех брейкпоинтах (на малых — в 2 ряда).
- Обновляется по локальному/стриминговому источнику данных.

### 4.3 Main Area — две колонки (>=1440px)

**Левая колонка (~70%) — Chart module**
- Библиотека: Lightweight-Charts v4
- Слои:
  - Свечи (основной график)
  - SMA20/50/200 с переключателями
  - Trade-markers (BUY/SELL с time+price)
  - Линии Entry/SL/TP
  - Equity-curve [%] с отдельной шкалой слева
- Элементы управления:
  - Колесо мыши — zoom
  - Drag — панорама
  - Кнопки диапазона: 100 / 200 / 300 / 500 / ALL (горячие клавиши: 1–5)
  - Reset zoom (hotkey: Z)
  - Переключатель индикаторов (I)
- Экспорт:
  - PNG/SVG текущего кадра
  - Копирование в буфер (через canvas.toBlob)

**Правая колонка (~30%) — Strategy & Backtest Panel**
Поля:
- Candles (N или ALL)
- Risk $
- TP×R
- Max positions
- Day stop %
- DD stop %
- Preset select (dropdown)

Кнопки:
- Run backtest (hotkey: R)
- Stop
- Save preset
- Compare with previous (открывает модальное сравнение equity)

Состояния панели:
- idle
- running (disable полей, показать spinner)
- done
- error (показать текст ошибки)

Экспорт:
- Download CSV (список сделок)
- Download JSON (summary бэктеста)

### 4.4 Bottom Tabs
Табы:
- Signals
- Positions
- Orders
- Backtest Metrics
- Logs

Каждый таб — отдельный модуль с API-запросами/стором.
Минимальные требования:
- Таблицы сортируемые
- Фильтры по дате/направлению/символу там, где логично

## 5. Состояния интерфейса

### Loading
- Использовать skeleton UI:
  - прямоугольники вместо KPI
  - серый блок вместо графика
  - плашки вместо таблиц

### Empty
- Текст вида: “Нет данных. Запустите бэктест или включите стратегию.”
- Кнопка CTA: Run backtest

### Error
- Красный баннер с текстом ошибки (из API)
- Всплывающий toast (error)

### Offline
- Серый баннер в топ-баре
- Попытки тихого reconnect, иконка статуса

### Live / Testnet
- LIVE — тёплый/красный бейдж
- TESTNET — холодный/синий бейдж
- Переключение с TESTNET на LIVE только через confirm-диалог.

## 6. API-интеграция (на основе текущего прототипа)
Сервер слушает порт (по умолчанию 8010). Примеры эндпоинтов:

- GET /api/candles
  - Возвращает массив свечей:
    - time, open, high, low, close, volume
  - Пример уже используется в текущем прототипе.

- POST /api/backtest/run
  - Тело: { "limit": number, "risk": number, "tp_r": number, "max_pos": number, ... }
  - Ответ: объект с return_pct, trades, equity_series[].

- GET /api/backtest/summary
  - Подытоговые метрики бэктеста:
    - return_pct
    - trades
    - equity_series[]

Фронтенд должен быть готов к случаям:
- backtest ещё не запускался (empty)
- backtest в процессе (running)
- ошибка расчёта (error)

## 7. Локализация (RU/EN)
Все строки UI вынесены в словарь, например:
- src/i18n/strings.ru.json
- src/i18n/strings.en.json

Пример ключей:
- "topbar.symbol"
- "topbar.mode_live"
- "kpi.balance"
- "kpi.pnl_24h"
- "chart.export_png"
- "strategy.run_backtest"
- ...

Требования:
- Строки не должны жёстко пришиваться в JSX/шаблоны.
- Учитывать разную длину строк (особенно в кнопках и табах).

## 8. Потоки (flows)

### Flow 1 — Первый вход
1. Нет пользовательских данных → авто-подключение демо-свечей.
2. KPI показывают demo/placeholder значения.
3. На панели стратегий подсвечена кнопка “Run backtest” как основной CTA.

### Flow 2 — Переключение TESTNET → LIVE
1. Пользователь меняет переключатель режима.
2. Открывается модалка с текстом-предупреждением.
3. Подтверждение → смена режима и визуального бейджа.

### Flow 3 — Просмотр сделки
1. Клик по маркеру сделки на графике.
2. Открывается всплывающее окно (popover):
   - Entry time/price
   - Exit time/price
   - PnL %, R
   - Duration
3. Подсвечиваются линии SL/TP на графике.

## 9. Требования по доступности
- Контраст ≥ 4.5:1
- Фокус-кольца для интерактивных элементов (клавиатурная навигация)
- ARIA-атрибуты для табов, переключателей, кнопок
- Горячие клавиши:
  - R — Run backtest
  - Z — Reset zoom
  - 1/2/3/4/5 — диапазоны
  - I — Toggle indicators

## 10. Хэнд-офф и дальнейшая работа
- Базовый UI собирать как библиотеку компонентов (Design System light)
- Состояния (loading/error/empty/offline) делать частью компонента, а не ad-hoc костылями.
- Все ключевые параметры и цвета — только через токены.

Если что-то в текущей реализации сервера мешает UX (например, формат данных или задержки), допускаются изменения API по согласованию, но без нарушения описанной логики UI.
