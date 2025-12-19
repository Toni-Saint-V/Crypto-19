# Entry Points для редизайна

## 1. Главный layout/страница (Dashboard Layout)
**Файл:** `web/dashboard-react/src/App.tsx`
- **Строки:** 41-227 (функция App)
- **Собирает:** TopBar + StatsTicker (KPI) + ChartArea + Sidebar (RightPanel)
- **Управляет:** режимами (live/test/backtest)
- **Изоляция режимов:** race guards (modeVersionRef), AbortController, очистка стейта
- **Layout:** 100vh через `h-screen overflow-hidden` (строка 182)
- **Структура:**
  ```tsx
  <div className="h-screen w-screen overflow-hidden">  // Корневой (100vh)
    <TopBar />                                           // flex-shrink-0
    <StatsTicker />                                      // flex-shrink-0
    <div className="flex flex-1 overflow-hidden min-h-0"> // Main area
      <ChartArea />                                      // flex-1
      <Sidebar />                                        // width: 380px
    </div>
  </div>
  ```

## 2. RightPanel/Chat
**Файл:** `web/dashboard-react/src/components/Sidebar.tsx` → `AIChatPanel.tsx`
- **Sidebar.tsx** (строки 8-23): обёртка с фикс шириной 380px
- **AIChatPanel.tsx** (строки 31-272): основной компонент чата/ассистента
- **Фикс ширина:** `width: '380px'` (Sidebar.tsx:13)
- **Messages scroll:** `overflow-y-auto` (AIChatPanel.tsx:210)
- **Input pinned:** `flex-shrink-0` (AIChatPanel.tsx:234)
- **Структура:**
  ```tsx
  <div> (width: 380px, flex-shrink-0)
    <AIChatPanel>
      <div> (header, flex-shrink-0)
      <div> (signal quality, flex-shrink-0)
      <div> (quick actions, flex-shrink-0)
      <div> (messages, flex-1, overflow-y-auto) ← SCROLL
      <div> (input, flex-shrink-0) ← PINNED BOTTOM
    </AIChatPanel>
  </div>
  ```

## 3. Backtest results drawer
**Файл:** `web/dashboard-react/src/components/BacktestResultsPanel.tsx`
- **Строки:** 30-571 (функция BacktestResultsPanel)
- **Collapsed default:** `isExpanded: false` (строка 32), height: 48px (строка 143)
- **Expanded max-height:** `Math.floor(window.innerHeight * 0.4)` = 40vh (строка 142)
- **Scroll внутри:** `overflow-y-auto` (строка 290)
- **Tabs:** Overview / Trades / Logs / Monte Carlo / Raw
- **Структура:**
  ```tsx
  <div> (flex-shrink-0, height: 48px | max 40vh)
    <button> (collapsed header, 48px)
    {isExpanded && (
      <div> (flex-1, min-h-0)
        <div> (resize handle)
        <div> (tabs, flex-shrink-0)
        <div> (content, flex-1, overflow-y-auto) ← SCROLL
      </div>
    )}
  </div>
  ```

