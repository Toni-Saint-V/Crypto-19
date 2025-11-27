from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from core.analytics.analytics_engine import AnalyticsEngine
from core.status.status_monitor import StatusMonitor
from core.services.fetch_bybit_klines import fetch_klines
from core.backtest.engine import BacktestEngine

from web.ws_live_patch import ws_live_loop

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static + templates
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")

# CORE instances (минимально нужные для UI)
analytics = AnalyticsEngine()
status_monitor = StatusMonitor()
backtest_engine = BacktestEngine()


# ------------------------
# BASIC
# ------------------------
@app.get("/")
async def root():
    return {"status": "ok", "message": "CryptoBot Pro API"}


# ------------------------
# UI
# ------------------------
@app.get("/chart.html")
async def chart(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# ------------------------
# API
# ------------------------
@app.get("/api/status")
async def api_status():
    return status_monitor.get_status()


@app.get("/api/candles")
async def api_candles():
    candles = fetch_klines()
    return {"candles": candles, "meta": {"source": "mock_bybit"}}


@app.post("/api/backtest/run")
async def api_backtest_run():
    return backtest_engine.run()


@app.get("/api/backtest/summary")
async def api_backtest_summary():
    return backtest_engine.summary()


@app.get("/api/equity")
async def api_equity():
    return analytics.get_equity_curve()


# ------------------------
# WebSocket live candles
# ------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    await ws_live_loop(ws)
