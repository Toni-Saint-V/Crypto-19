# Quick Start Guide

## Installation & Running

1. **Navigate to the dashboard directory:**
   ```bash
   cd web/dashboard-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

The dashboard will display at exactly 1440×900 pixels with no scrolling.

## Features to Test

- **Mode Switching**: Click LIVE/TEST/BACKTEST buttons in top bar to see content change
- **Indicator Toggles**: Click the indicator chips (EMA 50, EMA 200, etc.) to toggle them
- **Trade Markers**: Hover over the triangular markers on the chart to see trade details
- **Parameter Controls**: Use the bottom bar to change symbol, exchange, timeframe, etc.
- **Chat**: Type messages in the AI Chat panel (mock responses will appear)

## Building for Production

```bash
npm run build
```

Output will be in `web/static/dashboard-build/`

## Integration Notes

- All data is currently mocked
- Chart is a placeholder - ready to integrate with Lightweight Charts or TradingView
- State management is local React state - can be upgraded to Redux/Zustand if needed
- No backend calls - all static/mocked data
