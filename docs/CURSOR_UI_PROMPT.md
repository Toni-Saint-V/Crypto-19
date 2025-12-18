Ты Frontend (Cursor). Задача: починить layout и UX для BACKTEST/TEST, не ломая LIVE.

Смотри:
- docs/MAP.md
- docs/UX_ISSUES.md
- docs/TASKS.md (P0-1 и P0-4 приоритет)
- docs/TESTPLAN.md

Цели (жестко):
1) Нет page scroll. Всё помещается в 100vh.
2) Chart всегда видим.
3) Chat справа фикс ширины, внутренний скролл сообщений, input pinned снизу.
4) BACKTEST результаты не выталкивают chart: делаем bottom drawer (collapsed by default) с max-height и внутренним scroll.
5) Режимы BACKTEST/LIVE/TEST визуально и логически разделены: видимый mode badge + отключение неуместных контролов.

Что сделать (минимальный набор, без лишнего рефакторинга):
A) Layout 100vh
- На уровне root (body/#root/app wrapper) выставить height: 100vh и overflow: hidden.
- Основной контейнер сделать grid/flex так, чтобы:
  - центральная зона chart занимала всё доступное место
  - правая зона chat фикс ширины
  - bottom drawer занимает место внутри экрана и скроллится внутри

B) Min-height:0 (критично)
- Для flex/grid детей, где есть overflow, обязательно min-height: 0.
- Иначе будет page scroll и "уезжание".

C) Bottom drawer для backtest
- Drawer скрыт по умолчанию.
- Имеет max-height (например 35-45% экрана), overflow: auto.
- Внутри drawer: tabs или секции Results / Trades / Logs (можно минимально: tabs).
- Важно: drawer не должен менять высоту chart зоны (chart должен остаться видим).

D) Empty/Loading/Error states
- Убрать "0.00" когда нет данных, показать empty state.
- Любая загрузка данных: loading state.
- Любая ошибка API: понятный error state (не в консоли).

E) Mode UI (P0-4)
- Всегда видимый индикатор режима (banner/badge).
- Контролы включены/выключены строго по режиму.

Acceptance checks:
- Страница не скроллится (колесо мыши не двигает страницу).
- Чат скроллится внутри, инпут не прыгает.
- BACKTEST drawer открывается и скроллится внутри, chart остается видим.
- Переключение режимов 10 раз не оставляет "хвостов" на графике/метриках.

Выведи список файлов, которые ты менял, и коротко какие изменения сделал по пунктам A-E.
