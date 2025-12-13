# CryptoBot Pro — VS Code AI Orchestration (Metabob + Copilot)

## 0. Context

- Project: **CryptoBot Pro** (clean copy located in `~/cryptobot_19_clean`).
- Stack:
  - Backend: Python (FastAPI / Uvicorn or custom `server.py`).
  - Frontend: HTML + CSS + JS (ES modules, Lightweight Charts).
- Goal: **one working dashboard**:
  - Normal chart (candles + volume + trades).
  - Backtest flow (run + see results on chart and metrics).
  - Single stable entrypoint (`/dashboard`).
  - One-command launch script from terminal.

You are running inside **VS Code** with access to the full repository.

---

## 1. Global Goals

1. Make the dashboard **fully working and stable**:
   - No red errors in browser console.
   - Chart renders correctly with real or backtest data.
2. Simplify and clean up the project structure:
   - One main dashboard HTML + one main JS entry file.
   - Legacy/experimental dashboards clearly archived.
3. Ensure **one-command run** from terminal:
   - `run_dashboard.sh` or equivalent script that:
     - Activates/creates venv.
     - Installs dependencies.
     - Starts backend.
     - Opens `/dashboard` in browser.
4. Keep codebase clean, readable, and maintainable.

---

## 2. Rules for Changes

- **Work ONLY inside the clean copy** of the project (`cryptobot_19_clean` structure).
- Do not delete or break:
  - Main backend entrypoint (`server.py` or FastAPI app).
  - Existing `run_dashboard.sh` semantics (you may improve it, but it must still be “one command to run dashboard”).
- Prefer refactoring over adding new chaos:
  - One main dashboard route: `/dashboard`.
  - One main HTML template: `web/templates/dashboard.html` (or the chosen one).
  - One main JS entry module: e.g. `web/static/js/cbp_dashboard_main.js`.
  - Dedicated chart module: `cbp_charts.js`.
- Clearly separate:
  - Live/Backtest/Debug logic (modes).
  - API layer (API calls, WebSockets).
  - UI state management.
  - Chart rendering.
- Avoid introducing heavy new dependencies unless absolutely necessary.

---

## 3. Tasks for Metabob (Audit & Issues)

**Prompt for Metabob:**

> Please analyze this repository as a whole.
>
> Goals:
> - Identify architectural and code-quality problems in the Python backend and JS frontend.
> - Find dead code, duplicate dashboards, unused files, and inconsistent patterns.
> - Detect typical bugs, anti-patterns, and potential runtime problems (especially around the dashboard, chart, and API handling).
>
> Focus areas:
> 1. Backend:
>    - `server.py` or FastAPI app:
>      - Routes for `/dashboard`, `/api/dashboard`, `/api/dashboard/snapshot`, `/api/candles`, backtest endpoints.
>    - Any backtest/strategy modules that feed data to the dashboard.
> 2. Frontend:
>    - Main HTML/template for dashboard.
>    - JS modules like:
>      - `cbp_dashboard_main.js` (or similar main controller).
>      - `cbp_charts.js` (chart module).
>      - API/AI/state modules.
>    - LightweightCharts integration and DOM usage.
>
> Please:
> - Produce a **step-by-step list of concrete issues** and suggested fixes.
> - Group them by severity:
>   - “Critical for dashboard to work”
>   - “Important for stability and maintainability”
>   - “Nice-to-have refactoring”
> - For each issue, propose the minimal code change to fix it, referencing the exact files and functions.
> - Pay special attention to any errors that would cause:
>   - `chart.addCandlestickSeries is not a function`
>   - `LightweightCharts` undefined
>   - broken imports
>   - API fetches that don’t match backend endpoints.
>
> Output:
> - A structured report with:
>   - Summary.
>   - List of issues with file paths and severity.
>   - Proposed fix actions per issue.

Use this as your main audit task. After the report is ready, we will address the critical issues first.

---

## 4. Tasks for GitHub Copilot Chat (Implementation Plan)

**Prompt for GitHub Copilot Chat:**

> You are an AI pair-programmer working on the **CryptoBot Pro** dashboard in this VS Code workspace.
>
> Global goal:
> - Get a fully working trading dashboard with:
>   - Candlestick chart + volume + trade markers.
>   - Backtest mode (run backtest and visualize results).
>   - One-command launch from terminal (`run_dashboard.sh` or similar).
>   - Clean architecture: one main dashboard HTML + one main JS entrypoint.
>
> Work in stages and always keep the project buildable and runnable.
>
> ### Stage 1 — Identify main entrypoints
> 1. Find:
>    - Main backend entry (`server.py` or FastAPI app).
>    - Route for `/dashboard`.
>    - Main dashboard HTML template (likely under `web/templates/`).
>    - Main JS entry for the dashboard (likely under `web/static/js/`).
> 2. Confirm:
>    - Which JS modules are actually used by the main dashboard.
>    - Which dashboards/templates are legacy/unused.
> 3. Output:
>    - Short description of the minimal set of files that define the “real” dashboard.
>    - Proposal of which files should be considered legacy and maybe moved to an `archive/frontend_legacy/` folder (but DO NOT actually move files without explicit instruction).
>
> ### Stage 2 — Fix chart initialization
> 1. Open the real chart module (`cbp_charts.js` or similar).
> 2. Make sure it:
>    - Uses `window.LightweightCharts` correctly.
>    - Creates a chart instance properly: `const chart = LightweightCharts.createChart(...)`.
>    - Adds:
>      - candlestick series,
>      - volume histogram,
>      - optional trade markers.
> 3. Fix any code paths that might cause:
>    - `chart.addCandlestickSeries is not a function`
>    - `LightweightCharts` undefined
>    - wrong container element selection.
> 4. Ensure that:
>    - `initMainChart(containerElement)` returns both the chart object and series references.
>    - There is a clean API for updating candles and markers.
>
> ### Stage 3 — Wire backend data to chart
> 1. Inspect backend endpoints that serve candle/backtest data:
>    - `/api/dashboard/snapshot`
>    - `/api/candles`
>    - backtest-related endpoints.
> 2. Inspect frontend API/helpers (`cbp_api.js` or similar) for how data is fetched.
> 3. Fix any mismatches in:
>    - URL paths.
>    - Query parameters.
>    - JSON field names (e.g., `open`, `high`, `low`, `close`, `volume`, timestamps).
> 4. Make a clear flow:
>    - On dashboard load:
>      - Fetch snapshot/backtest data from backend.
>      - Feed it into `cbp_charts` to render candles and volume.
>    - On user actions (timeframe / symbol / mode change, backtest start):
>      - Fetch new data.
>      - Update chart via the chart module’s API.
>
> ### Stage 4 — Backtest from UI
> 1. Find the backtest endpoints in the backend and how they are supposed to be called.
> 2. Implement a simple flow in the UI:
>    - User selects:
>      - Symbol.
>      - Timeframe.
>      - Strategy (if applicable).
>      - Date range (if available).
>    - User clicks “Run Backtest”.
>    - Frontend calls backtest endpoint.
>    - Backend returns:
>      - Equity curve (P&L over time).
>      - Key metrics (win rate, PF, drawdown, etc., whatever is available).
> 3. Render:
>    - Equity curve as a line on the same chart or a secondary chart.
>    - Metrics in a dedicated panel on the dashboard.
>
> ### Stage 5 — One-command run
> 1. Inspect `run_dashboard.sh` (if present).
> 2. Ensure it:
>    - Creates/activates Python venv.
>    - Installs dependencies (`pip install -r requirements.txt`).
>    - Starts backend server (e.g., `python server.py` or `uvicorn app:app --reload`).
>    - Opens `http://127.0.0.1:8000/dashboard` in browser.
> 3. Make the script:
>    - Idempotent (safe to run multiple times).
>    - Well-logged (echo clear steps and errors).
>
> ### Stage 6 — Clean up & docs
> 1. Add or update:
>    - `README.md` with clear steps:
>      - How to set up.
>      - How to run the dashboard.
>      - Basic backtest usage.
> 2. Optionally add:
>    - `DASHBOARD_STATUS.md` — what’s implemented.
>    - `DASHBOARD_TODO.md` — future improvements.
> 3. Make sure there is **no fatal dead code** in the main flow:
>    - Legacy dashboards / dead modules should be clearly marked or moved out of the hot path.
>
> General working style:
> - Before editing files, briefly explain what you’re going to do.
> - After changes, show small diffs or summarize modifications and explain how to test:
>   - Which command to run in terminal.
>   - Which URL to open.
>   - What result to expect on the dashboard.
> - Keep each step small and testable so the dashboard remains runnable at all times.
>
> Start with Stage 1 now and tell me what you found as main entrypoints (backend route, HTML layout, main JS, chart module).
