"""
Risk Management Module for CryptoBot Pro
Handles global risk limits, position limits, and safety checks
"""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

log = logging.getLogger(__name__)


class RiskStatus(Enum):
    """Risk status levels"""
    SAFE = "safe"
    WARNING = "warning"
    LIMIT_REACHED = "limit_reached"
    CRITICAL = "critical"


@dataclass
class RiskLimits:
    """Global risk limits configuration"""
    max_open_positions: int = 5
    max_drawdown_percent: float = 20.0
    daily_loss_limit_percent: float = 5.0
    default_stop_loss_percent: float = 2.0
    max_position_size_percent: float = 20.0  # Max % of capital per position


@dataclass
class RiskState:
    """Current risk state"""
    open_positions: int = 0
    current_drawdown: float = 0.0
    daily_loss: float = 0.0
    daily_loss_percent: float = 0.0
    initial_capital: float = 10000.0
    current_capital: float = 10000.0
    peak_capital: float = 10000.0
    last_reset_date: datetime = field(default_factory=datetime.now)
    status: RiskStatus = RiskStatus.SAFE
    is_trading_paused: bool = False
    pause_reason: Optional[str] = None


class RiskManager:
    """
    Global Risk Manager
    Monitors and enforces risk limits across all trading activities
    """
    
    def __init__(self, limits: Optional[RiskLimits] = None):
        """
        Initialize Risk Manager
        
        Args:
            limits: Risk limits configuration (uses defaults if None)
        """
        self.limits = limits or RiskLimits()
        self.state = RiskState()
        self.state.initial_capital = self.limits.max_open_positions * 2000  # Estimate
        self.state.current_capital = self.state.initial_capital
        self.state.peak_capital = self.state.initial_capital
        
        log.info(f"Risk Manager initialized with limits: {self.limits}")
    
    def check_can_open_position(self) -> tuple[bool, Optional[str]]:
        """
        Check if a new position can be opened
        
        Returns:
            Tuple of (can_open, reason_if_not)
        """
        # Check if trading is paused
        if self.state.is_trading_paused:
            return False, f"Trading is paused: {self.state.pause_reason}"
        
        # Check max open positions
        if self.state.open_positions >= self.limits.max_open_positions:
            return False, f"Maximum open positions ({self.limits.max_open_positions}) reached"
        
        # Check drawdown limit
        if self.state.current_drawdown >= self.limits.max_drawdown_percent:
            self._pause_trading("Max drawdown limit reached")
            return False, f"Maximum drawdown ({self.limits.max_drawdown_percent}%) exceeded"
        
        # Check daily loss limit
        if self.state.daily_loss_percent >= self.limits.daily_loss_limit_percent:
            self._pause_trading("Daily loss limit reached")
            return False, f"Daily loss limit ({self.limits.daily_loss_limit_percent}%) exceeded"
        
        return True, None
    
    def validate_stop_loss(self, entry_price: float, stop_loss: Optional[float], 
                          direction: str = "long") -> tuple[bool, float, Optional[str]]:
        """
        Validate and ensure stop loss exists
        
        Args:
            entry_price: Entry price for the trade
            stop_loss: Proposed stop loss (None if not provided)
            direction: Trade direction ("long" or "short")
            
        Returns:
            Tuple of (is_valid, final_stop_loss, reason_if_invalid)
        """
        if stop_loss is None or stop_loss <= 0:
            # Calculate default stop loss
            if direction == "long":
                stop_loss = entry_price * (1 - self.limits.default_stop_loss_percent / 100)
            else:
                stop_loss = entry_price * (1 + self.limits.default_stop_loss_percent / 100)
            
            log.warning(f"No stop loss provided, using default: {stop_loss:.2f}")
        
        # Validate stop loss distance
        if direction == "long":
            if stop_loss >= entry_price:
                return False, stop_loss, "Stop loss must be below entry price for long positions"
            sl_percent = ((entry_price - stop_loss) / entry_price) * 100
        else:
            if stop_loss <= entry_price:
                return False, stop_loss, "Stop loss must be above entry price for short positions"
            sl_percent = ((stop_loss - entry_price) / entry_price) * 100
        
        # Check if stop loss is too tight (less than 0.5%) or too wide (more than 10%)
        if sl_percent < 0.5:
            return False, stop_loss, "Stop loss is too tight (less than 0.5%)"
        if sl_percent > 10:
            return False, stop_loss, "Stop loss is too wide (more than 10%)"
        
        return True, stop_loss, None
    
    def update_position_count(self, delta: int):
        """Update open positions count"""
        self.state.open_positions = max(0, self.state.open_positions + delta)
        log.debug(f"Open positions updated: {self.state.open_positions}")
    
    def update_capital(self, new_capital: float):
        """Update current capital and recalculate metrics"""
        self.state.current_capital = new_capital
        
        # Update peak capital
        if new_capital > self.state.peak_capital:
            self.state.peak_capital = new_capital
        
        # Calculate drawdown
        if self.state.peak_capital > 0:
            self.state.current_drawdown = (
                (self.state.peak_capital - new_capital) / self.state.peak_capital * 100
            )
        else:
            self.state.current_drawdown = 0.0
        
        # Calculate daily loss
        self._update_daily_loss()
        
        # Update status
        self._update_risk_status()
        
        log.debug(f"Capital updated: ${new_capital:.2f}, Drawdown: {self.state.current_drawdown:.2f}%")
    
    def _update_daily_loss(self):
        """Update daily loss tracking"""
        # Reset daily loss if it's a new day
        if datetime.now().date() > self.state.last_reset_date.date():
            self.state.daily_loss = 0.0
            self.state.daily_loss_percent = 0.0
            self.state.last_reset_date = datetime.now()
            log.info("Daily loss counter reset")
        
        # Calculate daily loss
        if self.state.initial_capital > 0:
            daily_pnl = self.state.current_capital - self.state.initial_capital
            self.state.daily_loss = min(0, daily_pnl)  # Only negative values
            self.state.daily_loss_percent = abs(self.state.daily_loss / self.state.initial_capital * 100)
    
    def _update_risk_status(self):
        """Update risk status based on current state"""
        if self.state.current_drawdown >= self.limits.max_drawdown_percent:
            self.state.status = RiskStatus.CRITICAL
        elif self.state.daily_loss_percent >= self.limits.daily_loss_limit_percent:
            self.state.status = RiskStatus.CRITICAL
        elif self.state.current_drawdown >= self.limits.max_drawdown_percent * 0.8:
            self.state.status = RiskStatus.WARNING
        elif self.state.daily_loss_percent >= self.limits.daily_loss_limit_percent * 0.8:
            self.state.status = RiskStatus.WARNING
        else:
            self.state.status = RiskStatus.SAFE
    
    def _pause_trading(self, reason: str):
        """Pause trading due to risk limit"""
        if not self.state.is_trading_paused:
            self.state.is_trading_paused = True
            self.state.pause_reason = reason
            log.warning(f"Trading paused: {reason}")
            # Could send notification here
    
    def resume_trading(self):
        """Resume trading (manual override)"""
        self.state.is_trading_paused = False
        self.state.pause_reason = None
        log.info("Trading resumed")
    
    def get_risk_status(self) -> Dict[str, Any]:
        """Get current risk status as dictionary"""
        return {
            "status": self.state.status.value,
            "open_positions": self.state.open_positions,
            "max_positions": self.limits.max_open_positions,
            "current_drawdown": round(self.state.current_drawdown, 2),
            "max_drawdown": self.limits.max_drawdown_percent,
            "daily_loss_percent": round(self.state.daily_loss_percent, 2),
            "daily_loss_limit": self.limits.daily_loss_limit_percent,
            "current_capital": round(self.state.current_capital, 2),
            "peak_capital": round(self.state.peak_capital, 2),
            "is_trading_paused": self.state.is_trading_paused,
            "pause_reason": self.state.pause_reason
        }
    
    def update_limits(self, limits: RiskLimits):
        """Update risk limits"""
        self.limits = limits
        log.info(f"Risk limits updated: {limits}")
    
    def reset_daily_counters(self):
        """Reset daily loss counters (manual)"""
        self.state.daily_loss = 0.0
        self.state.daily_loss_percent = 0.0
        self.state.last_reset_date = datetime.now()
        log.info("Daily counters reset manually")

