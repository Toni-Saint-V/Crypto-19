# CSS Fixes Summary - Критические исправления

## Что поправил по пунктам 1–4

### 1. ✅ Исправлены некорректные CSS конкатенации (dd/40)

**Проблема:** Конструкции типа `${accentColor}dd` / `${accent.color}40` не работают с CSS variables.

**Решение:**
- Добавлены токены для glow в `index.css`:
  - `--accent-backtest-glow: rgba(168, 85, 247, 0.25)`
  - `--accent-live-glow: rgba(20, 184, 166, 0.25)`
  - `--accent-test-glow: rgba(245, 158, 11, 0.25)`
- В `TopBar.tsx`:
  - `ModeButton` использует `accent.bg` и `accent.glow` вместо градиентов с конкатенацией
  - Primary CTA использует `accent.bg` и `accent.glow` вместо `${accent.color}dd` и `${accent.color}40`
- В `BacktestResultsPanel.tsx`:
  - Run button использует `var(--accent-backtest-bg)` вместо градиента с `dd`

**Файлы:** `index.css`, `TopBar.tsx`, `BacktestResultsPanel.tsx`

---

### 2. ✅ Убран `window.innerHeight` из render, используется CSS `40vh`

**Проблема:** `Math.floor(window.innerHeight * 0.4)` в render вызывает баги при ресайзе окна и SSR.

**Решение:**
- Удалена строка: `const maxHeight = Math.floor(window.innerHeight * 0.4)`
- В стиле drawer добавлено: `maxHeight: isExpanded ? '40vh' : 'none'`
- `height` теперь: `isExpanded ? drawerHeight : collapsedHeight`
- Clamp в ресайзе остался (96px..380px), ограничение 40vh делает CSS

**Файлы:** `BacktestResultsPanel.tsx`

---

### 3. ✅ Убран фейковый PnL и хардкод красного

**Проблема:** 
- Фейковый PnL: `${(kpi.totalTrades * 10).toFixed(0)}`
- Хардкод красного: `#ef4444`

**Решение:**
- Добавлен токен `--status-loss: #ef4444` в `index.css`
- PnL извлекается из данных: `totalPnl ?? pnl ?? total_pnl ?? total_pnl_usd ?? profit`
- Если не найдено → показывается "—"
- DD использует `var(--status-loss)` вместо `#ef4444`
- Error border использует `var(--status-loss-border)`

**Файлы:** `index.css`, `BacktestResultsPanel.tsx`

---

### 4. ✅ Monte Carlo tab: убраны teal цвета, используются backtest акценты

**Проблема:** Monte Carlo tab использовал `#21D4B4` (live-teal), что ломало сцену Backtest.

**Решение:**
- Все `focus:border-[#21D4B4]` заменены на `onFocus` handlers с `var(--accent-backtest-border)`
- Кнопка "Run Monte Carlo":
  - `bg-[#21D4B4]` → `var(--accent-backtest-bg)`
  - `hover:bg-[#1bb89a]` → `onMouseEnter` с `var(--accent-backtest)`
  - `shadow-[0_0_8px_rgba(33,212,180,0.3)]` → `var(--accent-backtest-glow)`
- "Analysis Summary" блок:
  - `border-[#21D4B4]/30` → `var(--accent-backtest-border)`
  - `bg-[#21D4B4]/5` → `var(--accent-backtest-bg)`
  - `text-[#21D4B4]` → `var(--accent-backtest)`

**Файлы:** `BacktestResultsPanel.tsx`

---

## Изменённые файлы

1. **`web/dashboard-react/src/index.css`**
   - Добавлены токены: `--accent-*-glow` для всех режимов
   - Добавлены токены: `--status-loss`, `--status-loss-bg`, `--status-loss-border`

2. **`web/dashboard-react/src/components/TopBar.tsx`**
   - Убраны конкатенации `dd`/`40` в `ModeButton`
   - Используются токены `accent.bg` и `accent.glow`
   - Primary CTA использует токены вместо градиентов

3. **`web/dashboard-react/src/components/BacktestResultsPanel.tsx`**
   - Убран `window.innerHeight`, используется CSS `40vh`
   - Убран фейковый PnL, извлекается из данных или "—"
   - Заменён `#ef4444` на `var(--status-loss)`
   - Monte Carlo tab использует backtest акценты вместо teal

---

## Мини-проверка

✅ **Режимы переключаются** → нет странных "dd" градиентов, все цвета через токены
✅ **Drawer в backtest** → работает как раньше, max-height через CSS `40vh`
✅ **Monte Carlo** → выглядит backtest-тематикой (purple), без live-teal

---

## Результат

✅ Все CSS конкатенации убраны
✅ Все цвета через токены (никаких хардкод hex)
✅ Drawer использует CSS `40vh` вместо JS вычислений
✅ Monte Carlo в backtest-стиле

