# Worktree state

Generated: 2025-12-20 04:35

## Git status
```
 M .gitignore
 M PROJECT_LOG.md
 M core/assistant/contract.py
 M core/backtest/api.py
 M core/backtest/engine.py
 M core/dashboard/service.py
 M core/ml/contract.py
 M docs/CONTRACTS.md
 M server.py
?? docs/API_CONTRACT_AUDIT.md
?? docs/ASSISTANT_FOOTER_RULES.md
?? docs/AST_ROUTE_MAP.md
?? docs/AST_ROUTE_MAP_V2.md
?? docs/AUDIT_REVIEW.md
?? docs/BACKEND_ENDPOINT_FILES.md
?? docs/BACKEND_P0_2_3_PLAN.md
?? docs/BUGFIX_SNIPPETS.md
?? docs/BUSINESS_LOGIC_AUDIT.md
?? docs/BUSINESS_LOGIC_NEXT.md
?? docs/CLICKMAP.md
?? docs/CONTEXT_GAPS.md
?? docs/CONTRACTS_EXTRACT.md
?? docs/CONTRACT_COMPLIANCE_REPORT.md
?? docs/CONTRACT_GAP_MATRIX.md
?? docs/CORE_BACKTEST_API_MAP.md
?? docs/CURSOR_REVIEW_TASK.md
?? docs/ENDPOINT_CONTRACT_MAP.md
?? docs/MODE_MATRIX.md
?? docs/NEW_CHAT_HANDOFF.md
?? docs/OPENAPI_FRONTEND_MAP.md
?? docs/OPENAPI_SNAPSHOT.json
?? docs/PROJECT_ORCHESTRATOR_CHAT.md
?? docs/RECOVER_CURSOR_CHAT_BUGFIX.md
?? docs/REDESIGN_CHUNKS.md
?? docs/REDESIGN_TIMING.md
?? docs/REPO_INSPECTION.md
?? docs/ROUTE_CODE_SNIPPETS.md
?? docs/ROUTE_INVENTORY.md
?? docs/STATUS_SUMMARY.md
?? docs/UX_ACCEPTANCE.md
?? docs/UX_SPEC.md
?? docs/VISUAL_BLOCKS.md
?? docs/WORKTREE_STATE.md
```

## Diff stat (tracked only)
```
 .gitignore                 |   3 +
 PROJECT_LOG.md             |  48 +++++++++++++
 core/assistant/contract.py |   8 +++
 core/backtest/api.py       |  55 ++++++++++++---
 core/backtest/engine.py    |  34 +++++++++
 core/dashboard/service.py  |   5 +-
 core/ml/contract.py        |   8 +++
 docs/CONTRACTS.md          | 147 ++++++++++++++++++++++++++++++++++++++
 server.py                  | 172 +++++++++++++++++++++++++++++++++++++++++++--
 9 files changed, 465 insertions(+), 15 deletions(-)
```

## Tracked diffs (first ~80 lines each)

### .gitignore
```diff
diff --git a/.gitignore b/.gitignore
index 34bfce7..49223f1 100644
--- a/.gitignore
+++ b/.gitignore
@@ -78,3 +78,6 @@ archive/dashboard_snapshot_*
 web/static/dashboard-build/
 docs/_archive_cleanup_*/
 docs/__layout_hits.txt
+.backup/
+docs/_scratch/
+docs/_ai_memory/
```

### PROJECT_LOG.md
```diff
diff --git a/PROJECT_LOG.md b/PROJECT_LOG.md
index f67549e..d9403fd 100644
--- a/PROJECT_LOG.md
+++ b/PROJECT_LOG.md
@@ -389,3 +389,51 @@ Next:
 - index.css already has mode-scoped --accent-active and scrollbar hover tokens.
 - Follow-up: ensure App/top-level wrapper sets data-mode with exact lowercase values (live/test/backtest) so mode styling actually applies.
 
+
+## 2025-12-20 02:37
+- Added docs/RECOVER_CURSOR_CHAT_BUGFIX.md (Cursor continuation prompt for finishing bugfixes: Pydantic field order, keyboard undefined, backtest metadata None).
+
+## 2025-12-20 02:42
+- Captured bugfix snippets into docs/BUGFIX_SNIPPETS.md (DashboardSnapshot field order, keyboard undefined, BacktestEngine.run metadata).
+
+## 2025-12-20 02:45
+- Added docs/ASSISTANT_FOOTER_RULES.md (mandatory footer: task purpose + step% + dashboard%).
+
+## 2025-12-20 02:48
+- Fixed Bug 3 SyntaxError: removed guard block injected into BacktestEngine.run() signature and re-inserted it into the function body; compileall clean.
+
+## 2025-12-20 02:50
+- Fixed Bug 3 SyntaxError: removed guard block injected into BacktestEngine.run() signature and re-inserted it into the function body; compileall clean.
+
+## 2025-12-20 02:51
+- Cleaned working tree: restored unrelated tracked edits, moved untracked scratch docs into docs/_scratch/20251220_025127, added .gitignore for .backup/docs/_scratch/docs/_ai_memory, and re-verified compile for bugfix files.
+
+## 2025-12-20 02:53
+- Started dashboard (best-effort): backend/frontend via nohup with pid/log files in .run; printed ports and tailed logs.
+
+## 2025-12-20 02:53
+- Started dashboard (best-effort): backend/frontend via nohup with pid/log files in .run; printed ports and tailed logs.
+
+## 2025-12-20 03:12
+- Backend run fix: resolved aiogram/pydantic conflict by pinning pydantic<2.10 + fastapi==0.121.3, restarted server.py with system python, captured logs in .run/backend_fix_20251220_031215.log.
+
+## 2025-12-20 03:39
+- Verified local run: checked listeners on 5173/8000, probed API (/docs), tailed logs, and opened frontend + API docs in browser.
+
+## 2025-12-20 04:05
+- Verified runtime: captured PIDs for :5173 and :8000 into .run/*.pid, probed backend paths (/docs, /openapi.json, /health, /metrics), and opened frontend + backend docs in browser.
+
+## 2025-12-20 04:07
+- Restored PATH to include system tools, verified server listeners, probed API routes with curl/python fallback, tailed logs, and opened dashboard URLs.
+
+## 2025-12-20 04:10
+- Investigated why chart didn't open: verified listeners, fetched frontend root HTML, extracted likely backend data endpoints from /openapi.json, searched frontend for API base/candles fetch, tailed frontend/backend logs.
+
+## 2025-12-20 04:14
+- Restarted dashboard without pip: killed listeners on 5173/5174/8000, started backend via uvicorn (pyenv python if available), started Vite on 5173, verified /docs and /openapi.json, tailed logs, opened browser.
+
+## 2025-12-20 04:32
+- Autogenerated planning/docs package: CONTRACT_COMPLIANCE_REPORT, CLICKMAP, VISUAL_BLOCKS, MODE_MATRIX, UX_SPEC, UX_ACCEPTANCE, REDESIGN_CHUNKS, ROUTE_INVENTORY.
+
+## 2025-12-20 04:34
+- Restarted Vite with stdin=/dev/null to avoid 'suspended (tty input)'. Generated docs/OPENAPI_SNAPSHOT.json + docs/OPENAPI_FRONTEND_MAP.md to pinpoint /api/ml/score 422 contract mismatch and list API usage.
```

### core/assistant/contract.py
```diff
diff --git a/core/assistant/contract.py b/core/assistant/contract.py
index 5076a5d..36ab87a 100644
--- a/core/assistant/contract.py
+++ b/core/assistant/contract.py
@@ -4,6 +4,14 @@ from typing import Any, Dict, List, Optional, Literal
 
 try:
     from pydantic import BaseModel, Field
+    try:
+        from pydantic import field_validator  # pydantic v2
+    except Exception:  # pragma: no cover
+        field_validator = None  # type: ignore
+    try:
+        from pydantic import validator  # pydantic v1
+    except Exception:  # pragma: no cover
+        validator = None  # type: ignore
 except Exception:
     BaseModel = object  # type: ignore
     def Field(default=None, **kwargs):  # type: ignore
```

### core/backtest/api.py
```diff
diff --git a/core/backtest/api.py b/core/backtest/api.py
index d9874ef..26854e7 100644
--- a/core/backtest/api.py
+++ b/core/backtest/api.py
@@ -1,5 +1,46 @@
 from __future__ import annotations
 
+# BACKEND_P0_3_NORMALIZER
+def _ensure_ms(ts):
+    try:
+        v = int(ts)
+    except Exception:
+        return ts
+    if v <= 0:
+        return v
+    if v < 1_000_000_000_000:
+        return v * 1000
+    return v
+
+def _coerce_times(obj):
+    time_keys = {"t","time","timestamp","ts","open_time","close_time","start","end","entry_time","exit_time"}
+    if isinstance(obj, list):
+        return [_coerce_times(x) for x in obj]
+    if isinstance(obj, dict):
+        out = {}
+        for k, v in obj.items():
+            if isinstance(k, str) and k in time_keys and isinstance(v, (int, float, str)):
+                out[k] = _ensure_ms(v)
+            else:
+                out[k] = _coerce_times(v)
+        return out
+    return obj
+
+def _normalize_backtest_result(payload):
+    if not isinstance(payload, dict):
+        payload = {}
+    trades = payload.get("trades") or []
+    equity = payload.get("equity") or payload.get("equity_curve") or []
+    metrics = payload.get("metrics") or payload.get("statistics") or {}
+    if not isinstance(trades, list):
+        trades = []
+    if not isinstance(equity, list):
+        equity = []
+    if not isinstance(metrics, dict):
+        metrics = {}
+    out = {"trades": trades, "equity": equity, "metrics": metrics}
+    return _coerce_times(out)
+
 import threading
 from typing import Any, Dict, Optional
 
@@ -13,7 +54,6 @@ router = APIRouter(tags=["backtest"])
 _store = BacktestStore()
 _service = BacktestService()
 
-
 class BacktestRequest(BaseModel):
     symbol: str = Field(default="BTCUSDT")
     timeframe: str = Field(default="1h")
@@ -25,7 +65,6 @@ class BacktestRequest(BaseModel):
     slippage: float = Field(default=0.0002, ge=0.0)
     params: Dict[str, Any] = Field(default_factory=dict)
 
-
 @router.post("/api/backtest/run")
 def run(req: BacktestRequest) -> Dict[str, Any]:
     job = _store.create(request=req.model_dump())
@@ -53,22 +92,20 @@ def run(req: BacktestRequest) -> Dict[str, Any]:
     threading.Thread(target=work, args=(job.job_id, job.request), daemon=True).start()
     return {"job_id": job.job_id, "status": "queued"}
 
-
 @router.get("/api/backtest/status/{job_id}")
 def status(job_id: str) -> Dict[str, Any]:
     job = _store.get(job_id)
     if not job:
-        raise HTTPException(status_code=404, detail="job not found")
+        raise HTTPException(status_code=404, detail={"message": "job not found"})
     return {"job_id": job.job_id, "status": job.status, "progress": job.progress, "error": job.error}
 
-
 @router.get("/api/backtest/result/{job_id}")
 def result(job_id: str) -> Dict[str, Any]:
     job = _store.get(job_id)
     if not job:
-        raise HTTPException(status_code=404, detail="job not found")
+        raise HTTPException(status_code=404, detail={"message": "job not found"})
     if job.status == "error":
-        raise HTTPException(status_code=400, detail=job.error or "error")
+        raise HTTPException(status_code=400, detail={"message": job.error or "error"})
     if job.status != "done":
-        raise HTTPException(status_code=409, detail=f"not ready: {job.status}")
-    return job.result or {}
+        raise HTTPException(status_code=409, detail={"message": f"not ready: {job.status}"})
+    return _normalize_backtest_result(job.result)
```

### core/backtest/engine.py
```diff
diff --git a/core/backtest/engine.py b/core/backtest/engine.py
index 482e7cc..246128f 100644
--- a/core/backtest/engine.py
+++ b/core/backtest/engine.py
@@ -195,6 +195,40 @@ class BacktestEngine:
         slippage: float = 0.0,
         **kwargs,
     ) -> Dict[str, Any]:
+        # FIX_BUG3_SYMBOL_TF_GUARD
+        # Ensure symbol/timeframe are never None in result metadata when candles/signals are precomputed.
+        if symbol is None or timeframe is None:
+            _sym = symbol
+            _tf = timeframe
+            if candles:
+                c0 = candles[0]
+                if _sym is None:
+                    if isinstance(c0, dict):
+                        for k in ("symbol", "pair", "market"):
+                            v = c0.get(k)
+                            if v:
+                                _sym = v
+                                break
+                    else:
+                        _sym = getattr(c0, "symbol", None) or getattr(c0, "pair", None) or getattr(c0, "market", None)
+                if _tf is None:
+                    if isinstance(c0, dict):
+                        for k in ("timeframe", "tf", "interval"):
+                            v = c0.get(k)
+                            if v:
+                                _tf = v
+                                break
+                    else:
+                        _tf = getattr(c0, "timeframe", None) or getattr(c0, "tf", None) or getattr(c0, "interval", None)
+            if _sym is None:
+                _sym = getattr(self, "symbol", None) or getattr(self, "default_symbol", None)
+            if _tf is None:
+                _tf = getattr(self, "timeframe", None) or getattr(self, "default_timeframe", None)
+            if _sym is None or _tf is None:
+                raise ValueError("BacktestEngine.run requires symbol and timeframe (provide args or ensure candles include them).")
+            symbol = _sym
+            timeframe = _tf
+
         if candles is None or signals is None:
             if not symbol or not timeframe:
                 raise TypeError("BacktestEngine.run requires either (candles, signals) or (symbol, timeframe)")
```

### core/dashboard/service.py
```diff
diff --git a/core/dashboard/service.py b/core/dashboard/service.py
index 94920ba..948846f 100644
--- a/core/dashboard/service.py
+++ b/core/dashboard/service.py
@@ -39,6 +39,9 @@ class Trade(BaseModel):
 
 
 class DashboardSnapshot(BaseModel):
+    symbol: str = "BTCUSDT",
+    timeframe: str = "15m",
+
     balance: float = Field(0.0)
     daily_pnl_pct: float = Field(0.0)
     total_profit: float = Field(0.0)
@@ -81,8 +84,6 @@ async def get_dashboard_snapshot(
 
 
 def get_dashboard_snapshot_sync(
-    symbol: str = "BTCUSDT",
-    timeframe: str = "15m",
     mode: str | None = None,
 ) -> DashboardSnapshot:
     return asyncio.run(
```

### core/ml/contract.py
```diff
diff --git a/core/ml/contract.py b/core/ml/contract.py
index 166dd8c..f824e88 100644
--- a/core/ml/contract.py
+++ b/core/ml/contract.py
@@ -4,6 +4,14 @@ from typing import Any, Dict, List, Optional, Literal
 
 try:
     from pydantic import BaseModel, Field
+    try:
+        from pydantic import field_validator  # pydantic v2
+    except Exception:  # pragma: no cover
+        field_validator = None  # type: ignore
+    try:
+        from pydantic import validator  # pydantic v1
+    except Exception:  # pragma: no cover
+        validator = None  # type: ignore
 except Exception:  # pragma: no cover
     BaseModel = object  # type: ignore
     def Field(default=None, **kwargs):  # type: ignore
```

### docs/CONTRACTS.md
```diff
diff --git a/docs/CONTRACTS.md b/docs/CONTRACTS.md
index e69de29..7c89247 100644
--- a/docs/CONTRACTS.md
+++ b/docs/CONTRACTS.md
@@ -0,0 +1,147 @@
+# API Contracts
+
+_Restored on 2025-12-19 03:25:00 from: docs/_archive_cleanup_20251218_183655/dashboard_api_contract.md_
+
+# CryptoBot Pro · Dashboard API Contract
+
+## 1. REST /api/dashboard/snapshot
+
+Method: GET  
+URL: `/api/dashboard/snapshot`
+
+### Query params
+
+- symbol (string, default: "BTCUSDT")  
+- timeframe (string, default: "15m")  
+- mode (string, default: "live")  
+  - live — реальные данные, если доступны  
+  - test — синтетика для тестового режима  
+  - backtest — синтетика для бэктеста  
+
+### Response: DashboardSnapshot (JSON, структура)
+
+- balance: number  
+- daily_pnl_pct: number  
+- total_profit: number  
+- winrate_pct: number  
+- active_positions: integer  
+- risk_level_pct: number  
+
+- symbol: string  
+- timeframe: string  
+
+- candles: array of:
+  - time: integer (unix seconds)  
+  - open: number  
+  - high: number  
+  - low: number  
+  - close: number  
+  - volume: number  
+
+- ai_signals: array of:
+  - symbol: string  
+  - side: string ("buy" или "sell")  
+  - confidence: number (0–100)  
+  - entry: number  
+  - target: number  
+  - stop_loss: number  
+  - timeframe: string  
+  - comment: string | null  
+
+- trades: array of:
+  - id: string  
+  - symbol: string  
+  - side: string  
+  - price: number  
+  - qty: number  
+  - timestamp: integer (unix seconds)  
+  - realized_pnl: number | null  
+
+Гарантии:
+
+- balance, daily_pnl_pct, total_profit, winrate_pct, active_positions,
+  risk_level_pct, symbol, timeframe, candles, ai_signals — всегда есть.
+- Формат candles и ai_signals синхронизирован с core/dashboard/service.py.
+- При отсутствии реальных данных для режима live используется синтетика
+  с тем же форматом.
+
+## 2. WebSocket /ws/dashboard
+
+URL: `/ws/dashboard`
+
+### Query params
+
+- symbol (string, default: "BTCUSDT")  
+- timeframe (string, default: "15m")  
+- mode (string, default: "live")  
+
+Примеры URL:
+
+- ws://127.0.0.1:8000/ws/dashboard?symbol=BTCUSDT&timeframe=15m&mode=live  
+- ws://127.0.0.1:8000/ws/dashboard?symbol=BTCUSDT&timeframe=1h&mode=test  
+
+### Сообщения сервера
+
+Периодически отправляется объект:
+
+- type: "dashboard_update"  
+- payload: полный DashboardSnapshot в том же формате,
+  что и ответ /api/dashboard/snapshot  
+
+## 3. Использование на фронте
+
+1. Начальная загрузка:
+   - один запрос к /api/dashboard/snapshot с нужными symbol, timeframe, mode.  
+2. Лайв-обновления:
+   - WebSocket к /ws/dashboard с теми же параметрами;  
+   - на каждом dashboard_update:
+     - обновить график по candles;  
+     - обновить верхние метрики по числовым полям;  
+     - обновить AI-панель по ai_signals;  
+     - при необходимости — маркеры сделок по trades.
+
+---
+
+## Trading data contracts (P0-2/P0-3)
+
+_Added on 2025-12-19 03:30:04. Source used: /Users/user/cryptobot_19_clean/docs/CONTRACTS_EXTRACT.md_
+
+# CONTRACTS extract (Candles/Trades/Equity/Metrics/Backtest/Errors)
+
+Generated: 2025-12-18 22:48:48
+
+Source: docs/CONTRACTS.md
+
+- Nothing extracted (file missing or no matching headings/keywords).
+
+# CONTRACTS extract (Candles/Trades/Equity/Metrics/Backtest/Errors)
+
+Generated: 2025-12-18 22:48:48
+
+Source: docs/CONTRACTS.md
+
+- Nothing extracted (file missing or no matching headings/keywords).
+
+# CONTRACTS extract (Candles/Trades/Equity/Metrics/Backtest/Errors)
+
+Generated: 2025-12-18 22:48:48
+
+Source: docs/CONTRACTS.md
+
+- Nothing extracted (file missing or no matching headings/keywords).
+
+# CONTRACTS extract (Candles/Trades/Equity/Metrics/Backtest/Errors)
+
+Generated: 2025-12-18 22:48:48
+
+Source: docs/CONTRACTS.md
+
+- Nothing extracted (file missing or no matching headings/keywords).
+
+# CONTRACTS extract (Candles/Trades/Equity/Metrics/Backtest/Errors)
+
+Generated: 2025-12-18 22:48:48
+
+Source: docs/CONTRACTS.md
+
+- Nothing extracted (file missing or no matching headings/keywords).
```

### server.py
```diff
diff --git a/server.py b/server.py
index 7bf4291..8964e36 100644
--- a/server.py
+++ b/server.py
@@ -3,6 +3,79 @@ CryptoBot Pro - FastAPI Server
 AI-powered crypto trading dashboard with WebSocket support
 """
 
+
+
+
+# BACKEND_P0_2_TIME_MS_HELPER_V2
+def _p0_2_ensure_ms_any(x):
+    try:
+        v = int(x)
+    except Exception:
+        return x
+    if v > 0 and v < 1000000000000:
+        return v * 1000
+    return v
+
+# BACKEND_P0_3_BACKTEST_GET_CANONICAL
+def _p0_3_normalize_backtest_result(payload):
+    # Canonical output always includes trades/equity/metrics keys
+    if not isinstance(payload, dict):
+        payload = {}
+    trades = payload.get("trades") or []
+    equity = payload.get("equity") or payload.get("equity_curve") or []
+    metrics = payload.get("metrics") or payload.get("statistics") or {}
+    if not isinstance(trades, list):
+        trades = []
+    if not isinstance(equity, list):
+        equity = []
+    if not isinstance(metrics, dict):
+        metrics = {}
+    return {"trades": trades, "equity": equity, "metrics": metrics}
+
+# BACKEND_P0_3_NORMALIZER
+def _ensure_ms(ts):
+    try:
+        v = int(ts)
+    except Exception:
+        return ts
+    if v <= 0:
+        return v
+    # seconds -> ms (10 digits-ish). keep ms as-is.
+    if v < 1_000_000_000_000:
+        return v * 1000
+    return v
+
+def _coerce_times(obj):
+    # recursively normalize common time keys to epoch ms
+    time_keys = {"t","time","timestamp","ts","open_time","close_time","start","end","entry_time","exit_time"}
+    if isinstance(obj, list):
+        return [_coerce_times(x) for x in obj]
+    if isinstance(obj, dict):
+        out = {}
+        for k, v in obj.items():
+            if isinstance(k, str) and k in time_keys and isinstance(v, (int, float, str)):
+                out[k] = _ensure_ms(v)
+            else:
+                out[k] = _coerce_times(v)
+        return out
+    return obj
+
+def _normalize_backtest_result(payload):
+    # Canonical output: always {trades:[], equity:[], metrics:{}}
+    if not isinstance(payload, dict):
+        payload = {}
+    trades = payload.get("trades") or []
+    equity = payload.get("equity") or payload.get("equity_curve") or []
+    metrics = payload.get("metrics") or payload.get("statistics") or {}
+    if not isinstance(trades, list):
+        trades = []
+    if not isinstance(equity, list):
+        equity = []
+    if not isinstance(metrics, dict):
+        metrics = {}
+    out = {"trades": trades, "equity": equity, "metrics": metrics}
+    return _coerce_times(out)
+
 import uvicorn
 from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query
 from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
@@ -33,6 +106,27 @@ import yaml
 # === FASTAPI INITIALIZATION ===
 app = FastAPI(title="CryptoBot Pro — Neural Dashboard")
 
+# BACKEND_P0_3_HTTP_EXCEPTION_HANDLER
+try:
+    from fastapi import HTTPException, Request
+    from fastapi.responses import JSONResponse
+
+    async def _http_exception_handler(request: Request, exc: HTTPException):
+        detail = getattr(exc, 'detail', '')
+        if isinstance(detail, dict):
+            msg = str(detail.get('message') or detail.get('detail') or detail)
+        else:
+            msg = str(detail)
+        code = int(getattr(exc, 'status_code', 500) or 500)
+        return JSONResponse({"status": "error", "message": msg}, status_code=code)
+
+except Exception:
+    _http_exception_handler = None
+
+
+if _http_exception_handler is not None:
+    app.add_exception_handler(HTTPException, _http_exception_handler)
+
 # === BACKTEST ROUTER (AUTO) ===
 from core.backtest.api import router as backtest_router
 import os as _os
@@ -316,7 +410,7 @@ async def api_candles(
             candles = []
             for candle in ohlcv_data:
                 candles.append({
-                    "time": candle.time,
+                    "time": (int(candle.time) * 1000 if int(candle.time) < 1000000000000 else int(candle.time)),
                     "open": float(candle.open),
                     "high": float(candle.high),
                     "low": float(candle.low),
@@ -347,6 +441,37 @@ async def api_candles(
         }
 
 
+
+# BACKEND_P0_2_MISSING_ENDPOINTS
+def _p0_2_get_latest_backtest():
+    # Best-effort: try global latest context, fallback to empty canonical
+    try:
+        ctx = globals().get('last_backtest_context') or {}
+        if isinstance(ctx, dict):
+            return {
+                'trades': ctx.get('trades') or [],
+                'equity': ctx.get('equity') or [],
+                'metrics': ctx.get('metrics') or {},
+            }
+    except Exception:
+        pass
+    return {'trades': [], 'equity': [], 'metrics': {}}
+
+@app.get('/api/trades')
+async def api_trades(symbol: str = Query('BTCUSDT'), timeframe: str = Query('15m'), mode: str = Query('backtest')):
+    bt = _p0_2_get_latest_backtest()
+    return {'symbol': symbol, 'timeframe': timeframe, 'mode': mode, 'trades': bt['trades'], 'count': len(bt['trades'])}
+
+@app.get('/api/equity')
+async def api_equity(symbol: str = Query('BTCUSDT'), timeframe: str = Query('15m'), mode: str = Query('backtest')):
+    bt = _p0_2_get_latest_backtest()
+    eq = bt['equity']
+    return {'symbol': symbol, 'timeframe': timeframe, 'mode': mode, 'equity': eq, 'count': len(eq)}
+
+@app.get('/api/metrics')
+async def api_metrics(symbol: str = Query('BTCUSDT'), timeframe: str = Query('15m'), mode: str = Query('backtest')):
+    bt = _p0_2_get_latest_backtest()
+    return {'symbol': symbol, 'timeframe': timeframe, 'mode': mode, 'metrics': bt['metrics']}
 @app.get("/api/selfcheck")
 async def api_selfcheck():
     """
@@ -1218,9 +1343,8 @@ async def api_backtest_run_v2(request: 'Request'):
```
