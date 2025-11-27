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
    return {"status": "ok"}

@app.post("/api/fetch")
async def api_fetch():
    return {"status": "pending"}

@app.get("/api/candles")
async def api_candles():
    return {"candles": [], "meta": {}}

@app.post("/api/backtest/run")
async def api_backtest_run():
    return {"status": "running"}

@app.get("/api/backtest/summary")
async def api_backtest_summary():
    return {"trades": 0, "return_pct": 0}

@app.get("/api/equity")
async def api_equity():
    return {"series": [], "meta": {}}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    while True:
        await ws.send_json({"ping": "pong"})
