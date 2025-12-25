# BacktestResultsPanel Tokens Cleanup Summary

## Выполнено

### 1. ✅ Заменены все хардкодные tailwind-цвета на токены

**Results tab:**
- `border-white/10 bg-black/20` → `border: '1px solid var(--stroke)', background: 'var(--surface-2)'`
- `text-white/60` → `color: 'var(--text-3)'`
- Max Drawdown использует `var(--status-loss)` для цвета значения

**Trades table:**
- `bg-black/40 text-white/60` → `background: 'var(--surface-3)', color: 'var(--text-3)'`
- `border-white/5 odd:bg-white/[0.01]` → `borderTop: '1px solid var(--stroke)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)'`
- Все `<td>` используют `color: 'var(--text-1)'`

**Logs tab:**
- `bg-black/30 text-white/80` → `background: 'var(--surface-2)', color: 'var(--text-2)'`

**Monte Carlo tab:**
- Все `border-white/10 bg-black/20` → токены `var(--stroke)` и `var(--surface-2)`
- Все `text-white/60`, `text-white/90`, `text-white/40` → `var(--text-3)`, `var(--text-1)`, `var(--text-3)`
- `bg-black/40` → `var(--surface-3)`
- `text-rose-300` → `var(--status-loss)`
- `text-white/70` → `var(--text-2)`
- Все select/input используют токены вместо `bg-black/40 border-white/10 text-white`
- `rgba(255, 255, 255, 0.1)` в onBlur → `var(--stroke)`

**Raw tab:**
- `text-white/60` → `var(--text-3)`
- `border-white/10 bg-black/30` → `var(--stroke)` и `var(--surface-2)`

**Run button:**
- `'white'` → `'var(--text-1)'` (контрастный текст на акцентном фоне)

**Monte Carlo button hover:**
- `'white'` → `'var(--text-1)'`

### 2. ✅ Sticky header в Trades-таблице

**Добавлено:**
- `position: 'sticky'` на `<thead>`
- `top: 0`
- `background: 'var(--surface-3)'` (фон через токен)
- `zIndex: 10`

**Результат:** При скролле внутри drawer заголовок таблицы остаётся видимым сверху.

### 3. ✅ Placeholder color через CSS

**Добавлено в `index.css`:**
```css
input::placeholder {
  color: var(--text-3);
  opacity: 1;
}
```

## Изменённые файлы

1. **`web/dashboard-react/src/components/BacktestResultsPanel.tsx`**
   - Все хардкодные tailwind-цвета заменены на токены
   - Sticky header в Trades-таблице
   - Все цвета через CSS variables

2. **`web/dashboard-react/src/index.css`**
   - Добавлен стиль для `input::placeholder` с токеном `var(--text-3)`

## Проверка

✅ **Визуально Backtest сцена полностью на токенах:**
- Нет хардкодных `white/rose/black` цветов
- Все фоны через `var(--surface-*)`
- Все границы через `var(--stroke)`
- Все тексты через `var(--text-*)`
- Статусы через `var(--status-loss/*)`
- Акценты через `var(--accent-backtest/*)`

✅ **Sticky header работает:**
- При скролле внутри drawer заголовок таблицы остаётся видимым
- Фон заголовка через `var(--surface-3)`

## Результат

BacktestResultsPanel полностью использует дизайн-токены, без хардкодных цветов. Визуально сцена Backtest единообразна и соответствует дизайн-системе.

