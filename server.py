import os
import math
import random
import time
from typing import List, Dict, Any

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# флаг на будущее — пока всегда работаем в mock
USE_MOCK = os.getenv("CBP_USE_MOCK", "1") == "1"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# static + templates (как сейчас использует фронт)
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")


# =========================
#   HELPERS: MOCK DATA
# =========================

def gen_mock_candles(symbol: str = "BTCUSDT", tf: str = "1m", limit: int = 300) -> List[Dict[str, Any]]:
    """
    Красивый демо-ряд:
    - плавная синусоида
    - лёгкий ап-тренд
    - внутри свечи — небольшой шум
    """
    now = int(time.time())
    base = 50000.0
    amplitude = 600.0      # размах волны
    spread = 80.0          # разброс внутри свечи

    candles: List[Dict[str, Any]] = []
    for i in range(limit):
        ts = now - (limit - i) * 60

        # синусоида + тренд
        angle = i / 14.0
        mid = base + math.sin(angle) * amplitude + i * 2.0

        o = mid + random.uniform(-spread, spread)
        c = mid + random.uniform(-spread, spread)
        h = max(o, c) + random.uniform(5, 25)
        l = min(o, c) - random.uniform(5, 25)

        candles.append(
            {
                "time": ts,
                "open": round(o, 2),
                "high": round(h, 2),
                "low": round(l, 2),
                "close": round(c, 2),
            }
        )
    return candles


def gen_equity_curve(points: int = 80) -> List[float]:
    """Простая растущая equity с небольшими откатами."""
    value = 100.0
    series: List[float] = []
    for _ in range(points):
        value += random.uniform(-1.0, 3.5)
        series.append(round(value, 2))
    return series


# =========================
#   PAGES
# =========================

@app.get("/", response_class=HTMLResponse)
async def root(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})


@app.get("/chart.html", response_class=HTMLResponse)
async def chart_page(req: Request):
    # фронт уже ходит на /chart.html
    return templates.TemplateResponse("index.html", {"request": req})


# =========================
#   REST API
# =========================

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/status")
async def api_status():
    # подхватывается карточкой "Статус системы"
    return {
        "status": "ok",
        "mode": "mock",
        "backend": "online",
        "websocket": "online",
        "net": "testnet mock",
        "uptime": "dashboard-only",
    }


@app.get("/api/candles")
async def api_candles(symbol: str = "BTCUSDT", tf: str = "1m", limit: int = 300):
    """
    Основной источник данных для свечного графика.
    Фронт ожидает поле `candles` с массивом OHLC.
    """
    candles = gen_mock_candles(symbol=symbol, tf=tf, limit=limit)
    return {
        "symbol": symbol,
        "tf": tf,
        "candles": candles,
        "meta": {"source": "mock"},
    }


@app.post("/api/backtest/run")
async def api_backtest_run(payload: dict = None):
    payload = payload or {}
    symbol = payload.get("symbol", "BTCUSDT")
    tf = payload.get("tf", "1m")
    return backtest_engine.run(symbol=symbol, tf=tf)


@app.get("/api/backtest/summary")
async def api_backtest_summary():
    return backtest_engine.summary()

async def api_backtest_summary():
    # данные для блока "Бэктест"
    return {
        "symbol": "BTCUSDT",
        "tf": "1m",
        "return_pct": 2.3,
        "trades": 17,
        "winrate": 61.5,
        "sharpe": 1.4,
        "max_dd": -4.8,
    }


@app.get("/api/equity")
async def api_equity():
    # кривая equity для правого блока (если фронт её использует)
    series = gen_equity_curve(points=80)
    return {
        "series": series,
        "meta": {"start": series[0] if series else None, "end": series[-1] if series else None},
    }


# =========================
#   WEBSOCKET /ws
# =========================

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    Мок-стрим свечей:
    раз в секунду шлёт новую свечу около текущей цены.
    Фронт может подписываться и обновлять график.
    """
    await ws.accept()
    last_price = 50000.0

    try:
        while True:
            last_price += random.uniform(-50, 50)
            base = last_price
            o = base + random.uniform(-40, 40)
            c = base + random.uniform(-40, 40)
            h = max(o, c) + random.uniform(5, 20)
            l = min(o, c) - random.uniform(5, 20)

            candle = {
                "time": int(time.time()),
                "open": round(o, 2),
                "high": round(h, 2),
                "low": round(l, 2),
                "close": round(c, 2),
            }

            await ws.send_json({"type": "candle", "data": candle})
            await asyncio.sleep(1.0)
    except Exception:
        # клиент отключился — просто выходим
        return
