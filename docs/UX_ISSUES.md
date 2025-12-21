# UX_ISSUES

## HARD REQUIREMENTS (No Debate)
1. **No page scroll**: Enforce 100vh layout. `body`/`html` overflow hidden.
2. **Right AI chat fixed width**: 380px default. Chat messages scroll internally. Input pinned bottom.
3. **Hero chart always visible**: Never resized by backtest results.
4. **BACKTEST results in bottom drawer**: Collapsed by default. Drawer overlays; max-height ~38vh; internal scroll; must NOT affect chart height.
5. **Mode isolation**: LIVE/TEST/BACKTEST must not leak state after 10 rapid switches.

## Implementation Decisions

### Layout Structure
- **Root container**: `h-screen w-screen overflow-hidden` (100vh/100vw)
- **HTML/Body**: `overflow: hidden !important` on both
- **Main area**: Grid layout `[chartArea | chatPanel]`
- **Chart area**: `flex-1 min-h-0 overflow-hidden` - always takes remaining space
- **Chat panel**: Fixed width 380px, `flex-shrink-0`
- **Drawer**: Absolute positioned overlay at bottom, does not affect chart container height

### Drawer Implementation
- **Collapsed by default**: `height: 48px` (header only)
- **Expanded**: `max-height: 38vh` (not 40vh to leave margin)
- **Position**: `position: absolute; bottom: 0; left: 0; right: 0`
- **Internal scroll**: Content area has `overflow-y-auto` with `chat-scrollbar` styling
- **Chart unaffected**: Chart container uses `flex-1` and is never resized by drawer

### Design Tokens Applied
- **Spacing**: 0, 4, 8, 12, 16, 24, 32, 40, 48px (CSS variables)
- **Radii**: 10px, 14px, 18px
- **Colors**: 
  - bg: `#0B1020`
  - surface: `#101A33`
  - text: `#EAF0FF`
  - muted: `#9AA8C7`
  - border: `rgba(255,255,255,0.08)`
  - good: `#3EF08A`
  - bad: `#FF5C7A`
  - warn: `#FFCB4D`
  - accent1: `#6AA6FF`
  - accent2: `#B36BFF`
- **Typography**: 
  - KPI: 24-28px/700 (Inter/SF Pro)
  - Body: 13-14px/500
  - Caption: 11-12px/500

### Mode Isolation Strategy
- **Race guards**: `modeVersionRef` increments on each mode change
- **Immediate state reset**: All mode-specific state reset on switch (no conditional checks)
- **Abort controllers**: All in-flight requests cancelled immediately
- **Version checking**: Async operations check version before updating state
- **Defense in depth**: Double-check version after async state updates

### UX States
- **Loading**: Skeletons with pulse animation
- **Empty**: "—" instead of "0.00" or empty strings
- **Error**: Error cards with status colors
- **Partial data**: Show available data, use "—" for missing

### Chart Enhancements
- **Trade markers**: Entry/exit markers with price labels
- **Color coding**: Uses design tokens (good/bad colors)
- **Tooltips**: Chart library handles hover tooltips (no page scroll)
- **SL/TP lines**: Can be added via chart API when trade data includes stop/target prices

### Components Added
- **ModeBadge**: Displays current mode with accent colors
- **DataHealthIndicator**: Shows backend health status and latency

## Acceptance Criteria (Must Pass)
- ✅ At 1920×1080 and 1440×900: no page scroll (body does not scroll)
- ✅ Chat is fixed width 380px; only its messages list scrolls; input always visible
- ✅ Chart stays visible when drawer opens/closes; opening drawer does not change chart container height
- ✅ Drawer collapsed by default, expandable, content scrolls inside
- ✅ Switch modes LIVE→TEST→BACKTEST 10 times: no leaked state; correct UI resets
- ✅ Visual polish: consistent spacing (16px cards), radii, typography, aligned top edges

## Files Modified
- `web/dashboard-react/src/index.css`: Design tokens, 100vh enforcement
- `web/dashboard-react/src/App.tsx`: Layout, mode isolation
- `web/dashboard-react/src/components/ChartArea.tsx`: Drawer positioning
- `web/dashboard-react/src/components/TradingChart.tsx`: Trade markers with design tokens
- `web/dashboard-react/src/components/StatsTicker.tsx`: "—" instead of "0.00", design tokens
- `web/dashboard-react/src/components/BacktestResultsPanel.tsx`: Design tokens, "—" for empty
- `web/dashboard-react/src/components/TopBar.tsx`: Mode badge, data health indicator
- `web/dashboard-react/src/components/ModeBadge.tsx`: New component
- `web/dashboard-react/src/components/DataHealthIndicator.tsx`: New component

