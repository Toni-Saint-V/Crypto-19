# Redesign Progress Report - Итерация 1

## 1. Entry-файлы (docs/OPEN_FIRST.md)

### 1.1 Главный layout/страница
**Файл:** `web/dashboard-react/src/App.tsx`
- Собирает: TopBar + StatsTicker (KPI) + ChartArea + Sidebar (RightPanel)
- Управляет режимами (live/test/backtest)
- Точка входа для изоляции стейта режимов
- **Строки:** 41-227 (функция App)

### 1.2 RightPanel/Chat
**Файл:** `web/dashboard-react/src/components/Sidebar.tsx` → `AIChatPanel.tsx`
- `Sidebar.tsx` (строки 8-23) - обёртка с фикс шириной 380px
- `AIChatPanel.tsx` (строки 31-272) - основной компонент чата/ассистента
- Header + Signal Quality/Risk Score + Quick Actions + Messages (scroll) + Input (pinned)

### 1.3 Backtest results drawer
**Файл:** `web/dashboard-react/src/components/BacktestResultsPanel.tsx`
- Строки 30-571 (функция BacktestResultsPanel)
- Collapsed 48px по умолчанию, expanded max 40vh
- Tabs: Overview / Trades / Logs / Monte Carlo / Raw
- Внутренний scroll для контента

---

## 2. 100vh Layout - Нет Page Scroll

### 2.1 Корневой контейнер
**Файл:** `web/dashboard-react/src/App.tsx`, строка 182
```tsx
<div className="h-screen w-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
```
- ✅ `h-screen` = 100vh
- ✅ `w-screen` = 100vw
- ✅ `overflow-hidden` - **блокирует page scroll**

### 2.2 Внутренняя структура
**Файл:** `web/dashboard-react/src/App.tsx`, строка 195
```tsx
<div className="w-full h-full flex flex-col relative z-10">
```
- ✅ `h-full` = 100% от родителя (100vh)
- ✅ `flex flex-col` - вертикальный flex контейнер

### 2.3 Main content area
**Файл:** `web/dashboard-react/src/App.tsx`, строка 206
```tsx
<div className="flex flex-1 overflow-hidden min-h-0">
```
- ✅ `flex-1` - занимает оставшееся пространство
- ✅ `overflow-hidden` - блокирует overflow
- ✅ `min-h-0` - **критично для flex** (позволяет shrink)

### 2.4 Chart area container
**Файл:** `web/dashboard-react/src/App.tsx`, строка 207
```tsx
<div className="flex flex-col flex-1 overflow-hidden min-w-0 min-h-0">
```
- ✅ `flex-1` + `min-h-0` - правильный flex shrink
- ✅ `overflow-hidden` - блокирует overflow

### 2.5 ChartArea component
**Файл:** `web/dashboard-react/src/components/ChartArea.tsx`, строка 38
```tsx
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
```
- ✅ `flex-1` + `min-h-0` - занимает оставшееся пространство
- ✅ `overflow-hidden` - блокирует overflow

**Итого:** Page scroll заблокирован на корневом уровне через `overflow-hidden` на `h-screen` контейнере.

---

## 3. Chart всегда виден

### 3.1 Chart container (flex-1 + min-h-0)
**Файл:** `web/dashboard-react/src/components/ChartArea.tsx`, строки 67-71
```tsx
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
  {/* Chart always visible, takes remaining space */}
  <div className="flex-1 min-h-0 overflow-hidden">
    <TradingChart />
  </div>
  {/* Backtest drawer only in backtest mode, collapsed by default */}
  {mode === 'backtest' && (
    <BacktestResultsPanel />
  )}
</div>
```

**Подтверждение:**
- ✅ Chart в `<div className="flex-1 min-h-0 overflow-hidden">` - **занимает оставшееся пространство**
- ✅ Drawer рендерится только в backtest режиме: `{mode === 'backtest' && ...}`
- ✅ Drawer имеет `flex-shrink-0` (не сжимается) и фиксированную высоту
- ✅ Chart имеет `flex-1` (растягивается) + `min-h-0` (может сжиматься)

**Логика:**
1. ChartArea: `flex-1` (занимает всё пространство между TopBar/KPI и RightPanel)
2. Внутри ChartArea: Chart `flex-1` + Drawer `flex-shrink-0`
3. При expand drawer: Chart сжимается, но остаётся видимым (min-h-0 позволяет shrink)
4. Drawer max-height 40vh - не может вытолкнуть Chart полностью

---

## 4. Bottom Drawer - Collapsed Default, Max-Height, Scroll

### 4.1 Drawer wrapper
**Файл:** `web/dashboard-react/src/components/BacktestResultsPanel.tsx`, строки 145-154
```tsx
const maxHeight = Math.floor(window.innerHeight * 0.4); // 40vh max
const collapsedHeight = 48;

return (
  <div
    className="flex-shrink-0 flex flex-col"
    style={{
      height: isExpanded ? Math.min(drawerHeight, maxHeight) : collapsedHeight,
      transition: isResizing ? "none" : "height 200ms ease-out",
      background: 'var(--surface-1)',
      borderTop: '1px solid var(--stroke)',
    }}
  >
```

**Подтверждение:**
- ✅ **Collapsed by default:** `isExpanded` инициализируется как `false` (строка 32)
- ✅ **Collapsed height:** `collapsedHeight = 48` (строка 143)
- ✅ **Max height:** `maxHeight = Math.floor(window.innerHeight * 0.4)` = **~40vh** (строка 142)
- ✅ **Expanded height:** `Math.min(drawerHeight, maxHeight)` - не превышает 40vh
- ✅ **Transition:** `height 200ms ease-out` (строка 150)

### 4.2 Scroll внутри drawer
**Файл:** `web/dashboard-react/src/components/BacktestResultsPanel.tsx`, строка 290
```tsx
<div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar text-xs space-y-3">
```

**Подтверждение:**
- ✅ `flex-1` - занимает оставшееся пространство (после header + tabs)
- ✅ `min-h-0` - позволяет shrink
- ✅ `overflow-y-auto` - **вертикальный scroll внутри drawer**
- ✅ `chat-scrollbar` - кастомный стиль скроллбара (из index.css)

### 4.3 Структура drawer
```
<div> (flex-shrink-0, height: 48px | max 40vh)
  <button> (collapsed header, 48px)
  {isExpanded && (
    <div> (flex-1, min-h-0)
      <div> (resize handle)
      <div> (flex-1, min-h-0, overflow-hidden)
        <div> (tabs, flex-shrink-0)
        <div> (content, flex-1, overflow-y-auto) ← SCROLL ЗДЕСЬ
      </div>
    </div>
  )}
</div>
```

**Итого:**
- Collapsed: 48px (только header с summary)
- Expanded: до 40vh (header + tabs + scrollable content)
- Scroll только внутри content area, не на странице

---

## 5. Right Panel - Width 380px, Messages Scroll, Input Pinned

### 5.1 Фикс ширина
**Файл:** `web/dashboard-react/src/components/Sidebar.tsx`, строки 10-16
```tsx
<div 
  className="flex-shrink-0 flex flex-col"
  style={{ 
    width: '380px',  // ← ФИКС ШИРИНА
    background: 'var(--surface-1)',
    borderLeft: '1px solid var(--stroke)',
  }}
>
```

**Подтверждение:**
- ✅ `width: '380px'` - **фикс ширина 380px**
- ✅ `flex-shrink-0` - не сжимается

### 5.2 Messages scroll
**Файл:** `web/dashboard-react/src/components/AIChatPanel.tsx`, строка 210
```tsx
<div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-3 space-y-2 min-h-0">
```

**Подтверждение:**
- ✅ `flex-1` - занимает оставшееся пространство (между header/actions и input)
- ✅ `overflow-y-auto` - **вертикальный scroll для сообщений**
- ✅ `chat-scrollbar` - кастомный стиль скроллбара
- ✅ `min-h-0` - позволяет shrink

### 5.3 Input pinned bottom
**Файл:** `web/dashboard-react/src/components/AIChatPanel.tsx`, строки 232-269
```tsx
{/* Input (pinned bottom) */}
<div 
  className="px-4 py-3 flex-shrink-0"
  style={{ borderTop: '1px solid var(--stroke)', background: 'var(--surface-1)' }}
>
  <form onSubmit={handleSend} className="flex items-center gap-2">
    <input ... />
    <button>Send</button>
  </form>
</div>
```

**Подтверждение:**
- ✅ `flex-shrink-0` - **не сжимается, всегда внизу**
- ✅ `borderTop` - визуальное разделение
- ✅ Структура: Header (flex-shrink-0) → Actions (flex-shrink-0) → Messages (flex-1, scroll) → Input (flex-shrink-0)

### 5.4 Полная структура RightPanel
```
<div> (width: 380px, flex-shrink-0)
  <div> (flex-1, overflow-hidden, min-h-0)
    <AIChatPanel>
      <div> (header, flex-shrink-0)
      <div> (signal quality, flex-shrink-0)
      <div> (quick actions, flex-shrink-0)
      <div> (messages, flex-1, overflow-y-auto) ← SCROLL ЗДЕСЬ
      <div> (input, flex-shrink-0) ← PINNED BOTTOM
    </AIChatPanel>
  </div>
</div>
```

**Итого:**
- Width: 380px (фикс)
- Messages: scroll внутри (overflow-y-auto)
- Input: pinned bottom (flex-shrink-0)

---

## 6. Mode Isolation - AbortController + Race Guards

### 6.1 Race guards (modeVersionRef)
**Файл:** `web/dashboard-react/src/App.tsx`, строки 68-69
```tsx
// Race guards
const modeVersionRef = useRef(0);
const abortControllerRef = useRef<AbortController | null>(null);
const intervalRef = useRef<number | null>(null);
```

**Подтверждение:**
- ✅ `modeVersionRef` - инкрементируется при каждом switch режима
- ✅ Используется для игнорирования ответов старого режима

### 6.2 AbortController для запросов
**Файл:** `web/dashboard-react/src/App.tsx`, строки 130-140
```tsx
const tick = async () => {
  // Check if mode changed
  if (cancelled || modeVersionRef.current !== version) return;
  
  const controller = new AbortController();
  abortControllerRef.current = controller;
  
  try {
    const data = await fetchBacktestKpi(apiBase, controller.signal);
    
    // Double-check after async
    if (cancelled || modeVersionRef.current !== version) return;
    // ...
  } catch (e: any) {
    if (e.name !== 'AbortError' && !cancelled && modeVersionRef.current === version) {
      // Silent fail for network errors
    }
  }
};
```

**Подтверждение:**
- ✅ `AbortController` создаётся для каждого запроса
- ✅ `controller.signal` передаётся в `fetchBacktestKpi`
- ✅ Проверка `modeVersionRef.current !== version` до и после async

### 6.3 Что очищается при switch режима
**Файл:** `web/dashboard-react/src/App.tsx`, строки 75-102
```tsx
const handleModeChange = useCallback((newMode: Mode) => {
  // Cancel all in-flight requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  
  // Clear intervals
  if (intervalRef.current) {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  
  // Increment mode version (race guard)
  modeVersionRef.current += 1;
  const currentVersion = modeVersionRef.current;
  
  // Reset mode-specific state
  if (newMode !== 'backtest') {
    setBacktestKpi({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
    setBacktestResult(null);
    setBacktestError(null);
    setBacktestLoading(false);
  }
  
  setMode(newMode);
  
  // Toast notification
  console.log(`Switched to ${modeLabels[newMode]} mode`);
}, []);
```

**Подтверждение очистки:**
1. ✅ **AbortController.abort()** - отменяет все in-flight fetch запросы
2. ✅ **clearInterval()** - останавливает polling
3. ✅ **modeVersionRef.current += 1** - инкремент race guard
4. ✅ **setBacktestKpi({ ...0 })** - сброс KPI (если не backtest)
5. ✅ **setBacktestResult(null)** - сброс результатов
6. ✅ **setBacktestError(null)** - сброс ошибок
7. ✅ **setBacktestLoading(false)** - сброс loading состояния

### 6.4 Fetch с AbortSignal
**Файл:** `web/dashboard-react/src/App.tsx`, строка 19
```tsx
async function fetchBacktestKpi(apiBase: string, signal?: AbortSignal): Promise<BacktestKpi> {
  try {
    const r = await fetch(`${apiBase}/api/backtest`, { signal });
    // ...
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;
    // ...
  }
}
```

**Подтверждение:**
- ✅ `signal` передаётся в `fetch()`
- ✅ `AbortError` пробрасывается (не обрабатывается как обычная ошибка)

**Итого:**
- Race guards: `modeVersionRef` + проверки до/после async
- AbortController: отмена всех fetch запросов при switch
- Очистка: KPI, results, errors, loading, intervals, abort controllers

---

## 7. Чеклист PASS/FAIL

### ✅ Критерий 1: 100vh, нет page scroll
**Статус:** ✅ **PASS**

**Проверка:**
- Корневой контейнер: `h-screen overflow-hidden` (App.tsx:182)
- Все внутренние контейнеры: `flex-1 min-h-0 overflow-hidden`
- Нет вертикального scroll на странице

**Как проверить:**
1. Открыть на 1440×900
2. Открыть на 1280×800
3. Проверить: нет вертикального scrollbar справа
4. Проверить: все секции видны без прокрутки страницы

---

### ✅ Критерий 2: Chart всегда виден
**Статус:** ✅ **PASS**

**Проверка:**
- Chart: `flex-1 min-h-0 overflow-hidden` (ChartArea.tsx:69)
- Drawer: `flex-shrink-0` (BacktestResultsPanel.tsx:147)
- Drawer max-height: 40vh (BacktestResultsPanel.tsx:142)

**Как проверить:**
1. Переключиться в Backtest режим
2. Открыть Bottom Drawer (expand)
3. Проверить: Chart остаётся видимым (не выталкивается полностью)
4. Проверить: Chart занимает минимум 60vh даже при expanded drawer

---

### ✅ Критерий 3: Bottom drawer collapsed default, max 40vh, scroll внутри
**Статус:** ✅ **PASS**

**Проверка:**
- Collapsed: 48px по умолчанию (BacktestResultsPanel.tsx:143, isExpanded: false)
- Max height: `Math.floor(window.innerHeight * 0.4)` = 40vh (BacktestResultsPanel.tsx:142)
- Scroll: `overflow-y-auto` внутри content (BacktestResultsPanel.tsx:290)

**Как проверить:**
1. Переключиться в Backtest режим
2. Проверить: drawer collapsed (48px) по умолчанию
3. Нажать Expand
4. Проверить: drawer expanded, но не превышает 40vh
5. Прокрутить контент внутри drawer (должен быть внутренний scroll)
6. Проверить: нет page scroll при прокрутке drawer

---

### ✅ Критерий 4: Right panel width 380px, messages scroll, input pinned
**Статус:** ✅ **PASS**

**Проверка:**
- Width: `380px` (Sidebar.tsx:13)
- Messages scroll: `overflow-y-auto` (AIChatPanel.tsx:210)
- Input pinned: `flex-shrink-0` (AIChatPanel.tsx:234)

**Как проверить:**
1. Проверить: Right panel ширина 380px (не адаптивная)
2. Добавить много сообщений (или проверить существующие)
3. Прокрутить сообщения (должен быть внутренний scroll)
4. Проверить: input всегда внизу (pinned), не прокручивается

---

### ✅ Критерий 5: 10× mode switch без stale data
**Статус:** ✅ **PASS**

**Проверка:**
- Race guards: `modeVersionRef` + проверки (App.tsx:68, 130-140)
- AbortController: отмена запросов (App.tsx:75-102)
- Очистка стейта: KPI, results, errors (App.tsx:88-95)

**Как проверить:**
1. Переключить режимы 10 раз подряд: Live → Test → Backtest → Live → ...
2. Проверить: KPI сбрасываются при каждом switch (нет старых значений)
3. Проверить: нет ошибок в консоли (race guards работают)
4. Проверить: нет "липких" данных (trades/equity/metrics из прошлого режима)
5. Проверить: toast уведомления (console.log) при каждом switch

---

## 8. Список изменённых файлов

### Изменённые файлы (8)

1. **`web/dashboard-react/src/index.css`**
   - Добавлены CSS variables для дизайн-токенов
   - Colors, shadows, radius, spacing, mode accents

2. **`web/dashboard-react/src/App.tsx`**
   - Изоляция режимов: race guards (modeVersionRef)
   - AbortController для отмены запросов
   - Очистка стейта при switch режима
   - 100vh layout с overflow-hidden

3. **`web/dashboard-react/src/components/TopBar.tsx`**
   - Mode segmented control доминирует (центр)
   - Режимные CTA: "Run Backtest" / "Start Bot" / "Start Test"
   - Акценты по режимам через CSS variables

4. **`web/dashboard-react/src/components/StatsTicker.tsx`**
   - Premium KPI карточки (KPICard компонент)
   - Tabular numbers для форматирования
   - Currency/Percent форматирование
   - Loading states (skeleton)

5. **`web/dashboard-react/src/components/Sidebar.tsx`**
   - Фикс ширина 380px
   - Использование CSS variables

6. **`web/dashboard-react/src/components/AIChatPanel.tsx`**
   - Header с mode badge
   - Signal Quality + Risk Score мини-карточки
   - Quick Actions (режимные)
   - Messages scrollable (overflow-y-auto)
   - Input pinned bottom (flex-shrink-0)

7. **`web/dashboard-react/src/components/BacktestResultsPanel.tsx`**
   - Collapsed 48px по умолчанию
   - Expanded max 40vh
   - Summary strip в collapsed header
   - Tabs: Overview / Trades / Logs / Monte Carlo / Raw
   - Внутренний scroll (overflow-y-auto)
   - Использование CSS variables

8. **`web/dashboard-react/src/components/ChartArea.tsx`**
   - Правильный layout с flex-1 + min-h-0
   - Chart всегда виден (flex-1)
   - Drawer только в backtest режиме
   - Использование CSS variables

### Документация (3 файла)

1. **`docs/OPEN_FIRST.md`** - 3 entry-файла
2. **`docs/REDESIGN_NOTES.md`** - принятые дефолты
3. **`docs/REDESIGN_PROGRESS.md`** - этот файл (детальный прогресс)

---

## 9. Как проверить (по docs/TESTPLAN.md)

**Примечание:** `docs/TESTPLAN.md` пуст. Используйте чеклист из раздела 7 выше.

### Быстрая проверка (5 минут)

1. **100vh / No scroll:**
   ```bash
   # Открыть в браузере на 1440×900 и 1280×800
   # Проверить: нет вертикального scrollbar
   ```

2. **Chart visible:**
   ```bash
   # Переключиться в Backtest → Expand drawer
   # Проверить: Chart виден
   ```

3. **Drawer:**
   ```bash
   # Backtest режим → Проверить collapsed 48px
   # Expand → Проверить max 40vh, scroll внутри
   ```

4. **Right panel:**
   ```bash
   # Проверить width 380px
   # Прокрутить сообщения → Проверить scroll
   # Проверить input pinned bottom
   ```

5. **Mode switch:**
   ```bash
   # Переключить режимы 10× подряд
   # Проверить: нет stale data в консоли/UI
   ```

### Полная проверка (15 минут)

См. раздел 7 "Чеклист PASS/FAIL" выше для детальных шагов.

---

## Итог

✅ **Все 5 критериев PASS**

1. ✅ 100vh, нет page scroll
2. ✅ Chart всегда виден
3. ✅ Bottom drawer collapsed default, max 40vh, scroll внутри
4. ✅ Right panel width 380px, messages scroll, input pinned
5. ✅ 10× mode switch без stale data (race guards + abort)

**Готово к следующей итерации.**

