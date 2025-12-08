"""
CryptoBot Pro - FastAPI Server
AI-powered crypto trading dashboard with WebSocket support
"""

import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math
import time

log = logging.getLogger(__name__)
from core.backtest.engine import BacktestEngine
from core.ml.ml_service import MLService
from core.ai.toni_service import ToniAIService, ToniContext
from core.risk.risk_manager import RiskManager, RiskLimits
from core.exchange.factory import create_exchange_provider
from core.market_data.service import MarketDataService
import yaml

# === FASTAPI INITIALIZATION ===
app = FastAPI(title="CryptoBot Pro — Neural Dashboard")

# === CORS MIDDLEWARE ===
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

# === WEBSOCKET CONNECTION MANAGER ===
class ConnectionManager:
    def __init__(self):
        self.ai_connections: List[WebSocket] = []
        self.trade_connections: List[WebSocket] = []
    
    async def connect_ai(self, websocket: WebSocket):
        await websocket.accept()
        self.ai_connections.append(websocket)
        print(f"🟢 AI WebSocket connected. Total: {len(self.ai_connections)}")
    
    async def disconnect_ai(self, websocket: WebSocket):
        if websocket in self.ai_connections:
            self.ai_connections.remove(websocket)
        print(f"🔴 AI WebSocket disconnected. Total: {len(self.ai_connections)}")
    
    async def connect_trade(self, websocket: WebSocket):
        await websocket.accept()
        self.trade_connections.append(websocket)
        print(f"🟢 Trade WebSocket connected. Total: {len(self.trade_connections)}")
    
    async def disconnect_trade(self, websocket: WebSocket):
        if websocket in self.trade_connections:
            self.trade_connections.remove(websocket)
        print(f"🔴 Trade WebSocket disconnected. Total: {len(self.trade_connections)}")
    
    async def broadcast_ai(self, message: Dict[str, Any]):
        """Broadcast message to all AI connections"""
        disconnected = []
        for connection in self.ai_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        for conn in disconnected:
            await self.disconnect_ai(conn)
    
    async def broadcast_trade(self, message: Dict[str, Any]):
        """Broadcast message to all trade connections"""
        disconnected = []
        for connection in self.trade_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        for conn in disconnected:
            await self.disconnect_trade(conn)

manager = ConnectionManager()

# === LOAD CONFIG ===
def load_config():
    """Load configuration from config.yaml"""
    try:
        with open("config.yaml", "r") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        log.warning("config.yaml not found, using defaults")
        return {}

config = load_config()
risk_config = config.get("risk", {})
risk_limits = RiskLimits(
    max_open_positions=risk_config.get("max_open_positions", 5),
    max_drawdown_percent=risk_config.get("max_drawdown_percent", 20.0),
    daily_loss_limit_percent=risk_config.get("daily_loss_limit_percent", 5.0),
    default_stop_loss_percent=risk_config.get("default_stop_loss_percent", 2.0)
)

# === SERVICES ===
backtest_engine = BacktestEngine(risk_limits=risk_limits)
ml_service = MLService()
global_risk_manager = RiskManager(limits=risk_limits)
market_data_service = MarketDataService()

# Default exchange provider
default_exchange = config.get("exchange", {}).get("default", "bybit")
exchange_config = config.get("exchange", {})
default_provider = create_exchange_provider(
    default_exchange,
    testnet=exchange_config.get(default_exchange, {}).get("testnet", True)
)

# Initialize Toni AI Service
toni_mode = os.getenv("TONI_MODE", "stub")
toni_api_key = os.getenv("OPENAI_API_KEY")
toni_service = ToniAIService(mode=toni_mode, api_key=toni_api_key)

# Store last backtest context for Toni
last_backtest_context = None

# === ROUTES ===


def _make_test_dashboard_payload() -> dict:
    """
    Генерируем стабильный тестовый payload для /api/dashboard.
    Никаких запросов к биржам, только локальные данные.
    """
    equity = 10_000.0
    balance = 9_800.0
    portfolio_value = 10_000.0
    pnl = 200.0
    risk = "Medium"
    confidence = 65.0

    positions = [
        {
            "symbol": "BTCUSDT",
            "size": 0.15,
            "entry_price": 50_000.0,
            "pnl": 150.0,
            "side": "LONG",
        },
        {
            "symbol": "ETHUSDT",
            "size": 1.0,
            "entry_price": 2_500.0,
            "pnl": 50.0,
            "side": "LONG",
        },
    ]

    open_orders = [
        {
            "symbol": "BTCUSDT",
            "price": 49_500.0,
            "size": 0.05,
            "side": "BUY",
            "type": "limit",
        }
    ]

    return {
        "mode": "test",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "equity": equity,
        "balance": balance,
        "portfolio_value": portfolio_value,
        "pnl": pnl,
        "risk": risk,
        "confidence": confidence,
        "positions": positions,
        "open_orders": open_orders,
        "exchange": "bybit-test",
        "symbol": "BTCUSDT",
        "timeframe": "1m",
    }


def _make_test_candles(symbol: str, timeframe: str = "1m", limit: int = 200) -> List[Dict]:
    """
    Генерируем синтетические свечи вокруг базовой цены.
    Время: unix timestamp (секунды), шаг: 60 секунд.
    Никаких внешних запросов, только локальная математика.
    """
    now = int(time.time())
    step_sec = 60
    base_price = 50_000.0 if symbol.upper().startswith("BTC") else 2_500.0

    candles: List[Dict] = []
    for i in range(limit):
        t = now - (limit - i) * step_sec
        offset = 300.0 * math.sin(i / 10.0)
        noise = 50.0 * math.sin(i / 3.0)
        open_ = base_price + offset + noise
        close = open_ + (math.sin(i / 5.0) * 100.0)
        high = max(open_, close) + 50.0
        low = min(open_, close) - 50.0
        volume = 10_000 + i * 10

        candles.append(
            {
                "time": t,
                "open": round(open_, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": float(volume),
            }
        )

    return candles

@app.get("/", response_class=HTMLResponse)
async def index():
    """Redirect root to the unified dashboard"""
    return RedirectResponse(url="/dashboard", status_code=307)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Render the unified dashboard"""
    return templates.TemplateResponse("dashboard.html", {"request": request})

# === REST API ENDPOINTS ===

@app.get("/api/dashboard")
async def api_dashboard_test_mode():
    """
    TEST-режим: всегда возвращаем фикстурный payload для дашборда.
    Никаких обращений к бирже и внешним сервисам.
    """
    return _make_test_dashboard_payload()

@app.get("/api/candles")
async def api_candles_test_mode(
    exchange: str = "bybit-test",
    symbol: str = "BTCUSDT",
    timeframe: str = "1m",
    limit: int = 200,
    mode: str = "test",
):
    """
    TEST-режим: возвращаем синтетические свечи для любого symbol/timeframe.
    Никаких обращений к бирже, только локальная генерация.
    """
    candles = _make_test_candles(symbol=symbol, timeframe=timeframe, limit=limit)
    return {
        "exchange": exchange,
        "symbol": symbol,
        "timeframe": timeframe,
        "mode": "test",
        "candles": candles,
        "count": len(candles),
    }


@app.get("/api/selfcheck")
async def api_selfcheck():
    """
    Простая самопроверка TEST-режима.
    """
    dash = _make_test_dashboard_payload()
    candles = _make_test_candles(symbol="BTCUSDT", timeframe="1m", limit=10)
    return {
        "ok": True,
        "dashboard_sample": {
            "equity": dash.get("equity"),
            "balance": dash.get("balance"),
            "pnl": dash.get("pnl"),
            "risk": dash.get("risk"),
            "confidence": dash.get("confidence"),
        },
        "candles_sample_len": len(candles),
    }

@app.post("/api/backtest/run")
async def api_backtest_run(
    symbol: str = Query("BTCUSDT"),
    interval: str = Query("60"),
    strategy: str = Query("pattern3_extreme"),
    risk_per_trade: float = Query(100.0),
    rr_ratio: float = Query(4.0),
    limit: int = Query(500)
):
    """
    Run backtest with specified parameters.
    Returns trades, equity curve, and performance metrics.
    """
    try:
        result = backtest_engine.run(
            symbol=symbol,
            interval=interval,
            strategy=strategy,
            risk_per_trade=risk_per_trade,
            rr_ratio=rr_ratio,
            limit=limit
        )
        
        if "error" in result:
            return JSONResponse(result, status_code=400)
        
        # Calculate equity curve from trades
        initial_capital = 10000.0
        equity_curve = [initial_capital]
        current_equity = initial_capital
        
        for trade in result.get("trades", []):
            pnl = trade.get("result_R", 0) * risk_per_trade
            current_equity += pnl
            equity_curve.append(max(1000, current_equity))  # Floor at 10%
        
        result["equity_curve"] = equity_curve
        result["initial_capital"] = initial_capital
        
        # Store context for Toni AI
        global last_backtest_context
        last_backtest_context = result
        
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/backtest")
async def api_backtest_legacy():
    """
    Legacy endpoint for backward compatibility.
    Returns mock backtest data.
    """
    base_equity = 10000
    equity_curve = [base_equity]
    prices = [42000]
    
    for i in range(200):
        change = random.uniform(-0.02, 0.03)
        new_equity = equity_curve[-1] * (1 + change)
        equity_curve.append(max(5000, new_equity))
        price_change = random.uniform(-500, 800)
        prices.append(max(30000, prices[-1] + price_change))
    
    peak = base_equity
    max_drawdown = 0
    for equity in equity_curve:
        if equity > peak:
            peak = equity
        drawdown = (peak - equity) / peak * 100
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    trades = []
    for i in range(0, len(equity_curve) - 1, 20):
        side = random.choice(["buy", "sell"])
        trades.append({
            "timestamp": i,
            "side": side,
            "price": prices[i],
            "equity": equity_curve[i],
            "pnl": round((equity_curve[i] - base_equity) / base_equity * 100, 2)
        })
    
    total_return = ((equity_curve[-1] - base_equity) / base_equity) * 100
    
    return JSONResponse({
        "equity_curve": equity_curve,
        "prices": prices,
        "trades": trades,
        "statistics": {
            "total_return": round(total_return, 2),
            "max_drawdown": round(max_drawdown, 2),
            "total_trades": len(trades),
            "win_rate": round(random.uniform(45, 65), 1),
            "sharpe_ratio": round(random.uniform(0.5, 2.5), 2)
        }
    })

@app.get("/api/strategies")
async def api_strategies():
    """Get list of available strategies with descriptions"""
    strategies = backtest_engine.get_available_strategies()
    return JSONResponse({"strategies": strategies})

@app.get("/api/ml/predict")
async def api_ml_predict(
    symbol: str = Query("BTCUSDT"),
    interval: str = Query("60"),
    limit: int = Query(100)
):
    """Get ML prediction for current market conditions"""
    try:
        prediction = await ml_service.predict(symbol=symbol, interval=interval, limit=limit)
        return JSONResponse(prediction)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/risk/status")
async def api_risk_status():
    """Get current risk management status"""
    try:
        status = global_risk_manager.get_risk_status()
        return JSONResponse(status)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/data/upload-csv")
async def api_upload_csv(request: Request):
    """Upload CSV file for backtesting"""
    try:
        form = await request.form()
        file = form.get("file")
        
        if not file:
            return JSONResponse({"error": "No file provided"}, status_code=400)
        
        # Save uploaded file temporarily
        import tempfile
        import shutil
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        # Load CSV using provider
        from core.exchange.csv_provider import CSVExchangeProvider
        provider = CSVExchangeProvider()
        if provider.load_csv(tmp_path):
            # Store provider in session/cache (simplified - in production use proper storage)
            return JSONResponse({
                "message": "CSV loaded successfully",
                "rows": len(provider.data_cache) if provider.data_cache is not None else 0
            })
        else:
            return JSONResponse({"error": "Failed to load CSV file"}, status_code=400)
            
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/risk/resume")
async def api_risk_resume():
    """Resume trading after risk pause (manual override)"""
    try:
        global_risk_manager.resume_trading()
        return JSONResponse({"message": "Trading resumed", "status": global_risk_manager.get_risk_status()})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/toni/ask")
async def api_toni_ask(request: Request):
    """Ask Toni AI a question"""
    try:
        data = await request.json()
        query = data.get("query", "")
        context_data = data.get("context", {})
        
        if not query:
            return JSONResponse({"error": "Query is required"}, status_code=400)
        
        # Build context
        context = ToniContext(
            last_backtest=context_data.get("last_backtest"),
            current_strategy=context_data.get("strategy"),
            current_symbol=context_data.get("symbol"),
            current_timeframe=context_data.get("timeframe"),
            is_live_mode=context_data.get("is_live_mode", False),
            additional_data=context_data.get("additional_data", {})
        )
        
        # Get answer from Toni
        answer = await toni_service.answer(query, context)
        
        return JSONResponse({
            "answer": answer,
            "mode": toni_service.mode.value,
            "timestamp": time.time()
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# === WEBSOCKET ENDPOINTS ===

@app.websocket("/ws/ai")
async def websocket_ai(websocket: WebSocket):
    """
    AI WebSocket endpoint for chat and system updates
    Handles bidirectional communication for AI assistant
    """
    await manager.connect_ai(websocket)
    
    # Send welcome message
    await websocket.send_json({
        "type": "system",
        "message": "AI Assistant (Anton) connected. Ready to help!",
        "timestamp": time.time()
    })
    
    try:
        # Start background data stream
        async def stream_data():
            while True:
                await asyncio.sleep(3)
                await manager.broadcast_ai({
                    "type": "data",
                    "payload": {
                        "confidence": round(random.uniform(60, 95), 2),
                        "risk": round(random.uniform(0.3, 0.8), 3),
                        "pnl": round(random.uniform(-3, 5), 2),
                        "price": round(random.uniform(40000, 45000), 2)
                    },
                    "timestamp": time.time()
                })
        
        # Start streaming task
        stream_task = asyncio.create_task(stream_data())
        
        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle chat messages
                if message_data.get("type") == "message" or "text" in message_data:
                    user_message = message_data.get("text") or message_data.get("message", "")
                    
                    # Build context from current state
                    context = ToniContext(
                        last_backtest=last_backtest_context,
                        current_strategy=message_data.get("strategy"),
                        current_symbol=message_data.get("symbol"),
                        current_timeframe=message_data.get("timeframe"),
                        is_live_mode=message_data.get("mode") == "live"
                    )
                    
                    # Get response from Toni AI
                    try:
                        response = await toni_service.answer(user_message, context)
                    except Exception as e:
                        log.error(f"Toni AI error: {e}")
                        response = f"Sorry, I encountered an error. Please try again. ({str(e)})"
                    
                    await websocket.send_json({
                        "type": "response",
                        "message": response,
                        "timestamp": time.time()
                    })
                
                # Handle commands
                elif message_data.get("type") == "command":
                    command = message_data.get("command", "")
                    response = handle_command(command)
                    await websocket.send_json({
                        "type": "response",
                        "message": response,
                        "timestamp": time.time()
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": time.time()
                })
            except Exception as e:
                print(f"Error handling AI message: {e}")
                break
        
        stream_task.cancel()
        
    except WebSocketDisconnect:
        await manager.disconnect_ai(websocket)
    except Exception as e:
        print(f"AI WebSocket error: {e}")
        await manager.disconnect_ai(websocket)

@app.websocket("/ws/trades")
async def websocket_trades(websocket: WebSocket):
    """
    Trade WebSocket endpoint for live trade signals
    Streams simulated trading signals and updates
    """
    await manager.connect_trade(websocket)
    
    # Send initial connection message
    await websocket.send_json({
        "type": "system",
        "message": "Trade signal stream connected",
        "timestamp": time.time()
    })
    
    try:
        base_price = 42000.0
        equity = 100.0
        
        while True:
            await asyncio.sleep(random.uniform(2, 5))
            
            # Generate random trade signal
            side = random.choice(["buy", "sell"])
            price_change = random.uniform(-200, 300)
            base_price += price_change
            base_price = max(35000, min(50000, base_price))  # Keep in range
            
            # Update equity based on trade
            if side == "buy":
                equity += random.uniform(0.1, 0.8)
            else:
                equity += random.uniform(-0.5, 0.3)
            
            # Generate trade signal
            trade_signal = {
                "type": "trade",
                "side": side,
                "symbol": "BTCUSDT",
                "price": round(base_price, 2),
                "equity": round(equity, 2),
                "confidence": round(random.uniform(65, 95), 1),
                "timestamp": time.time(),
                "datetime": datetime.now().isoformat()
            }
            
            await websocket.send_json(trade_signal)
            
            # Occasionally send general signals
            if random.random() < 0.3:
                signal_types = ["new", "ai", "bt"]
                signal_messages = [
                    "High confidence buy signal detected",
                    "Risk level adjusted to 0.6%",
                    "Backtest completed: +23% return",
                    "Market volatility increased",
                    "Strategy rebalanced"
                ]
                
                await websocket.send_json({
                    "type": "signal",
                    "signal_type": random.choice(signal_types),
                    "message": random.choice(signal_messages),
                    "timestamp": time.time()
                })
    
    except WebSocketDisconnect:
        await manager.disconnect_trade(websocket)
    except Exception as e:
        print(f"Trade WebSocket error: {e}")
        await manager.disconnect_trade(websocket)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Legacy WebSocket endpoint for backward compatibility"""
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

# === HELPER FUNCTIONS ===

def generate_ai_response(user_message: str) -> str:
    """Generate contextual AI response based on user message"""
    message_lower = user_message.lower()
    
    # Strategy-related queries
    if any(word in message_lower for word in ["strategy", "strategies", "backtest", "performance"]):
        responses = [
            "Current strategy 'Momentum ML v2' is performing well with 23% return over the last month.",
            "Backtest results show a Sharpe ratio of 1.8 and max drawdown of 12%.",
            "I recommend monitoring the risk-adjusted returns closely. Current win rate is 58%."
        ]
        return random.choice(responses)
    
    # Market-related queries
    elif any(word in message_lower for word in ["market", "price", "btc", "eth", "trend"]):
        responses = [
            "BTC is showing bullish momentum with increasing volume. Current price action suggests continuation.",
            "Market volatility is moderate. Risk management parameters are optimal for current conditions.",
            "Technical indicators show mixed signals. Waiting for clearer trend confirmation."
        ]
        return random.choice(responses)
    
    # Risk-related queries
    elif any(word in message_lower for word in ["risk", "risk management", "drawdown", "stop loss"]):
        responses = [
            "Current risk level is set to 0.6% per trade. Maximum drawdown is within acceptable limits.",
            "Risk parameters are dynamically adjusted based on market volatility. Current settings are optimal.",
            "Stop loss levels are active and protecting capital. No immediate risk concerns."
        ]
        return random.choice(responses)
    
    # General queries
    elif any(word in message_lower for word in ["hello", "hi", "hey", "help"]):
        responses = [
            "Hello! I'm Anton, your AI trading assistant. I can help with strategies, backtests, and market analysis.",
            "Hi there! Ask me about trading strategies, market conditions, or system performance.",
            "Hey! I'm here to help. Try asking about current performance, risk levels, or market trends."
        ]
        return random.choice(responses)
    
    # Default response
    else:
        responses = [
            "I understand. Let me analyze that for you.",
            "Processing your request. One moment...",
            "That's an interesting question. Based on current data...",
            "I'll help you with that. Here's what I found:",
            "Good question! Let me check the latest data..."
        ]
        return random.choice(responses) + " " + generate_contextual_info()

def generate_contextual_info() -> str:
    """Generate contextual trading information"""
    info_types = [
        f"Current PNL is {random.uniform(-2, 3):.2f}%.",
        f"Confidence level is at {random.uniform(70, 95):.1f}%.",
        f"Risk-adjusted returns are positive this week.",
        f"Market conditions are favorable for the current strategy."
    ]
    return random.choice(info_types)

def handle_command(command: str) -> str:
    """Handle system commands"""
    command_lower = command.lower().strip()
    
    if command_lower == "status":
        return "System status: Running | Connected | All systems operational"
    elif command_lower == "performance":
        return f"Performance: +{random.uniform(15, 30):.1f}% return | Sharpe: {random.uniform(1.2, 2.0):.2f}"
    elif command_lower == "risk":
        return f"Risk level: {random.uniform(0.4, 0.8):.2f}% | Max drawdown: {random.uniform(8, 15):.1f}%"
    else:
        return f"Command '{command}' not recognized. Try: status, performance, or risk"

# === RUN SERVER ===

if __name__ == "__main__":
    print("🚀 Launching CryptoBot Pro Dashboard")
    print("🌐 Dashboard: http://127.0.0.1:8000/dashboard")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
