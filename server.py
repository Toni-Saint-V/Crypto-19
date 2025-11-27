import asyncio
import time
import random

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

from core.analytics.analytics_engine import AnalyticsEngine
from core.status.status_monitor import StatusMonitor
from core.services.fetch_bybit_klines import fetch_klines
from core.backtest.engine import BacktestEngine

app = FastAPI()

# CORS, чтобы фронт спокойно ходил к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Статика и шаблоны
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")

# CORE инстансы
analytics = AnalyticsEngine()
status_monitor = StatusMonitor()
backtest_engine = BacktestEngine()

# ---------- UI ----------

@app.get("/", response_class=HTMLResponse)
async def ui_root(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})

@app.get("/chart.html", response_class=HTMLResponse)
async def ui_chart_alias(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})

# ---------- API ----------

@app.get("/api/status")
async def api_status():
    try:
        return status_monitor.get_status()
    except Exception:
        return {"status": "ok"}

@app.get("/api/candles")
async def api_candles(
    symbol: str = "BTCUSDT",
    interval: str = "1m",
    limit: int = 500
):
    try:
        candles = fetch_klines(symbol=symbol, interval=interval, limit=limit)
        return {
            "candles": candles,
            "meta": {
                "symbol": symbol,
                "interval": interval,
                "source": "bybit_service"
            }
        }
    except Exception as e:
        return {
            "candles": [],
            "meta": {
                "error": str(e)
            }
        }

@app.post("/api/backtest/run")
async def api_backtest_run(
    symbol: str = "BTCUSDT",
    interval: str = "1m"
):
    try:
        return backtest_engine.run(symbol=symbol, interval=interval)
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/backtest/summary")
async def api_backtest_summary():
    try:
        return backtest_engine.summary()
    except Exception as e:
        return {"return_pct": 0, "trades": 0, "error": str(e)}

@app.get("/api/equity")
async def api_equity():
    try:
        return analytics.get_equity_curve()
    except Exception as e:
        return {"series": [], "meta": {"error": str(e)}}

# ---------- WebSocket: mock candles ----------

@app.websocket("/ws")
async def websocket_candles(ws: WebSocket):
    await ws.accept()
    price = 50000.0
    while True:
        # простая рандомная свеча
        ts = int(time.time())
        move = random.uniform(-50, 50)
        open_ = price
        close = price + move
        high = max(open_, close) + random.uniform(0, 20)
        low = min(open_, close) - random.uniform(0, 20)
        price = close

        candle = {
            "time": ts,
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
        }

        await ws.send_json({"type": "candle", "data": candle})
        await asyncio.sleep(1.0)
