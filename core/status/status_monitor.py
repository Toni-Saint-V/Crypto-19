import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from bot.core.logger import get_logger
from bot.trading.bybit_v5 import BybitV5

log = get_logger("status_monitor")

class SystemStatus(Enum):
    ONLINE = "🟢"
    WARNING = "🟡"
    ERROR = "🔴"
    MAINTENANCE = "🟠"

class MarketTrend(Enum):
    STRONG_BULL = "🚀 Strong Bullish"
    BULL = "📈 Bullish"
    NEUTRAL = "➡️ Neutral"
    BEAR = "📉 Bearish"
    STRONG_BEAR = "💥 Strong Bearish"

@dataclass
class StatusData:
    """Real-time status data container"""
    timestamp: datetime = field(default_factory=datetime.now)
    system_status: SystemStatus = SystemStatus.ONLINE
    api_latency: float = 0.0
    balance_usdt: float = 0.0
    open_positions: int = 0
    total_pnl: float = 0.0
    daily_pnl: float = 0.0
    market_trend: MarketTrend = MarketTrend.NEUTRAL
    active_strategies: List[str] = field(default_factory=list)
    alerts: List[Dict] = field(default_factory=list)
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    websocket_status: bool = True
    last_trade: Optional[Dict] = None
    error_count: int = 0
    success_rate: float = 100.0

class StatusMonitor:
    """Advanced status monitoring system with real-time updates"""
    
    def __init__(self):
        self.current_status = StatusData()
        self.history: List[StatusData] = []
        self.subscribers: Dict[int, asyncio.Queue] = {}
        self.monitoring_task: Optional[asyncio.Task] = None
        self.update_interval = 5  # seconds
        self.api = BybitV5()
        
    async def start_monitoring(self):
        """Start background monitoring task"""
        if self.monitoring_task and not self.monitoring_task.done():
            return
        
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        log.info("Status monitoring started")
    
    async def stop_monitoring(self):
        """Stop monitoring task"""
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        log.info("Status monitoring stopped")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while True:
            try:
                await self._update_status()
                await self._notify_subscribers()
                await asyncio.sleep(self.update_interval)
            except Exception as e:
                log.error(f"Monitoring error: {e}")
                self.current_status.system_status = SystemStatus.ERROR
                self.current_status.error_count += 1
                await asyncio.sleep(self.update_interval * 2)
    
    async def _update_status(self):
        """Update all status information"""
        try:
            # Measure API latency
            start_time = asyncio.get_event_loop().time()
            
            # Get balance
            self.current_status.balance_usdt = await self.api.get_balance("USDT")
            
            # Get positions
            positions = await self.api.get_positions()
            self.current_status.open_positions = len(positions)
            
            # Calculate P&L
            total_pnl = sum(p.get("pnl", 0) for p in positions)
            self.current_status.total_pnl = total_pnl
            
            # Update latency
            self.current_status.api_latency = (asyncio.get_event_loop().time() - start_time) * 1000
            
            # Analyze market trend
            self.current_status.market_trend = await self._analyze_market_trend()
            
            # Update system metrics
            await self._update_system_metrics()
            
            # Check for alerts
            await self._check_alerts()
            
            # Update status based on metrics
            self._determine_system_status()
            
            # Update timestamp
            self.current_status.timestamp = datetime.now()
            
            # Add to history
            if len(self.history) >= 100:
                self.history.pop(0)
            self.history.append(StatusData(**self.current_status.__dict__))
            
        except Exception as e:
            log.error(f"Status update error: {e}")
            self.current_status.system_status = SystemStatus.ERROR
    
    async def _analyze_market_trend(self) -> MarketTrend:
        """Analyze current market trend"""
        try:
            # Get BTC price data for trend analysis
            klines = await self.api.get_kline("BTCUSDT", "15", 20)
            if not klines:
                return MarketTrend.NEUTRAL
            
            # Simple trend analysis based on moving averages
            closes = [float(k[4]) for k in klines[-10:]]
            avg_recent = sum(closes[-5:]) / 5
            avg_older = sum(closes[:5]) / 5
            
            change_pct = ((avg_recent - avg_older) / avg_older) * 100
            
            if change_pct > 2:
                return MarketTrend.STRONG_BULL
            elif change_pct > 0.5:
                return MarketTrend.BULL
            elif change_pct < -2:
                return MarketTrend.STRONG_BEAR
            elif change_pct < -0.5:
                return MarketTrend.BEAR
            else:
                return MarketTrend.NEUTRAL
                
        except Exception as e:
            log.error(f"Market trend analysis error: {e}")
            return MarketTrend.NEUTRAL
    
    async def _update_system_metrics(self):
        """Update system performance metrics"""
        try:
            import psutil
            self.current_status.cpu_usage = psutil.cpu_percent(interval=1)
            self.current_status.memory_usage = psutil.virtual_memory().percent
        except ImportError:
            # psutil not installed, use defaults
            self.current_status.cpu_usage = 0
            self.current_status.memory_usage = 0
    
    async def _check_alerts(self):
        """Check for important alerts"""
        alerts = []
        
        # Low balance alert
        if self.current_status.balance_usdt < 100:
            alerts.append({
                "type": "warning",
                "message": "Low balance detected",
                "value": self.current_status.balance_usdt
            })
        
        # High API latency alert
        if self.current_status.api_latency > 1000:
            alerts.append({
                "type": "warning",
                "message": "High API latency",
                "value": f"{self.current_status.api_latency:.0f}ms"
            })
        
        # Large loss alert
        if self.current_status.total_pnl < -100:
            alerts.append({
                "type": "critical",
                "message": "Significant loss detected",
                "value": f"${self.current_status.total_pnl:.2f}"
            })
        
        # System resource alert
        if self.current_status.cpu_usage > 80:
            alerts.append({
                "type": "warning",
                "message": "High CPU usage",
                "value": f"{self.current_status.cpu_usage:.0f}%"
            })
        
        self.current_status.alerts = alerts
    
    def _determine_system_status(self):
        """Determine overall system status"""
        if self.current_status.error_count > 5:
            self.current_status.system_status = SystemStatus.ERROR
        elif self.current_status.alerts:
            critical_alerts = [a for a in self.current_status.alerts if a["type"] == "critical"]
            if critical_alerts:
                self.current_status.system_status = SystemStatus.ERROR
            else:
                self.current_status.system_status = SystemStatus.WARNING
        elif self.current_status.api_latency > 500:
            self.current_status.system_status = SystemStatus.WARNING
        else:
            self.current_status.system_status = SystemStatus.ONLINE
    
    async def _notify_subscribers(self):
        """Notify all subscribers of status update"""
        for user_id, queue in self.subscribers.items():
            try:
                await queue.put(self.get_status_summary())
            except asyncio.QueueFull:
                # Clear old messages
                while not queue.empty():
                    queue.get_nowait()
                await queue.put(self.get_status_summary())
            except Exception as e:
                log.error(f"Failed to notify subscriber {user_id}: {e}")
    
    def subscribe(self, user_id: int) -> asyncio.Queue:
        """Subscribe to status updates"""
        if user_id not in self.subscribers:
            self.subscribers[user_id] = asyncio.Queue(maxsize=10)
        return self.subscribers[user_id]
    
    def unsubscribe(self, user_id: int):
        """Unsubscribe from status updates"""
        if user_id in self.subscribers:
            del self.subscribers[user_id]
    
    def get_status_summary(self) -> Dict[str, Any]:
        """Get current status summary"""
        return {
            "timestamp": self.current_status.timestamp.isoformat(),
            "system": self.current_status.system_status.value,
            "balance": f"{self.current_status.balance_usdt:.2f}",
            "positions": self.current_status.open_positions,
            "pnl": f"{self.current_status.total_pnl:.2f}",
            "daily_pnl": f"{self.current_status.daily_pnl:.2f}",
            "market_trend": self.current_status.market_trend.value,
            "latency": f"{self.current_status.api_latency:.0f}ms",
            "alerts": len(self.current_status.alerts),
            "cpu": f"{self.current_status.cpu_usage:.1f}%",
            "memory": f"{self.current_status.memory_usage:.1f}%"
        }
    
    async def get_trading_status(self) -> Dict[str, Any]:
        """Get detailed trading status"""
        await self._update_status()
        return self.get_status_summary()
    
    def format_status_bar(self) -> str:
        """Format status for Telegram status bar"""
        status = self.current_status
        
        # Compact status bar
        bar = (
            f"{status.system_status.value} "
            f"│ 💰 {status.balance_usdt:.0f} "
            f"│ 📊 {status.open_positions} "
            f"│ {'🔴' if status.total_pnl < 0 else '🟢'} {abs(status.total_pnl):.0f} "
            f"│ {status.market_trend.value.split()[0]} "
            f"│ ⚡ {status.api_latency:.0f}ms"
        )
        
        if status.alerts:
            bar += f" │ ⚠️ {len(status.alerts)}"
        
        return bar
    
    def format_detailed_status(self) -> str:
        """Format detailed status report"""
        status = self.current_status
        
        report = f"""
📊 <b>System Status Report</b>
{'-' * 30}

<b>🔧 System Health</b>
├─ Status: {status.system_status.value}
├─ API Latency: {status.api_latency:.0f}ms
├─ CPU Usage: {status.cpu_usage:.1f}%
├─ Memory: {status.memory_usage:.1f}%
└─ Errors: {status.error_count}

<b>💰 Trading Status</b>
├─ Balance: ${status.balance_usdt:.2f}
├─ Open Positions: {status.open_positions}
├─ Total P&L: ${status.total_pnl:.2f}
├─ Daily P&L: ${status.daily_pnl:.2f}
└─ Success Rate: {status.success_rate:.1f}%

<b>📈 Market Analysis</b>
└─ Trend: {status.market_trend.value}

<b>🎯 Active Strategies</b>
"""
        if status.active_strategies:
            for strategy in status.active_strategies:
                report += f"├─ {strategy}\n"
        else:
            report += "└─ None\n"
        
        if status.alerts:
            report += "\n<b>⚠️ Alerts</b>\n"
            for alert in status.alerts[:5]:
                emoji = "🔴" if alert["type"] == "critical" else "🟡"
                report += f"{emoji} {alert['message']}: {alert['value']}\n"
        
        report += f"\n<i>Updated: {status.timestamp.strftime('%H:%M:%S')}</i>"
        
        return report
    
    async def get_performance_metrics(self, period_hours: int = 24) -> Dict[str, Any]:
        """Get performance metrics for specified period"""
        cutoff = datetime.now() - timedelta(hours=period_hours)
        relevant_history = [h for h in self.history if h.timestamp > cutoff]
        
        if not relevant_history:
            return {}
        
        return {
            "avg_latency": sum(h.api_latency for h in relevant_history) / len(relevant_history),
            "max_latency": max(h.api_latency for h in relevant_history),
            "min_latency": min(h.api_latency for h in relevant_history),
            "uptime": sum(1 for h in relevant_history if h.system_status == SystemStatus.ONLINE) / len(relevant_history) * 100,
            "total_errors": sum(h.error_count for h in relevant_history),
            "avg_cpu": sum(h.cpu_usage for h in relevant_history) / len(relevant_history),
            "avg_memory": sum(h.memory_usage for h in relevant_history) / len(relevant_history),
            "samples": len(relevant_history)
        }
