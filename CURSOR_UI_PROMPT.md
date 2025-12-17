# Cursor UI Prompt: Fix BACKTEST layout and 100vh shell

Goal: Make TEST and BACKTEST perfect without breaking LIVE.

Acceptance criteria
1) No page scroll. App shell fits 100vh or 100dvh.
2) Only internal scroll in: chat messages, raw payload, trades/logs lists, drawer content.
3) Chart always visible; BACKTEST never pushes chart down.
4) Right chat panel fixed width; input pinned; messages scroll inside.
5) BACKTEST has obvious Run CTA with disabled/loading/progress states.

Implementation
- Set top-level shell to height: 100dvh (fallback 100vh) and overflow: hidden.
- Main layout: left area is flex column (chart + drawer); right area is chat column with fixed width.
- Implement BACKTEST results as a Bottom Drawer in the left area, collapsed by default.
- Drawer tabs: Results | Trades | Logs | Raw. Drawer max-height capped; internal scroll.

Files to inspect first
- cbp_charts.XXXXXX.js
- web/dashboard-react/index.html
- web/dashboard-react/package.json
- web/dashboard-react/tsconfig.json
- web/dashboard-react/vite.config.ts
- web/dashboard/dashboard.css
- web/dashboard/dashboard.js
- archive/static/css/dashboard_new.css
- archive/static/js/ai_panel.js
- archive/static/js/backtest.js
- archive/static/js/dashboard_legacy.js
- archive/static/js/dashboard_new_lab.js
- web/dashboard-react/src/App.tsx
- web/dashboard-react/src/main.tsx
- web/static/css/dashboard.css
- web/static/js/cbp_advanced_chart.js
- web/static/js/cbp_ai_chat.js
- web/static/js/cbp_ai_panel.js
- web/static/js/cbp_charts.js
- web/static/js/cbp_dashboard_main.js
- web/static/js/cbp_params_panel.js
- web/static/js/cbp_plotly_chart.js
- web/static/js/dashboard_charts.js
- web/static/js/dashboard_live_ticker.js
- web/static/js/dashboard_main.js
- web/static/js/dashboard_state.js
- web/static/js/lightweight-charts.js
- web/static/lib/lightweight-charts.js
- web/dashboard-react/node_modules/acorn-jsx/package.json
- web/dashboard-react/node_modules/acorn/package.json
- web/dashboard-react/node_modules/ajv/package.json
- web/dashboard-react/node_modules/ansi-regex/package.json
- web/dashboard-react/node_modules/ansi-styles/package.json
- web/dashboard-react/node_modules/any-promise/package.json
- web/dashboard-react/node_modules/anymatch/package.json
- web/dashboard-react/node_modules/arg/package.json
- web/dashboard-react/node_modules/argparse/package.json
- web/dashboard-react/node_modules/array-union/package.json
- web/dashboard-react/node_modules/autoprefixer/package.json
- web/dashboard-react/node_modules/balanced-match/package.json
- web/dashboard-react/node_modules/baseline-browser-mapping/package.json
- web/dashboard-react/node_modules/binary-extensions/package.json
- web/dashboard-react/node_modules/brace-expansion/package.json
- web/dashboard-react/node_modules/braces/package.json
- web/dashboard-react/node_modules/browserslist/package.json
- web/dashboard-react/node_modules/callsites/package.json
- web/dashboard-react/node_modules/camelcase-css/package.json
- web/dashboard-react/node_modules/caniuse-lite/package.json
- web/dashboard-react/node_modules/chalk/package.json
- web/dashboard-react/node_modules/chokidar/package.json
- web/dashboard-react/node_modules/color-convert/package.json
- web/dashboard-react/node_modules/color-name/package.json
- web/dashboard-react/node_modules/commander/package.json
- web/dashboard-react/node_modules/concat-map/package.json
- web/dashboard-react/node_modules/convert-source-map/package.json
- web/dashboard-react/node_modules/cross-spawn/package.json
- web/dashboard-react/node_modules/cssesc/package.json
- web/dashboard-react/node_modules/csstype/package.json
- web/dashboard-react/node_modules/debug/package.json
- web/dashboard-react/node_modules/deep-is/package.json
