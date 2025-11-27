from core.portfolio.portfolio_manager import PortfolioManagern
from core.ml.ml_strategy import MLStrategyn
from core.ai.ai_assistant import AIAssistantn
from core.analytics.analytics_engine import AnalyticsEnginen
from core.notifications.notification_manager import NotificationManagern
from core.status.status_monitor import StatusMonitorn
from core.backtest.engine import BacktestEnginen

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/api/status")
async def api_status():
    return status_monitor.get_status()

@app.post("/api/fetch")
async def api_fetch():
    return backtest_engine.fetch_placeholder()

@app.get("/api/candles")
async def api_candles():
    return {"candles": fetch_klines(), "meta": {"source": "bybit"}}

@app.post("/api/backtest/run")
async def api_backtest_run():
    return backtest_engine.run()

@app.get("/api/backtest/summary")
async def api_backtest_summary():
    return backtest_engine.summary()

@app.get("/api/equity")
async def api_equity():
    return analytics.get_equity_curve()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    from ws_live_patch import ws_live_loop
    await ws_live_loop(ws)
    # while True:
        await ws.send_json({"ping": "pong"})

# ===============================
# FIXED WEBSOCKET ENDPOINT
# ===============================
from ws_live_patch import ws_live_loop

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    await ws_live_loop(ws)
