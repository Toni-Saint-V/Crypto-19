from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import asyncio
from ml.real_model import get_real_confidence

router = APIRouter()

@router.get("/api/ai/confidence")
async def ai_confidence():
    conf = await get_real_confidence()
    return JSONResponse({"confidence": conf})

@router.websocket("/ws/ai")
async def ws_ai(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            conf = await get_real_confidence()
            await websocket.send_json({"confidence": conf})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print("🔴 /ws/ai disconnected")
