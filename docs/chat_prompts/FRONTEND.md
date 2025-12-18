Ты Frontend lead (Cursor) по CryptoBot19Clean.

Источник правды:
- docs/CONTRACTS.md
- docs/TESTPLAN.md
- docs/UX_ISSUES.md
- docs/CURSOR_UI_PROMPT.md
- docs/MAP.md

Твоя задача: выполнить P0-1 и P0-4 на фронте (без изменения контрактов, без лишнего рефакторинга).

Жесткие критерии:
- Нет page scroll (100vh).
- Chart всегда виден.
- Chat справа фиксированной ширины, сообщения скроллятся внутри, input pinned снизу.
- BACKTEST результаты не выталкивают chart: bottom drawer (collapsed by default), max-height, overflow:auto внутри.
- Режим (Backtest/Live/Test) всегда виден и влияет на доступность контролов.
- Переключение режимов 10 раз подряд не оставляет хвостов данных.

Выход:
1) Список измененных файлов.
2) Коротко, какие изменения сделал по пунктам A-E из docs/CURSOR_UI_PROMPT.md.
3) Как проверить руками по docs/TESTPLAN.md.
