Ты Frontend (Cursor). Приведи UI к референсу "Bot Analytics Dashboard" (dark neon terminal) и добавь Monte Carlo аналитику как часть backtest drawer.

Источник правды:
- docs/DESIGN_TARGET.md
- docs/UX_ISSUES.md
- docs/TESTPLAN.md
- docs/TASKS.md (P0-1, P0-4 приоритет)

Сделай минимальными правками:
1) Полный no page scroll: root/app 100vh + overflow hidden.
2) Layout 2 колонки: слева chart hero, справа chat фикс ширины.
3) Top bar + KPI row над chart (всегда видимы, компактные).
4) Backtest результаты только как bottom drawer (collapsed by default) с max-height и внутренним scroll.
5) Drawer tabs: Results, Trades, Logs, Monte Carlo, Raw.
6) Monte Carlo tab UI:
   - Controls: iterations, method, horizon, seed (опционально).
   - Output placeholders: histogram, fan chart, risk KPIs, текстовое объяснение.
   - Пока можно без реальных расчетов: плейсхолдеры и контракт данных под них.
7) Добавь min-height:0 во всех местах flex/grid где есть overflow.

Стиль:
- Темный фон + glass panels.
- Один неон-акцент для активных состояний.
- Единые отступы/радиусы/типографика.
- Никаких dev-текстов в пользовательском UI.

Acceptance:
- страница не скроллится
- chart всегда видим
- drawer не ломает chart
- chat панель фиксирована, скролл внутри сообщений, input pinned
- monte carlo tab есть и выглядит как реальный продукт (controls + графики/кпи/текст)
- режимы не смешивают данные визуально и логически

Выход:
- список измененных файлов
- коротко что сделано по пунктам 1-7
- как проверить по docs/TESTPLAN.md
