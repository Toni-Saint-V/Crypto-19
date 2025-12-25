# CTA Wiring Summary

## Что сделано

### 1. TopBar CTA Wiring
- ✅ Убрана no-op функция `getModeCTA()` с пустыми actions
- ✅ Добавлены пропсы в `TopBarProps`:
  - `primaryCtaLabel: string`
  - `onPrimaryCta: () => void`
  - `primaryCtaDisabled?: boolean`
- ✅ CTA кнопка использует реальные handlers из пропсов
- ✅ Disabled состояние с визуальной обратной связью (opacity, border, tooltip)

### 2. Token Cleanup в TopBar
- ✅ Убран хардкод цветов (`#a855f7`, `#14b8a6`, `#f59e0b`)
- ✅ Убран `accentHex` - все цвета через CSS variables
- ✅ `ModeButton` использует `accent.color` из `modeAccents` (CSS var)
- ✅ CTA кнопка использует `accent.color` для градиента и свечения

### 3. Handlers подняты в App.tsx (Single Source of Truth)
- ✅ **Backtest handlers:**
  - `handleBacktestRun()` - запускает backtest через API
  - `handleBacktestCancel()` - отменяет running backtest
  - Статус: `backtestRunStatus` ('idle' | 'running' | 'done' | 'error')
- ✅ **Live handlers:**
  - `handleLiveStart()` - запускает live bot (локальный state)
  - `handleLiveStop()` - останавливает live bot
  - Статус: `liveRunning` (boolean)
- ✅ **Test handlers:**
  - `handleTestStart()` - запускает test
  - `handleTestPause()` - ставит на паузу
  - `handleTestResume()` - возобновляет
  - Статус: `testRunning` (boolean), `testPaused` (boolean)

### 4. CTA вычисляется в App.tsx
- ✅ `getPrimaryCta()` вычисляет label/action/disabled по режиму:
  - **Backtest:**
    - `running` → "Cancel" → `handleBacktestCancel`
    - `done` → "Re-run" → `handleBacktestRun`
    - `idle` → "Run Backtest" → `handleBacktestRun`
  - **Live:**
    - `running` → "Stop Bot" → `handleLiveStop`
    - `!running` → "Start Bot" → `handleLiveStart`
  - **Test:**
    - `running && paused` → "Resume" → `handleTestResume`
    - `running && !paused` → "Pause" → `handleTestPause`
    - `!running` → "Start Test" → `handleTestStart`

### 5. Handlers переданы в BacktestResultsPanel
- ✅ `onRun`, `onCancel`, `runStatus`, `runError` переданы через props
- ✅ BacktestResultsPanel использует внешние handlers если предоставлены
- ✅ Fallback на внутренние handlers для обратной совместимости
- ✅ Кнопка Cancel показывается когда `runStatus === "running"` и `onCancel` предоставлен

## Изменённые файлы

1. **`web/dashboard-react/src/components/TopBar.tsx`**
   - Убрана `getModeCTA()`
   - Добавлены пропсы `primaryCtaLabel`, `onPrimaryCta`, `primaryCtaDisabled`
   - Убран хардкод цветов, только CSS variables
   - CTA кнопка с disabled состоянием

2. **`web/dashboard-react/src/App.tsx`**
   - Добавлены состояния: `backtestRunStatus`, `liveRunning`, `testRunning`, `testPaused`
   - Добавлены handlers: `handleBacktestRun`, `handleBacktestCancel`, `handleLiveStart`, `handleLiveStop`, `handleTestStart`, `handleTestPause`, `handleTestResume`
   - Функция `getPrimaryCta()` вычисляет CTA по режиму
   - Передача CTA пропсов в TopBar
   - Передача backtest handlers в ChartArea

3. **`web/dashboard-react/src/components/ChartArea.tsx`**
   - Добавлены пропсы: `onBacktestRun`, `onBacktestCancel`, `backtestRunStatus`, `backtestRunError`
   - Передача handlers в BacktestResultsPanel

4. **`web/dashboard-react/src/components/BacktestResultsPanel.tsx`**
   - Добавлены пропсы: `onRun`, `onCancel`, `runStatus`, `runError`
   - Использование внешних handlers если предоставлены
   - Кнопка Cancel при `runStatus === "running"`

## Как проверить руками

### Backtest режим
1. Переключиться в **Backtest** режим
2. Нажать **"Run Backtest"** в TopBar
3. ✅ Проверить: кнопка меняется на "Cancel", в drawer показывается "Running..."
4. Нажать **"Cancel"** в TopBar или drawer
5. ✅ Проверить: backtest отменяется, статус сбрасывается
6. После завершения: кнопка меняется на **"Re-run"**
7. ✅ Проверить: нажатие "Re-run" запускает новый backtest

### Live режим
1. Переключиться в **Live** режим
2. Нажать **"Start Bot"** в TopBar
3. ✅ Проверить: кнопка меняется на "Stop Bot", `liveRunning = true` (в консоли)
4. Нажать **"Stop Bot"**
5. ✅ Проверить: кнопка меняется на "Start Bot", `liveRunning = false`

### Test режим
1. Переключиться в **Test** режим
2. Нажать **"Start Test"** в TopBar
3. ✅ Проверить: кнопка меняется на "Pause", `testRunning = true`
4. Нажать **"Pause"**
5. ✅ Проверить: кнопка меняется на "Resume", `testPaused = true`
6. Нажать **"Resume"**
7. ✅ Проверить: кнопка меняется на "Pause", `testPaused = false`

### Визуальная проверка
- ✅ CTA кнопка использует режимные акценты (purple/teal/amber)
- ✅ Disabled состояние визуально отличается (opacity, border)
- ✅ Нет хардкод цветов в TopBar (только CSS variables)
- ✅ Mode segmented control доминирует (центр)

## Результат

✅ **Все CTA честные** - нет пустых функций, все handlers реальные
✅ **Single source of truth** - handlers в App.tsx, передаются через props
✅ **Токены везде** - никаких хардкод цветов
✅ **Disabled состояния** - визуальная обратная связь + tooltip

