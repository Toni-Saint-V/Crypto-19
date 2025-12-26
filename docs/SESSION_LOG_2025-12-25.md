# Session log (2025-12-25)

## Контекст
- Проект: CryptoBot Pro / CryptoBot19Clean
- Инструмент: Cursor Pro+ (колесо usage = включённый пул дорогих запросов; Cursor не "умирает", просто меняется режим/оверэйдж/авто-модель)
- Требования к работе: один большой шаг, минимум ручных действий, по возможности одна команда; терминал-команды безопасные, одним блоком, heredoc EOF без мусора.

## Договорённости по общению/процессу
- Ты хочешь: 2 блока ответа ("ЧТО ДЕЛАТЬ МНЕ" и "ЧТО ЭТО ВСЕ СДЕЛАЕТ"), без воды.
- Статусы: `///` = шаг сделан; `!` = всё плохо/шаг провален.
- Никаких повторов одного и того же: либо автоматом чиним и проверяем, либо сразу показываем точную следующую ошибку.

## Что уже проверено локально
- `bash scripts/verify.sh` проходит:
  - python compileall
  - ruff check (OK)
  - pytest (5 passed)
  - api smoke (boot_once): /api/candles, /api/trades, /api/equity, /api/metrics, /api/dashboard, /api/ml/score -> 200
  - autoscan doc pin (dry) OK

## Текущий реальный фейл (npm run verify)
TypeScript build падает:
1) `src/App.tsx`: App передаёт в `<ChartArea ... historyPreset=...>` — но `ChartAreaProps` не содержит `historyPreset`.
2) `src/App.tsx`: `onHistoryDateChange={(which, value) => ...}` — `which` и `value` с implicit any.
3) `src/components/ChartArea.tsx`: `<BacktestResultsPanel ...>` — не прокинуты обязательные `history*` пропсы, которые ожидает `BacktestResultsPanelProps`.

## Технические заметки
- `rg` (ripgrep) в системе не найден (`zsh: command not found: rg`) — использовать `grep`/`find`, либо ставить ripgrep отдельно.

## Новый фейл и фикс (JSX)
- `ChartArea.tsx` сломался синтаксически из-за автоподстановки пропсов в `<BacktestResultsPanel ...>`: ранее поиск конца тега ошибочно ловил `>` внутри `=>` (arrow function) в JSX-атрибуте.
- Исправлено: поиск конца JSX-тега теперь игнорирует `>` внутри `{...}` и кавычек; пропсы вставляются строго перед закрытием тега.

## FIX STEP (ChartArea JSX)
- В `ChartArea.tsx` был сломан JSX (`TS1005: '>' expected`) вокруг `<BacktestResultsPanel ...>`.
- Действие: восстановление `ChartArea.tsx` из `.bak` (если был), затем безопасная пересборка opening-tag и корректная вставка `history*` props.

## FIX STEP (props rename)
- TS2322: `BacktestResultsPanelProps` не имеет `historyRowCount` (ожидается `historyCount`).
- Исправлено в `ChartArea.tsx`: убран `historyRowCount={...}`, добавлен `historyCount={historyRowCount ?? 0}`.
