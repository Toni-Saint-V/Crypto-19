# Copilot / AI assistant instructions for Crypto-19

Short, actionable guidance to help an AI coding agent be immediately productive.

- **Project purpose**: Python (FastAPI) backend + static HTML/JS dashboard. The goal of the repo is a working `/dashboard` page showing candles, equity curve and trade markers (Live and Backtest modes).

- **Big-picture architecture**:
  - Backend: `server.py` exposes REST APIs and WebSocket endpoints. Main data provider for the dashboard is `/api/dashboard/snapshot` and `/api/candles`.
  - Dashboard template: `web/templates/dashboard.html` is the single-page entry for the UI. It loads ES modules from `/static/js` and the Lightweight Charts library from CDN.
  - Frontend modules: ES modules live in `web/static/js/` and are imported via absolute `/static/js/...` paths from the template and other modules.
  - Snapshot generation: `core/dashboard/service.py` composes the `DashboardSnapshot` Pydantic model returned by `/api/dashboard/snapshot`.
  - Realtime: WebSocket endpoints are implemented in `server.py` (routes: `/ws/dashboard`, `/ws/trades`, `/ws/ai`, and legacy `/ws`). Frontend realtime glue lives in `web/static/js/cbp_realtime.js` and `cbp_ws.js`.

- **Key files to read/change (data flow / responsibilities)**
  - `server.py` — main FastAPI app; mounts static files and templates; defines WS endpoints and `/api/dashboard/snapshot`.
  - `core/dashboard/service.py` — builds dashboard snapshot (candles, trades, ai_signals).
  - `web/templates/dashboard.html` — main page; imports ES modules and initial inline bootstrap (fallback) plus final module `cbp_dashboard_main.js`.
  - `web/static/js/cbp_charts.js` — Lightweight Charts wrapper: create chart, setCandles, setEquity, setTrades, updateChart.
  - `web/static/js/cbp_dashboard_main.js` — main frontend module that bootstraps UI, params panel, WS initialization, and calls `updateChart({symbol, timeframe})`.
  - `web/static/js/cbp_state.js` — centralized dashboard state and event dispatching.
  - `web/static/js/cbp_api.js` — helper for `/api/dashboard/snapshot` requests.
  - `web/static/js/cbp_realtime.js` — dashboard WS client for `/ws/dashboard` updates.
  - `web/static/js/cbp_ticker.js` — scrolling ticker that renders trades for the top bar.

- **Common patterns / conventions in this repo**
  - Frontend uses ES modules and absolute imports from `/static/js/...` (so code runs under `type="module"`). Use absolute paths in the template and in dynamic `import()` calls.
  - The UI uses a dual-init pattern: a lightweight inline module in the template (fallback) and a proper `cbp_dashboard_main.js` module. Both should cooperate via `window.cbpDashboard` and events (`cbp:dashboard_update`, `cbp:dashboard_ready`, `cbp:mode_changed`). When changing init behavior, preserve backwards-compatible global flags: `window.__cbp_main_module_present`, `window.__cbp_main_bootstrapped`, and fallbacks like `window.__cbp_fallback_*`.
  - Updates are signalled using CustomEvent names: `cbp:dashboard_update`, `cbp:dashboard_ready`, `cbp:mode_changed`.
  - Backend snapshot shape follows `core/dashboard/service.DashboardSnapshot` — it contains `candles` (list of {time,open,high,low,close,volume}), `trades` (for markers/ticker), and simple metrics (balance, daily_pnl_pct, etc.). The frontend expects these fields; keep naming stable.

- **Run / test / debug**
  - Launch dev server (from repo root; venv optional):

```bash
# using python directly
python server.py
# or with uvicorn
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

  - Open the dashboard: `http://127.0.0.1:8000/dashboard`.
  - Run unit tests: `pytest -q` (there is a test for `get_dashboard_snapshot`).
  - If editing frontend JS, use the browser devtools console to watch for errors; hot-reload is provided by Uvicorn when `--reload` is used.

- **Frontend debugging checklist (start here when charts don't render)**
  1. Confirm `web/templates/dashboard.html` contains the expected `<script type="module" src="/static/js/cbp_dashboard_main.js"></script>` at the bottom — the module bootstraps the real UI.
  2. Check the browser console for errors mentioning missing globals: `LightweightCharts` or `Plotly`. Lightweight Charts is loaded from CDN in the template. Plotly is optional — avoid importing `cbp_plotly_chart.js` unless Plotly is present.
  3. If charts are created by calling `initChart()` with no argument, ensure `cbp_charts.js` attempts to find `#main-chart` itself — prefer editing `initChart` to accept an optional container.
  4. `cbp_dashboard_main.js` often calls `updateChart({ symbol, timeframe, exchange })` — `cbp_charts.updateChart` must fetch `/api/dashboard/snapshot` when passed `symbol/timeframe` and then call `setCandles`, `setEquity`, `setTrades`.
  5. Verify `/api/dashboard/snapshot` returns `candles` and `trades` (see `core/dashboard/service.py`). You can call the endpoint directly in browser/postman to inspect JSON.
  6. WebSocket realtime: `cbp_realtime.js` opens `/ws/dashboard` and expects messages with {type: "dashboard_update", payload: snapshot}. Server sends that structure from `server.py`.

- **Gotchas found historically / things to watch**
  - Duplicate initialization: the template includes an inline module *and* `cbp_dashboard_main.js`. Both can create fallback components — prefer letting `cbp_dashboard_main.js` own initialization and keep the inline script as passive fallback that doesn't double-initialize global components.
  - `cbp_plotly_chart.js` uses `window.Plotly`. The template does not include Plotly by default; only load Plotly if necessary.
  - Time normalization: timestamps can be seconds (int) or milliseconds (large int). Frontend utilities normalize times; keep this consistent with `core/dashboard/service.py` which currently returns integer seconds.
  - WebSocket paths: frontend expects `/ws/dashboard`, `/ws/trades`, `/ws/ai`, and legacy `/ws`. Don't rename endpoints without updating `cbp_ws.js` / `cbp_realtime.js`.

- **Safe cleanup suggestions (manual review required)**
  - The `archive/` folder contains historical snapshots and older JS files — safe to move to a separate archive branch or delete after review.
  - `web/static/js/` contains some unused modules (e.g., `cbp_plotly_chart.js` if Plotly is never used). Remove only after confirming no imports reference them. Use `git grep` to find usages.
  - `web/templates/` may contain legacy templates (check `dashboard_old.html`) — keep only `dashboard.html` in active use unless legacy pages are intentionally preserved.
  - `core/dashboard/service.py` contains placeholder logic for AI signals and sample trades — if replacing with real data, keep model shape stable to avoid breaking frontend.

- **How to extend or implement features**
  - To add a new chart series (e.g., indicator): implement a `addXXXSeries` in `cbp_charts.js`, expose `initChart`/`updateChart` paths, and update the backend snapshot to include the series under a predictable key.
  - To add a new WS channel: add endpoint in `server.py` and a corresponding client in `web/static/js/cbp_ws.js`.

- **When submitting changes**
  - Keep export/ES module signatures stable (named exports used across modules).
  - Preserve `window.cbpDashboard` globals and fallback flags for compatibility with the inline template initialization.
  - Run `pytest` and manually check `/dashboard` in browser before creating PR.

If anything here is unclear or you want the assistant to (1) run the dev server, (2) run tests, or (3) apply the recommended cleanups (move archive contents or remove unused modules), tell me which step and I'll proceed.
