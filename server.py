import os
import asyncio
import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# пока работаем в мок-режиме, чтобы дашборд был полностью живой
USE_MOCK = True

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# статика и шаблоны
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")


# ---------- HELPERS (моки данных) ----------

def _gen_mock_candles(limit: int = 200) -> List[Dict[str, Any]]:
    now = int(time.time())
    base = 50000.0
    candles: List[Dict[str, Any]] = []
    for i in range(limit):
        ts = now - (limit - i) * 60
        open_ = base + random.uniform(-150, 150)
        close = open_ + random.uniform(-80, 80)
        high = max(open_, close) + random.uniform(0, 40)
        low = min(open_, close) - random.uniform(0, 40)
        candles.append(
            {
                "time": ts,
                "open": round(open_, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
            }
        )
    return candles


def _gen_equity_series(points: int = 60) -> List[float]:
    value = 100.0
    series: List[float] = []
    for _ in range(points):
        value += random.uniform(-1.5, 3.5)
        series.append(round(value, 2))
    return series


# ---------- PAGES ----------

@app.get("/", response_class=HTMLResponse)
async def root(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})


@app.get("/chart.html", response_class=HTMLResponse)
async def chart_page(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})


# ---------- API ----------

@app.get("/api/status")
async def api_status():
    return {
        "status": "ok",
        "mode": "mock",
        "uptime": "dashboard-only",
        "net": "testnet",
    }


@app.get("/api/candles")
async def api_candles(symbol: str = "BTCUSDT", tf: str = "1m", limit: int = 300):
    candles = _gen_mock_candles(limit=limit)
    return {
        "symbol": symbol,
        "tf": tf,
        "candles": candles,
        "meta": {"source": "mock"},
    }


@app.post("/api/backtest/run")
async def api_backtest_run():
    # UI просто показывает «в процессе / завершён»
    return {
        "status": "completed",
        "trades": 18,
        "return_pct": 14.2,
    }


@app.get("/api/backtest/summary")
async def api_backtest_summary():
    # здесь форму подстраиваем под app.js: return_pct + trades
    return {
        "trades": 18,
        "return_pct": 14.2,
        "net_profit_pct": 14.2,
        "max_dd_pct": -4.8,
        "winrate_pct": 63.0,
    }


@app.get("/api/equity")
async def api_equity():
    series = _gen_equity_series()
    return {"series": series, "meta": {"source": "mock"}}


# ---------- WEBSOCKET ----------

try:
    # если есть наш мок-стрим из web/ws_live_patch.py — используем его
    from web.ws_live_patch import ws_live_loop
except Exception:
    # запасной вариант — просто пинги раз в секунду
    async def ws_live_loop(ws: WebSocket):
        while True:
            await ws.send_json({"type": "ping", "ts": int(time.time())})
            await asyncio.sleep(1)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    await ws_live_loop(ws)
