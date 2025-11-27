import asyncio
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import logging
logger = logging.getLogger(__name__)

log = get_logger("notifications")

class AlertType(Enum):
    PRICE = "💰"
    SIGNAL = "📊"
    RISK = "⚠️"
    POSITION = "📋"
    SYSTEM = "🔧"
    NEWS = "📰"
    STRATEGY = "🎯"
    CUSTOM = "🔔"

class AlertPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class Alert:
    """Alert data structure"""
    id: str
    type: AlertType
    priority: AlertPriority
    title: str
    message: str
    timestamp: datetime = field(default_factory=datetime.now)
    data: Optional[Dict] = None
    actions: Optional[List[Dict]] = None
    expires_at: Optional[datetime] = None
    sent_to: Set[int] = field(default_factory=set)
    acknowledged_by: Set[int] = field(default_factory=set)

@dataclass
class UserPreferences:
    """User notification preferences"""
    user_id: int
    enabled: bool = True
    alert_types: Set[AlertType] = field(default_factory=lambda: set(AlertType))
    min_priority: AlertPriority = AlertPriority.LOW
    quiet_hours_start: Optional[int] = None  # Hour (0-23)
    quiet_hours_end: Optional[int] = None
    symbols: Set[str] = field(default_factory=lambda: {"BTCUSDT", "ETHUSDT", "SOLUSDT"})
    price_alerts: List[Dict] = field(default_factory=list)  # [{"symbol": "BTC", "price": 50000, "direction": "above"}]
    rsi_alerts: List[Dict] = field(default_factory=list)
    volume_alerts: List[Dict] = field(default_factory=list)

class NotificationManager:
    """Advanced notification and alert management system"""
    
    def __init__(self, bot: Bot):
        self.bot = bot
        self.alerts: Dict[str, Alert] = {}
        self.user_preferences: Dict[int, UserPreferences] = {}
        self.alert_queue: asyncio.Queue = asyncio.Queue()
        self.processing_task: Optional[asyncio.Task] = None
        self.alert_counter = 0
        
        # Default subscribers (load from DB in production)
        self.subscribers: Set[int] = set()
        
    async def start(self):
        """Start notification processing"""
        if not self.processing_task or self.processing_task.done():
            self.processing_task = asyncio.create_task(self._process_alerts())
            log.info("Notification manager started")
    
    async def stop(self):
        """Stop notification processing"""
        if self.processing_task:
            self.processing_task.cancel()
            try:
                await self.processing_task
            except asyncio.CancelledError:
                pass
        log.info("Notification manager stopped")
    
    async def _process_alerts(self):
        """Process alert queue"""
        while True:
            try:
                alert = await self.alert_queue.get()
                await self._send_alert(alert)
            except Exception as e:
                log.error(f"Alert processing error: {e}")
                await asyncio.sleep(1)
    
    async def create_alert(
        self,
        alert_type: AlertType,
        title: str,
        message: str,
        priority: AlertPriority = AlertPriority.MEDIUM,
        data: Optional[Dict] = None,
        expires_in_minutes: Optional[int] = None,
        actions: Optional[List[Dict]] = None
    ) -> Alert:
        """Create and queue a new alert"""
        self.alert_counter += 1
        alert_id = f"alert_{self.alert_counter}_{datetime.now().timestamp()}"
        
        expires_at = None
        if expires_in_minutes:
            expires_at = datetime.now() + timedelta(minutes=expires_in_minutes)
        
        alert = Alert(
            id=alert_id,
            type=alert_type,
            priority=priority,
            title=title,
            message=message,
            data=data,
            actions=actions,
            expires_at=expires_at
        )
        
        self.alerts[alert_id] = alert
        await self.alert_queue.put(alert)
        
        return alert
    
    async def _send_alert(self, alert: Alert):
        """Send alert to relevant users"""
        recipients = self._get_recipients(alert)
        
        for user_id in recipients:
            if self._should_send_to_user(user_id, alert):
                try:
                    await self._send_to_user(user_id, alert)
                    alert.sent_to.add(user_id)
                except Exception as e:
                    log.error(f"Failed to send alert to {user_id}: {e}")
    
    def _get_recipients(self, alert: Alert) -> Set[int]:
        """Determine alert recipients"""
        # In production, load from database based on alert type and preferences
        if alert.priority == AlertPriority.CRITICAL:
            return self.subscribers
        
        recipients = set()
        for user_id, prefs in self.user_preferences.items():
            if prefs.enabled and alert.type in prefs.alert_types:
                if alert.priority.value >= prefs.min_priority.value:
                    recipients.add(user_id)
        
        return recipients
    
    def _should_send_to_user(self, user_id: int, alert: Alert) -> bool:
        """Check if alert should be sent to user"""
        prefs = self.user_preferences.get(user_id)
        if not prefs or not prefs.enabled:
            return user_id in self.subscribers  # Default subscribers always get alerts
        
        # Check quiet hours
        if prefs.quiet_hours_start and prefs.quiet_hours_end:
            current_hour = datetime.now().hour
            if prefs.quiet_hours_start <= current_hour < prefs.quiet_hours_end:
                # Only send critical alerts during quiet hours
                if alert.priority != AlertPriority.CRITICAL:
                    return False
        
        # Check if already sent
        if user_id in alert.sent_to:
            return False
        
        # Check expiration
        if alert.expires_at and datetime.now() > alert.expires_at:
            return False
        
        return True
    
    async def _send_to_user(self, user_id: int, alert: Alert):
        """Send alert to specific user"""
        # Format message
        icon = alert.type.value
        priority_icons = {
            AlertPriority.LOW: "",
            AlertPriority.MEDIUM: "❗",
            AlertPriority.HIGH: "‼️",
            AlertPriority.CRITICAL: "🚨"
        }
        priority_icon = priority_icons.get(alert.priority, "")
        
        text = f"{icon} {priority_icon} <b>{alert.title}</b>\n\n{alert.message}"
        
        # Add data if available
        if alert.data:
            text += "\n\n📊 <b>Details:</b>\n"
            for key, value in alert.data.items():
                text += f"• {key}: {value}\n"
        
        # Add timestamp
        text += f"\n<i>🕐 {alert.timestamp.strftime('%H:%M:%S')}</i>"
        
        # Create keyboard with actions
        keyboard = None
        if alert.actions:
            buttons = []
            for action in alert.actions:
                buttons.append(
                    InlineKeyboardButton(
                        text=action.get("text", "Action"),
                        callback_data=f"alert_action:{alert.id}:{action.get('id', 'default')}"
                    )
                )
            
            # Add acknowledge button
            buttons.append(
                InlineKeyboardButton(
                    text="✅ Acknowledge",
                    callback_data=f"alert_ack:{alert.id}"
                )
            )
            
            # Arrange buttons in rows
            keyboard = InlineKeyboardMarkup(
                inline_keyboard=[buttons[i:i+2] for i in range(0, len(buttons), 2)]
            )
        
        # Send message
        await self.bot.send_message(
            user_id,
            text,
            reply_markup=keyboard
        )
    
    async def send_signal_alert(self, signal_data: Any):
        """Send trading signal alert"""
        await self.create_alert(
            alert_type=AlertType.SIGNAL,
            title=f"Trading Signal: {signal_data.symbol}",
            message=f"{signal_data.signal.value[1]} signal detected with {signal_data.confidence*100:.0f}% confidence",
            priority=AlertPriority.HIGH if signal_data.confidence > 0.8 else AlertPriority.MEDIUM,
            data={
                "Symbol": signal_data.symbol,
                "Price": f"${signal_data.price:.2f}",
                "Signal": signal_data.signal.value[1],
                "Confidence": f"{signal_data.confidence*100:.0f}%",
                "Risk": signal_data.risk_level
            },
            actions=[
                {"id": "view", "text": "📊 View Analysis"},
                {"id": "trade", "text": "💰 Open Trade"}
            ]
        )
    
    async def send_risk_alert(self, title: str, data: Dict):
        """Send risk management alert"""
        await self.create_alert(
            alert_type=AlertType.RISK,
            title=title,
            message="Risk threshold exceeded. Review your positions immediately.",
            priority=AlertPriority.HIGH,
            data=data,
            actions=[
                {"id": "positions", "text": "📋 View Positions"},
                {"id": "close_all", "text": "🛑 Close All"}
            ]
        )
    
    async def send_price_alert(self, symbol: str, current_price: float, target_price: float, direction: str):
        """Send price alert"""
        emoji = "📈" if direction == "above" else "📉"
        await self.create_alert(
            alert_type=AlertType.PRICE,
            title=f"Price Alert: {symbol}",
            message=f"{symbol} is now {direction} ${target_price:.2f}",
            priority=AlertPriority.MEDIUM,
            data={
                "Symbol": symbol,
                "Current Price": f"${current_price:.2f}",
                "Target": f"${target_price:.2f}",
                "Direction": direction
            }
        )
    
    async def send_position_alert(self, position_data: Dict):
        """Send position update alert"""
        await self.create_alert(
            alert_type=AlertType.POSITION,
            title="Position Update",
            message=f"Position {position_data.get('action', 'updated')}",
            priority=AlertPriority.MEDIUM,
            data=position_data
        )
    
    async def send_system_alert(self, title: str, message: str, priority: AlertPriority = AlertPriority.MEDIUM):
        """Send system alert"""
        await self.create_alert(
            alert_type=AlertType.SYSTEM,
            title=title,
            message=message,
            priority=priority
        )
    
    def subscribe_user(self, user_id: int, preferences: Optional[UserPreferences] = None):
        """Subscribe user to notifications"""
        self.subscribers.add(user_id)
        
        if preferences:
            self.user_preferences[user_id] = preferences
        elif user_id not in self.user_preferences:
            # Create default preferences
            self.user_preferences[user_id] = UserPreferences(
                user_id=user_id,
                enabled=True,
                alert_types=set(AlertType),
                min_priority=AlertPriority.LOW
            )
        
        log.info(f"User {user_id} subscribed to notifications")
    
    def unsubscribe_user(self, user_id: int):
        """Unsubscribe user from notifications"""
        self.subscribers.discard(user_id)
        if user_id in self.user_preferences:
            self.user_preferences[user_id].enabled = False
        
        log.info(f"User {user_id} unsubscribed from notifications")
    
    def update_preferences(self, user_id: int, preferences: UserPreferences):
        """Update user preferences"""
        self.user_preferences[user_id] = preferences
        log.info(f"Updated preferences for user {user_id}")
    
    def get_user_alerts(self, user_id: int, limit: int = 10) -> List[Alert]:
        """Get recent alerts for user"""
        user_alerts = [
            alert for alert in self.alerts.values()
            if user_id in alert.sent_to
        ]
        
        # Sort by timestamp (newest first)
        user_alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return user_alerts[:limit]
    
    def acknowledge_alert(self, alert_id: str, user_id: int) -> bool:
        """Acknowledge alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].acknowledged_by.add(user_id)
            return True
        return False
    
    def clear_expired_alerts(self):
        """Clear expired alerts"""
        now = datetime.now()
        expired = [
            alert_id for alert_id, alert in self.alerts.items()
            if alert.expires_at and alert.expires_at < now
        ]
        
        for alert_id in expired:
            del self.alerts[alert_id]
        
        if expired:
            log.info(f"Cleared {len(expired)} expired alerts")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get notification statistics"""
        total_sent = sum(len(alert.sent_to) for alert in self.alerts.values())
        total_acked = sum(len(alert.acknowledged_by) for alert in self.alerts.values())
        
        by_type = {}
        by_priority = {}
        
        for alert in self.alerts.values():
            by_type[alert.type.name] = by_type.get(alert.type.name, 0) + 1
            by_priority[alert.priority.name] = by_priority.get(alert.priority.name, 0) + 1
        
        return {
            "total_alerts": len(self.alerts),
            "total_sent": total_sent,
            "total_acknowledged": total_acked,
            "active_subscribers": len(self.subscribers),
            "by_type": by_type,
            "by_priority": by_priority,
            "queue_size": self.alert_queue.qsize()
        }
