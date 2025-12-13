# CryptoBot Pro Dashboard (React + TypeScript)

A pixel-perfect single-page trading dashboard built with React, TypeScript, and TailwindCSS.

## Features

- **Fixed 1440×900 viewport** - No scrolling, optimized for desktop
- **Three modes**: LIVE, TEST, BACKTEST with mode-specific content
- **Dark Carbon Pro theme** with neon turquoise accent (#21D4B4)
- **Placeholder chart** with mock candlesticks, volume bars, EMA lines, and trade markers
- **Interactive components**: Mode switcher, indicator toggles, parameter controls
- **AI Chat** with scrollable message area
- **Responsive to mode changes** - Content adapts based on selected mode

## Tech Stack

- React 18
- TypeScript
- TailwindCSS
- Vite

## Getting Started

### Install Dependencies

```bash
cd web/dashboard-react
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be output to `web/static/dashboard-build/`

## Project Structure

```
web/dashboard-react/
├── src/
│   ├── components/
│   │   ├── TopBar.tsx              # Top bar with logo, KPIs, mode switcher
│   │   ├── LiveTradesTicker.tsx    # Horizontal scrolling trades ticker
│   │   ├── ChartArea.tsx           # Chart container with header and indicators
│   │   ├── PlaceholderChart.tsx    # Mock chart with candlesticks and markers
│   │   ├── Sidebar.tsx             # Sidebar container
│   │   ├── AIPredictorPanel.tsx   # AI predictor (LIVE mode)
│   │   ├── TestControlsPanel.tsx  # Test controls (TEST mode)
│   │   ├── BacktestKPIPanel.tsx   # Backtest KPIs (BACKTEST mode)
│   │   ├── AIChatPanel.tsx         # Chat interface
│   │   └── BottomParametersBar.tsx # Bottom controls bar
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   ├── types.ts                    # TypeScript type definitions
│   └── index.css                   # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Layout Structure

- **Top Bar** (96px): Logo, KPIs, mode switcher, connection status
- **Trades Ticker** (40px): Horizontal scrolling trades or backtest summary
- **Main Content** (~664px):
  - **Left (70%)**: Chart area with indicators and controls
  - **Right (30%)**: Sidebar with AI Predictor/Chat or mode-specific panels
- **Bottom Bar** (80px): Parameter controls in single row

## Modes

### LIVE Mode
- Shows live KPI metrics
- Displays recent trades in ticker
- AI Predictor panel with market bias
- Standard chat interface

### TEST Mode
- Shows test events in ticker
- Test Controls panel with speed, start/pause/step buttons
- Chat includes test completion messages

### BACKTEST Mode
- Shows backtest KPI metrics (PnL, Winrate, Max DD, Trades)
- Backtest period selector with date pickers and Run button
- Backtest KPIs panel
- Equity line emphasized on chart
- Backtest assistant chat

## Design Tokens

- Background: `#0D0F12` → `#1A1C22` (gradient)
- Accent: `#21D4B4` (neon turquoise)
- Text: `#e5e7eb` (primary), `#9ca3af` (secondary)
- Spacing: 8px grid system

## Notes

- All data is currently mocked for layout demonstration
- Chart is a placeholder - ready to be wired to real charting library
- No backend integration - static layout only
- Optimized for 1440×900 viewport only (no mobile responsiveness)
