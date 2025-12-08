from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import asyncio
import random

router = APIRouter()

# 📊 Простое API для текущего состояния
@router.get("/api/dashboard")
async def get_dashboard_state():
    return JSONResponse({
        "pnl": round(random.uniform(-2, 2), 2),
        "risk": random.choice(["Low", "Medium", "High"]),
        "confidence": round(random.uniform(50, 99), 1)
    })

# 💹 Эндпоинт бэктеста
@router.get("/api/backtest/run")
async def run_backtest():
    curve = [100]
    for _ in range(100):
        curve.append(curve[-1] + random.uniform(-1, 1))
    return JSONResponse({"equity_curve": curve})

# 🔌 WebSocket — живой поток данных
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(2)
            data = {
                "pnl": round(random.uniform(-5, 5), 2),
                "risk": random.choice(["Low", "Medium", "High"]),
                "confidence": round(random.uniform(40, 99), 1)
            }
            await websocket.send_json(data)
    except WebSocketDisconnect:
        print("🔴 WebSocket disconnected")
