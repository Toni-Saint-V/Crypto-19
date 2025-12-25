Ты Frontend (Cursor) по CryptoBot19Clean. Твоя задача: сделать UI максимально похожим по стилю на референс "Bot Analytics Dashboard" (dark neon, glass, фоновые волны, премиальная типографика), и реализовать ключевые элементы продукта: 100vh без page scroll, chart hero, chat справа, bottom drawer для backtest, вкладка Monte Carlo.

Важно: элементы "ноутбук/телефон" на референс-картинке используются только как визуальная отсылка к стилю, их НЕ нужно добавлять в UI как отдельные блоки.

Источник правды:
- docs/REFERENCE_STYLE.md
- docs/DESIGN_TARGET.md
- docs/FEATURES_SCOPE.md
- docs/UX_ISSUES.md
- docs/TESTPLAN.md
- docs/TASKS.md

Жесткие требования:
1) Нет page scroll. Вся страница в 100vh.
2) Внутренний scroll только в: чат, raw payload, длинные списки (trades/logs), содержимое drawer.
3) Chart всегда видим (герой экрана).
4) BACKTEST результаты не выталкивают chart вниз: только bottom drawer.

Сделай минимально, без лишнего рефакторинга:

A) Layout 100vh (no page scroll)
- Root/app wrapper: height:100vh; overflow:hidden.
- Главный layout: 2 колонки (лево контент, право чат).

B) Min-height:0 (критично)
- В flex/grid детях с overflow обязательно min-height:0.

C) Верхняя зона над chart (как у референса по плотности и стилю)
- Top bar: Mode selector Backtest/Test/Live + badge всегда видим, symbol/tf, Run/Stop по режиму, статус.
- Под top bar: KPI row 4-6 метрик (Equity, PnL, DD, WinRate, Trades, Sharpe). Empty/Loading/Error state вместо "0.00".

D) Chart hero
- Chart занимает максимум высоты, не скрывается drawer.
- Поддержка entry/exit markers (если данные появятся позже).

E) Bottom drawer (Backtest analytics)
- Drawer collapsed by default.
- max-height ~35-45% экрана, overflow:auto внутри.
- Tabs: Results, Trades, Logs, Monte Carlo, Raw.
- Drawer не должен убирать chart с экрана.

F) Monte Carlo tab (UI обязателен, расчеты можно stub)
- Controls: iterations (500/1000/5000), method (bootstrap returns / trade shuffle / block bootstrap), horizon (N days/N trades), seed optional.
- Output placeholders: histogram, fan chart percentiles, risk KPIs (VaR, CVaR, probability of ruin, expected drawdown).
- Empty state если нет backtest данных.

G) Chat справа
- Фикс ширина.
- Messages scroll внутри.
- Input pinned снизу.
- Быстрые actions: Explain drawdown, Why entries, Optimize params, Risk warnings.

H) Стиль как референс
- Dark background с мягкими градиентами.
- Фоновые волны/линии (легкий SVG) позади контента.
- Glass panels, единые радиусы, аккуратные тени.
- Один neon accent для активных состояний.
- Dev-тексты убрать из пользовательского UI (только raw/dev badge).

Acceptance:
- Страница не скроллится.
- Chart всегда видим.
- Drawer открывается и скроллится внутри, не выталкивая chart.
- Chat фиксирован, input pinned.
- Monte Carlo tab присутствует и выглядит как продукт.
- Переключение режимов 10 раз без хвостов (по docs/TESTPLAN.md).

Выход:
1) Список измененных файлов.
2) Коротко что сделано по пунктам A-H.
3) Как проверить по docs/TESTPLAN.md.
