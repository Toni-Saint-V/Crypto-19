import os
import time
import random
import asyncio
from typing import Any, Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

USE_MOCK = os.getenv("CBP_USE_MOCK", "1") == "1"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "web", "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "web", "templates")

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR)


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/chart.html", response_class=HTMLResponse)
async def chart(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


def make_mock_candles(limit: int = 200) -> List[Dict[str, Any]]:
    candles: List[Dict[str, Any]] = []
    ts = int(time.time()) - limit * 60
    price = 50000.0
    for _ in range(limit):
        o = price
        h = o + random.uniform(10, 40)
        l = o - random.uniform(10, 40)
        c = random.uniform(l, h)
        candles.append(
            {
                "time": ts,
                "open": round(o, 2),
                "high": round(h, 2),
                "low": round(l, 2),
                "close": round(c, 2),
            }
        )
        ts += 60
        price = c
    return candles


@app.get("/api/status")
async def api_status():
    return {
        "status": "ok",
        "backend": "mock" if USE_MOCK else "real",
        "net": "testnet",
        "ws": "connected",
        "last_update": int(time.time()),
    }


@app.get("/api/candles")
async def api_candles(symbol: str = "BTCUSDT", tf: str = "1m", limit: int = 200):
    data = make_mock_candles(limit=limit)
    return {"candles": data, "meta": {"symbol": symbol, "tf": tf}}


@app.post("/api/backtest/run")
async def api_backtest_run():
    return {"status": "completed", "trades": 14, "return_pct": 5.3}


@app.get("/api/backtest/summary")
async def api_backtest_summary():
    return {"trades": 14, "return_pct": 5.3, "duration_sec": 1.2}


@app.get("/api/equity")
async def api_equity():
    series = [
        {"t": 0, "v": 100},
        {"t": 1, "v": 101},
        {"t": 2, "v": 99},
        {"t": 3, "v": 103},
        {"t": 4, "v": 107},
    ]
    return {"series": series, "meta": {"currency": "USDT"}}


@app.get("/api/signals")
async def api_signals():
    candles = make_mock_candles(limit=30)
    signals: List[Dict[str, Any]] = []
    for idx, c in enumerate(candles[::5]):
        side = "buy" if idx % 2 == 0 else "sell"
        signals.append(
            {
                "time": c["time"],
                "price": c["close"],
                "side": side,
                "size": 0.1,
            }
        )
    return {"signals": signals}


@app.post("/api/assistant")
async def api_assistant(payload: Dict[str, Any]):
    prompt = payload.get("prompt", "")
    reply = f"Mock-ответ ассистента. Ты спросил: {prompt[:200]}"
    return {"reply": reply}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            candle = make_mock_candles(limit=1)[0]
            await ws.send_json({"type": "candle", "data": candle})
            await ws.send_json(
                {
                    "type": "status",
                    "data": {
                        "ts": int(time.time()),
                        "ws": "connected",
                    },
                }
            )
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
