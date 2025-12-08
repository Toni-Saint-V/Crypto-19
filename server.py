import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import asyncio, random, os

# === FASTAPI INITIALIZATION ===
app = FastAPI(title="CryptoBot Pro — Neural Dashboard")





from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === PATHS ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "web", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "web", "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# === ROUTES ===

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Redirect root to new dashboard"""
    return templates.TemplateResponse("dashboard_new.html", {"request": request})

@app.get("/dashboard_new", response_class=HTMLResponse)
async def dashboard_new(request: Request):
    """Main neural dashboard"""
    return templates.TemplateResponse("dashboard_new.html", {"request": request})

# === REST API ENDPOINTS ===

@app.get("/api/dashboard")
async def api_dashboard():
    """Return dynamic dashboard metrics"""
    return JSONResponse({
        "pnl": round(random.uniform(-2, 2), 2),
        "risk": random.choice(["Low", "Medium", "High"]),
        "confidence": round(random.uniform(50, 99), 1)
    })

@app.get("/api/backtest/run")
async def api_backtest():
    """Generate synthetic equity curve"""
    curve = [100]
    for _ in range(100):
        curve.append(curve[-1] + random.uniform(-1, 1))
    return JSONResponse({"equity_curve": curve})

# === WEBSOCKET LIVE CHANNEL ===

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Live stream of trading metrics"""
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

# === RUN SERVER ===

if __name__ == "__main__":
    print("🚀 Launching CryptoBot Pro Dashboard at http://127.0.0.1:8000/dashboard_new")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)















# === Anton Protocol v3.9 WS Unified Payload ===
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
import asyncio, json, time, random

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/ai")
async def websocket_ai(ws: WebSocket):
    await ws.accept()
    print("🟢 WS Connected:", ws.client)
    try:
        while True:
            data = {
                "type": "data",
                "payload": {
                    "confidence": round(random.uniform(0, 100), 2),
                    "risk": round(random.uniform(0, 1), 3),
                    "pnl": round(random.uniform(-5, 5), 2)
                },
                "timestamp": time.time()
            }
            await ws.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print("🔴 WS Disconnected (client closed)")
# === End Anton Protocol v3.9 WS Unified Payload ===

# === Trading Core Route Patch ===
from fastapi.responses import HTMLResponse
from fastapi import Request
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="web/templates")

@app.get("/trading_core", response_class=HTMLResponse)
async def trading_core(request: Request):
    """Render the new Trading Core dashboard."""
    return templates.TemplateResponse("trading_core.html", {"request": request})
# === END PATCH ===
