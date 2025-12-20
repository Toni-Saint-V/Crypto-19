# Bugfix snippets (for the 3 bugs)

Generated: 2025-12-20 02:42

## 1) core/dashboard/service.py — DashboardSnapshot

     1	from __future__ import annotations
     2	
     3	import asyncio
     4	from typing import List
     5	
     6	from pydantic import BaseModel, Field
     7	
     8	from .logic import build_dashboard_state
     9	
    10	
    11	class Candle(BaseModel):
    12	    time: int
    13	    open: float
    14	    high: float
    15	    low: float
    16	    close: float
    17	    volume: float
    18	
    19	
    20	class AISignal(BaseModel):
    21	    symbol: str
    22	    side: str
    23	    confidence: float
    24	    entry: float
    25	    target: float
    26	    stop_loss: float
    27	    timeframe: str
    28	    comment: str | None = None
    29	
    30	
    31	class Trade(BaseModel):
    32	    id: str
    33	    symbol: str
    34	    side: str
    35	    price: float
    36	    qty: float
    37	    timestamp: int
    38	    realized_pnl: float | None = None
    39	
    40	
    41	class DashboardSnapshot(BaseModel):
    42	    balance: float = Field(0.0)
    43	    daily_pnl_pct: float = Field(0.0)
    44	    total_profit: float = Field(0.0)
    45	    winrate_pct: float = Field(0.0)
    46	    active_positions: int = Field(0)
    47	    risk_level_pct: float = Field(0.0)
    48	
    49	    # legacy fields for old HTML dashboard
    50	    total_pnl: float | None = None
    51	    winrate: float | None = None
    52	    risk_level: float | None = None
    53	
    54	    symbol: str
    55	    timeframe: str
    56	
    57	    candles: List[Candle] = Field(default_factory=list)
    58	    ai_signals: List[AISignal] = Field(default_factory=list)
    59	    trades: List[Trade] = Field(default_factory=list)
    60	
    61	
    62	async def get_dashboard_snapshot(
    63	    symbol: str = "BTCUSDT",
    64	    timeframe: str = "15m",
    65	    mode: str | None = None,
    66	) -> DashboardSnapshot:
    67	    mode_value = mode or "live"
    68	    state = build_dashboard_state(
    69	        symbol=symbol,
    70	        timeframe=timeframe,
    71	        mode=mode_value,
    72	        limit=200,
    73	    )
    74	
    75	    # map new metric names to legacy ones used by old HTML UI
    76	    state["total_pnl"] = state.get("total_profit", 0.0)
    77	    state["winrate"] = state.get("winrate_pct", 0.0)
    78	    state["risk_level"] = state.get("risk_level_pct", 0.0)
    79	
    80	    return DashboardSnapshot(**state)
    81	
    82	
    83	def get_dashboard_snapshot_sync(
    84	    symbol: str = "BTCUSDT",
    85	    timeframe: str = "15m",
    86	    mode: str | None = None,
    87	) -> DashboardSnapshot:
    88	    return asyncio.run(
    89	        get_dashboard_snapshot(symbol=symbol, timeframe=timeframe, mode=mode)
    90	    )

## 2) core/notifications/notification_manager.py — reply_markup=keyboard

   180	    async def _send_to_user(self, user_id: int, alert: Alert):
   181	        """Send alert to specific user"""
   182	        # Format message
   183	        icon = alert.type.value
   184	        priority_icons = {
   185	            AlertPriority.LOW: "",
   186	            AlertPriority.MEDIUM: "❗",
   187	            AlertPriority.HIGH: "‼️",
   188	            AlertPriority.CRITICAL: "🚨"
   189	        }
   190	        priority_icon = priority_icons.get(alert.priority, "")
   191	        
   192	        text = f"{icon} {priority_icon} <b>{alert.title}</b>\n\n{alert.message}"
   193	        
   194	        # Add data if available
   195	        if alert.data:
   196	            text += "\n\n📊 <b>Details:</b>\n"
   197	            for key, value in alert.data.items():
   198	                text += f"• {key}: {value}\n"
   199	        
   200	        # Add timestamp
   201	        text += f"\n<i>🕐 {alert.timestamp.strftime('%H:%M:%S')}</i>"
   202	        
   203	        # Create keyboard with actions
   204	        keyboard = None
   205	        if alert.actions:
   206	            buttons = []
   207	            for action in alert.actions:
   208	                buttons.append(
   209	                    InlineKeyboardButton(
   210	                        text=action.get("text", "Action"),
   211	                        callback_data=f"alert_action:{alert.id}:{action.get('id', 'default')}"
   212	                    )
   213	                )
   214	            
   215	            # Add acknowledge button
   216	            buttons.append(
   217	                InlineKeyboardButton(
   218	                    text="✅ Acknowledge",
   219	                    callback_data=f"alert_ack:{alert.id}"
   220	                )
   221	            )
   222	            
   223	            # Arrange buttons in rows
   224	            keyboard = InlineKeyboardMarkup(
   225	                inline_keyboard=[buttons[i:i+2] for i in range(0, len(buttons), 2)]
   226	            )
   227	        
   228	        # Send message
   229	        # Send message
   230	        if getattr(self, 'bot', None) and hasattr(self.bot, 'send_message'):
   231	            await self.bot.send_message(
   232	                user_id,
   233	                text,
   234	                reply_markup=keyboard,
   235	            )
   236	        else:
   237	            # Bot not configured; skip notification send
   238	            pass
   239	    
   240	    async def send_signal_alert(self, signal_data: Any):
   241	        """Send trading signal alert"""
   242	        await self.create_alert(
   243	            alert_type=AlertType.SIGNAL,
   244	            title=f"Trading Signal: {signal_data.symbol}",
   245	            message=f"{signal_data.signal.value[1]} signal detected with {signal_data.confidence*100:.0f}% confidence",
   246	            priority=AlertPriority.HIGH if signal_data.confidence > 0.8 else AlertPriority.MEDIUM,
   247	            data={
   248	                "Symbol": signal_data.symbol,
   249	                "Price": f"${signal_data.price:.2f}",
   250	                "Signal": signal_data.signal.value[1],
   251	                "Confidence": f"{signal_data.confidence*100:.0f}%",
   252	                "Risk": signal_data.risk_level
   253	            },
   254	            actions=[
   255	                {"id": "view", "text": "📊 View Analysis"},
   256	                {"id": "trade", "text": "💰 Open Trade"}
   257	            ]
   258	        )
   259	    
   260	    async def send_risk_alert(self, title: str, data: Dict):
   261	        """Send risk management alert"""
   262	        await self.create_alert(
   263	            alert_type=AlertType.RISK,
   264	            title=title,
   265	            message="Risk threshold exceeded. Review your positions immediately.",
   266	            priority=AlertPriority.HIGH,
   267	            data=data,
   268	            actions=[
   269	                {"id": "positions", "text": "📋 View Positions"},
   270	                {"id": "close_all", "text": "🛑 Close All"}
   271	            ]
   272	        )
   273	    
   274	    async def send_price_alert(self, symbol: str, current_price: float, target_price: float, direction: str):
   275	        """Send price alert"""
   276	        emoji = "📈" if direction == "above" else "📉"
   277	        await self.create_alert(
   278	            alert_type=AlertType.PRICE,
   279	            title=f"Price Alert: {symbol}",
   280	            message=f"{symbol} is now {direction} ${target_price:.2f}",

## 3) core/backtest/engine.py — BacktestEngine.run metadata

   160	            peak = v
   161	        dd = (v / peak - 1.0) if peak > 0 else 0.0
   162	        if dd < max_dd:
   163	            max_dd = dd
   164	
   165	    wins = sum(1 for t in trades if t.pnl > 0)
   166	    win_rate = (wins / len(trades)) if trades else 0.0
   167	
   168	    return {
   169	        "initial_balance": float(initial_balance),
   170	        "final_balance": float(eq[-1]),
   171	        "total_return": float(total_return),
   172	        "max_drawdown": float(max_dd),
   173	        "trades": int(len(trades)),
   174	        "win_rate": float(win_rate),
   175	    }
   176	
   177	
   178	class BacktestEngine:
   179	    def __init__(self, risk_limits=None, **kwargs) -> None:
   180	        self.risk_limits = risk_limits
   181	        self.kwargs = dict(kwargs)
   182	
   183	    def run(
   184	        self,
   185	        candles=None,
   186	        signals=None,
   187	        symbol: Optional[str] = None,
   188	        timeframe: Optional[str] = None,
   189	        start: Optional[str] = None,
   190	        end: Optional[str] = None,
   191	        strategy: str = "buy_and_hold",
   192	        params: Optional[Dict[str, Any]] = None,
   193	        initial_balance: float = 1000.0,
   194	        fee_rate: float = 0.0,
   195	        slippage: float = 0.0,
   196	        **kwargs,
   197	    ) -> Dict[str, Any]:
   198	        if candles is None or signals is None:
   199	            if not symbol or not timeframe:
   200	                raise TypeError("BacktestEngine.run requires either (candles, signals) or (symbol, timeframe)")
   201	            from core.backtest.data import load_candles
   202	            from core.backtest.strategies import get_strategy
   203	
   204	            p = params or {}
   205	            candles = load_candles(
   206	                symbol=str(symbol),
   207	                timeframe=str(timeframe),
   208	                start=start,
   209	                end=end,
   210	                limit=int(p.get("limit", 5000)),
   211	            )
   212	            strat = get_strategy(strategy)
   213	            signals = strat(candles, p)
   214	
   215	        out = run_backtest(
   216	            candles=candles,
   217	            signals=signals,
   218	            initial_balance=float(initial_balance),
   219	            fee_rate=float(fee_rate),
   220	            slippage=float(slippage),
   221	        )
   222	        out["meta"] = {"symbol": symbol, "timeframe": timeframe, "strategy": strategy, "params": params or {}}
   223	        return out
