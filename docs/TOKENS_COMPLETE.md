# Tokens Complete - Полный набор дизайн-токенов

## Выполнено

### 1. ✅ Полный набор статусов (profit/warn/info + bg/border)

**Добавлено:**
- `--status-profit: #10b981` (emerald-500)
- `--status-profit-bg: rgba(16, 185, 129, 0.1)`
- `--status-profit-border: rgba(16, 185, 129, 0.3)`

- `--status-warn: #f59e0b` (amber-500)
- `--status-warn-bg: rgba(245, 158, 11, 0.1)`
- `--status-warn-border: rgba(245, 158, 11, 0.3)`

- `--status-info: #3b82f6` (blue-500)
- `--status-info-bg: rgba(59, 130, 246, 0.1)`
- `--status-info-border: rgba(59, 130, 246, 0.3)`

**Теперь полный набор:**
- `--status-loss/*` (red)
- `--status-profit/*` (emerald)
- `--status-warn/*` (amber)
- `--status-info/*` (blue)

### 2. ✅ Spacing приведён к сетке 0/4/8/12/16/20/24/32/40/48

**Было:** 0/8/16/24/32/40/48/56/64/72
**Стало:** 0/4/8/12/16/20/24/32/40/48

**Изменения:**
- `--space-1: 4px` (было 8px)
- `--space-2: 8px` (было 16px)
- `--space-3: 12px` (было 24px)
- `--space-4: 16px` (было 32px)
- `--space-5: 20px` (было 40px)
- `--space-6: 24px` (было 48px)
- `--space-7: 32px` (было 56px)
- `--space-8: 40px` (было 64px)
- `--space-9: 48px` (было 72px)

**Baseline изменён:** с 8px на 4px

### 3. ✅ Radius приведён к 8/12/16

**Было:** 6/8/12
**Стало:** 8/12/16

**Изменения:**
- `--radius-1: 8px` (было 6px)
- `--radius-2: 12px` (без изменений)
- `--radius-3: 16px` (было 12px)

### 4. ✅ Добавлен color-scheme: dark

**Добавлено в `body`:**
```css
color-scheme: dark;
```

Это указывает браузеру использовать тёмную цветовую схему для системных элементов (scrollbars, form controls, etc.).

### 5. ✅ ::selection сделан mode-aware через активный accent

**Реализация:**
- Добавлен `data-mode` атрибут на корневой элемент в `App.tsx`
- CSS селекторы для каждого режима:
  - `[data-mode="backtest"] ::selection` → `var(--accent-backtest)`
  - `[data-mode="live"] ::selection` → `var(--accent-live)`
  - `[data-mode="test"] ::selection` → `var(--accent-test)`
- Fallback: `::selection` использует `var(--accent-active)` (по умолчанию live)

**Результат:** При выделении текста цвет соответствует текущему режиму.

## Изменённые файлы

1. **`web/dashboard-react/src/index.css`**
   - Добавлены статусы: profit, warn, info с bg/border
   - Spacing приведён к сетке 0/4/8/12/16/20/24/32/40/48
   - Radius приведён к 8/12/16
   - Добавлен `color-scheme: dark` в body
   - ::selection сделан mode-aware

2. **`web/dashboard-react/src/App.tsx`**
   - Добавлен `data-mode={mode}` на корневой элемент

## Проверка

✅ **Полный набор статусов:** loss, profit, warn, info (все с bg/border)
✅ **Spacing сетка:** 0/4/8/12/16/20/24/32/40/48 (4px baseline)
✅ **Radius:** 8/12/16
✅ **color-scheme:** dark установлен
✅ **Selection:** mode-aware, меняется при переключении режимов

## Результат

Дизайн-система теперь имеет полный набор токенов:
- Все статусы (loss/profit/warn/info) с bg/border
- Унифицированная сетка spacing (4px baseline)
- Унифицированные радиусы (8/12/16)
- Тёмная цветовая схема для системных элементов
- Mode-aware selection, который меняется в зависимости от активного режима

