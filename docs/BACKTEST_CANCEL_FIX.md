# Backtest Cancel Fix - Настоящая отмена RUN-запроса

## Выполнено

### 1. ✅ Отдельный AbortController для RUN-запроса

**Добавлено:**
- `runAbortControllerRef` - отдельный ref для RUN-запроса `/api/backtest/run`
- `runVersionRef` - версия для race guard, предотвращает обновление состояния отменённого запроса

**Разделение:**
- `abortControllerRef` - для polling запросов (`/api/backtest`)
- `runAbortControllerRef` - для RUN-запроса (`/api/backtest/run`)

### 2. ✅ signal передан в fetch

**В `handleBacktestRun`:**
```typescript
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  signal: controller.signal, // ← добавлено
});
```

### 3. ✅ Cancel abort именно RUN controller

**В `handleBacktestCancel`:**
```typescript
if (runAbortControllerRef.current) {
  runAbortControllerRef.current.abort();
  runAbortControllerRef.current = null;
}
runVersionRef.current += 1; // Инвалидирует pending responses
```

### 4. ✅ Гарантия: отменённый run не выставит done/error

**Множественные проверки:**
1. После `fetch` - проверка `controller.signal.aborted` и `runVersionRef`
2. После `res.json()` - повторная проверка
3. Перед `setState` - финальная проверка
4. В `catch` - игнорирование `AbortError` и проверка версии

**Результат:** Отменённый запрос не может обновить состояние.

### 5. ✅ Убрано дублирование setBacktestKpi

**Удалено:**
- Event listener для `backtest:updated` (строка 112-131)
- `window.dispatchEvent('backtest:updated')` из `handleBacktestRun` (строка 227)
- `window.dispatchEvent('backtest:updated')` из polling (строка 160)

**Оставлено:**
- Прямой `setBacktestKpi(kpi)` в `handleBacktestRun`
- Прямой `setBacktestKpi(data)` в polling

**Результат:** Один механизм обновления - только через `setState`.

### 6. ✅ w-screen заменён на w-full

**Изменено:**
```typescript
className="h-screen w-full overflow-hidden relative"
```

## Изменённые файлы

1. **`web/dashboard-react/src/App.tsx`**
   - Добавлен `runAbortControllerRef` и `runVersionRef`
   - `handleBacktestRun` использует отдельный AbortController с signal
   - Множественные проверки aborted/version перед setState
   - `handleBacktestCancel` abort именно RUN controller
   - Убран event listener и dispatchEvent для backtest:updated
   - `w-screen` → `w-full`

## Проверка

✅ **Cancel работает:**
- При нажатии Cancel RUN-запрос отменяется через AbortController
- Отменённый запрос не обновляет состояние (done/error)
- Polling продолжает работать независимо

✅ **Нет дублирования:**
- `setBacktestKpi` вызывается только через `setState`
- Нет event listener и dispatchEvent

✅ **Race guards:**
- `runVersionRef` предотвращает обновление от superseded запросов
- Проверки `aborted` и `version` на всех критических точках

## Результат

Cancel backtest теперь настоящий:
- Отдельный AbortController для RUN-запроса
- signal передан в fetch
- Отменённый запрос не может обновить состояние
- Нет дублирования обновлений KPI
- Корневой контейнер использует `w-full` вместо `w-screen`

