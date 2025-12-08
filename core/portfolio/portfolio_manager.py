import asyncio
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
import logging
from core.services.fetch_bybit_klines import fetch_klines

log = logging.getLogger(__name__)

class AllocationStrategy(Enum):
    EQUAL_WEIGHT = "equal"
    MARKET_CAP_WEIGHT = "market_cap"
    RISK_PARITY = "risk_parity"
    MOMENTUM_WEIGHT = "momentum"
    KELLY_CRITERION = "kelly"
    CUSTOM = "custom"

class RebalanceFrequency(Enum):
    HOURLY = timedelta(hours=1)
    DAILY = timedelta(days=1)
    WEEKLY = timedelta(days=7)
    MONTHLY = timedelta(days=30)
    DYNAMIC = None  # Based on market conditions

@dataclass
class Asset:
    """Asset in portfolio"""
    symbol: str
    current_price: float
    quantity: float = 0
    target_allocation: float = 0
    current_allocation: float = 0
    entry_price: float = 0
    pnl: float = 0
    pnl_percent: float = 0
    risk_score: float = 0
    sharpe_ratio: float = 0
    beta: float = 0
    correlation_to_portfolio: float = 0
    last_rebalance: Optional[datetime] = None

@dataclass
class PortfolioMetrics:
    """Portfolio performance metrics"""
    total_value: float
    cash_balance: float
    invested_value: float
    total_pnl: float
    total_pnl_percent: float
    daily_pnl: float
    daily_pnl_percent: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown: float
    current_drawdown: float
    beta: float
    alpha: float
    volatility: float
    var_95: float
    cvar_95: float
    diversification_ratio: float
    concentration_risk: float
    correlation_risk: float

@dataclass
class RebalanceAction:
    """Rebalance action"""
    symbol: str
    action: str  # BUY, SELL, HOLD
    quantity: float
    estimated_price: float
    estimated_value: float
    reason: str
    impact_on_portfolio: float  # Expected impact on portfolio metrics

class PortfolioManager:
    """Advanced portfolio management system"""
    
    def __init__(
        self,
        initial_capital: float = 10000,
        max_positions: int = 10,
        allocation_strategy: AllocationStrategy = AllocationStrategy.RISK_PARITY,
        rebalance_frequency: RebalanceFrequency = RebalanceFrequency.DAILY
    ):
        self.api = None
        self.initial_capital = initial_capital
        self.max_positions = max_positions
        self.allocation_strategy = allocation_strategy
        self.rebalance_frequency = rebalance_frequency
        
        self.portfolio: Dict[str, Asset] = {}
        self.cash_balance = initial_capital
        self.metrics_history: List[PortfolioMetrics] = []
        self.trade_history: List[Dict] = []
        self.last_rebalance = datetime.now()
        self.target_allocations: Dict[str, float] = {}
        
        # Risk parameters
        self.max_position_size = 0.2  # Max 20% in single position
        self.max_sector_exposure = 0.4  # Max 40% in single sector
        self.stop_loss_percent = 0.05  # 5% stop loss
        self.take_profit_percent = 0.15  # 15% take profit
        self.max_correlation = 0.7  # Max correlation between assets
    
    async def initialize_portfolio(self, symbols: List[str]):
        """Initialize portfolio with symbols"""
        for symbol in symbols[:self.max_positions]:
            self.portfolio[symbol] = Asset(
                symbol=symbol,
                current_price=await self._get_current_price(symbol)
            )
        
        await self.calculate_target_allocations()
        log.info(f"Portfolio initialized with {len(self.portfolio)} assets")
    
    async def calculate_target_allocations(self):
        """Calculate target allocations based on strategy"""
        if self.allocation_strategy == AllocationStrategy.EQUAL_WEIGHT:
            self.target_allocations = self._calculate_equal_weight()
        
        elif self.allocation_strategy == AllocationStrategy.RISK_PARITY:
            self.target_allocations = await self._calculate_risk_parity()
        
        elif self.allocation_strategy == AllocationStrategy.MOMENTUM_WEIGHT:
            self.target_allocations = await self._calculate_momentum_weight()
        
        elif self.allocation_strategy == AllocationStrategy.KELLY_CRITERION:
            self.target_allocations = await self._calculate_kelly_allocations()
        
        else:
            self.target_allocations = self._calculate_equal_weight()
        
        # Apply constraints
        self._apply_allocation_constraints()
        
        # Update portfolio
        for symbol, allocation in self.target_allocations.items():
            if symbol in self.portfolio:
                self.portfolio[symbol].target_allocation = allocation
    
    def _calculate_equal_weight(self) -> Dict[str, float]:
        """Equal weight allocation"""
        n = len(self.portfolio)
        if n == 0:
            return {}
        
        weight = 1.0 / n
        return {symbol: weight for symbol in self.portfolio.keys()}
    
    async def _calculate_risk_parity(self) -> Dict[str, float]:
        """Risk parity allocation"""
        allocations = {}
        
        # Get volatilities for each asset
        volatilities = {}
        for symbol in self.portfolio:
            vol = await self._calculate_volatility(symbol)
            volatilities[symbol] = vol
        
        # Inverse volatility weighting (simplified risk parity)
        total_inv_vol = sum(1/v if v > 0 else 0 for v in volatilities.values())
        
        if total_inv_vol == 0:
            return self._calculate_equal_weight()
        
        for symbol, vol in volatilities.items():
            if vol > 0:
                allocations[symbol] = (1/vol) / total_inv_vol
            else:
                allocations[symbol] = 0
        
        return allocations
    
    async def _calculate_momentum_weight(self) -> Dict[str, float]:
        """Momentum-based allocation"""
        allocations = {}
        momentums = {}
        
        # Calculate momentum for each asset
        for symbol in self.portfolio:
            momentum = await self._calculate_momentum(symbol)
            momentums[symbol] = max(0, momentum)  # Only positive momentum
        
        total_momentum = sum(momentums.values())
        
        if total_momentum == 0:
            return self._calculate_equal_weight()
        
        for symbol, momentum in momentums.items():
            allocations[symbol] = momentum / total_momentum
        
        return allocations
    
    async def _calculate_kelly_allocations(self) -> Dict[str, float]:
        """Kelly criterion based allocation"""
        allocations = {}
        
        for symbol in self.portfolio:
            # Get expected return and variance
            expected_return = await self._estimate_expected_return(symbol)
            variance = await self._calculate_variance(symbol)
            
            if variance > 0:
                # Kelly fraction = (expected return - risk free rate) / variance
                risk_free_rate = 0.02 / 365  # Daily risk-free rate
                kelly_fraction = (expected_return - risk_free_rate) / variance
                
                # Apply Kelly fraction cap (typically 25% of full Kelly)
                kelly_fraction = min(max(kelly_fraction * 0.25, 0), 0.25)
                allocations[symbol] = kelly_fraction
            else:
                allocations[symbol] = 0
        
        # Normalize to sum to 1
        total = sum(allocations.values())
        if total > 0:
            for symbol in allocations:
                allocations[symbol] /= total
        else:
            return self._calculate_equal_weight()
        
        return allocations
    
    def _apply_allocation_constraints(self):
        """Apply risk constraints to allocations"""
        # Max position size constraint
        for symbol in self.target_allocations:
            self.target_allocations[symbol] = min(
                self.target_allocations[symbol],
                self.max_position_size
            )
        
        # Normalize after constraints
        total = sum(self.target_allocations.values())
        if total > 0:
            for symbol in self.target_allocations:
                self.target_allocations[symbol] /= total
    
    async def rebalance(self) -> List[RebalanceAction]:
        """Rebalance portfolio"""
        actions = []
        
        # Update current prices and allocations
        await self.update_portfolio_state()
        
        # Check if rebalance is needed
        if not self._should_rebalance():
            log.info("Rebalance not needed")
            return actions
        
        # Calculate rebalance actions
        total_value = self.get_total_value()
        
        for symbol, asset in self.portfolio.items():
            target_value = total_value * asset.target_allocation
            current_value = asset.current_price * asset.quantity
            diff_value = target_value - current_value
            
            # Determine action
            if abs(diff_value) > total_value * 0.01:  # 1% threshold
                if diff_value > 0:
                    # Buy
                    quantity = diff_value / asset.current_price
                    action = RebalanceAction(
                        symbol=symbol,
                        action="BUY",
                        quantity=quantity,
                        estimated_price=asset.current_price,
                        estimated_value=diff_value,
                        reason=f"Rebalance: increase allocation from {asset.current_allocation:.1%} to {asset.target_allocation:.1%}",
                        impact_on_portfolio=self._estimate_rebalance_impact(symbol, quantity)
                    )
                    actions.append(action)
                else:
                    # Sell
                    quantity = abs(diff_value) / asset.current_price
                    action = RebalanceAction(
                        symbol=symbol,
                        action="SELL",
                        quantity=quantity,
                        estimated_price=asset.current_price,
                        estimated_value=abs(diff_value),
                        reason=f"Rebalance: decrease allocation from {asset.current_allocation:.1%} to {asset.target_allocation:.1%}",
                        impact_on_portfolio=self._estimate_rebalance_impact(symbol, -quantity)
                    )
                    actions.append(action)
        
        # Sort actions by priority (sells first to free up capital)
        actions.sort(key=lambda x: x.action == "BUY")
        
        self.last_rebalance = datetime.now()
        log.info(f"Generated {len(actions)} rebalance actions")
        
        return actions
    
    def _should_rebalance(self) -> bool:
        """Check if rebalancing is needed"""
        # Time-based check
        if self.rebalance_frequency != RebalanceFrequency.DYNAMIC:
            if datetime.now() - self.last_rebalance < self.rebalance_frequency.value:
                return False
        
        # Threshold-based check
        for asset in self.portfolio.values():
            if abs(asset.current_allocation - asset.target_allocation) > 0.05:  # 5% deviation
                return True
        
        # Dynamic conditions
        if self.rebalance_frequency == RebalanceFrequency.DYNAMIC:
            # Check market conditions
            if self._detect_high_volatility():
                return True
            if self._detect_trend_change():
                return True
        
        return False
    
    def _detect_high_volatility(self) -> bool:
        """Detect high market volatility"""
        # Implement volatility detection
        recent_metrics = self.metrics_history[-10:] if len(self.metrics_history) >= 10 else self.metrics_history
        if recent_metrics:
            avg_volatility = np.mean([m.volatility for m in recent_metrics])
            current_volatility = recent_metrics[-1].volatility if recent_metrics else 0
            return current_volatility > avg_volatility * 1.5
        return False
    
    def _detect_trend_change(self) -> bool:
        """Detect significant trend change"""
        # Implement trend change detection
        if len(self.metrics_history) < 20:
            return False
        
        recent_returns = [m.daily_pnl_percent for m in self.metrics_history[-20:]]
        first_half = np.mean(recent_returns[:10])
        second_half = np.mean(recent_returns[10:])
        
        # Trend reversal detected
        return (first_half > 0 and second_half < 0) or (first_half < 0 and second_half > 0)
    
    def _estimate_rebalance_impact(self, symbol: str, quantity: float) -> float:
        """Estimate impact of rebalance action on portfolio"""
        # Simplified impact estimation
        asset = self.portfolio.get(symbol)
        if not asset:
            return 0
        
        current_value = self.get_total_value()
        trade_value = quantity * asset.current_price
        
        # Impact as percentage of portfolio
        return abs(trade_value / current_value) * 100
    
    async def execute_rebalance_actions(self, actions: List[RebalanceAction]) -> List[Dict]:
        """Execute rebalance actions"""
        results = []
        
        for action in actions:
            try:
                if action.action == "BUY":
                    order_id = await self.api.place_market_order(
                        action.symbol,
                        "Buy",
                        action.quantity
                    )
                    
                    if order_id:
                        # Update portfolio
                        self.portfolio[action.symbol].quantity += action.quantity
                        self.cash_balance -= action.estimated_value
                        
                        result = {
                            "success": True,
                            "action": action,
                            "order_id": order_id
                        }
                    else:
                        result = {
                            "success": False,
                            "action": action,
                            "error": "Order failed"
                        }
                
                elif action.action == "SELL":
                    order_id = await self.api.place_market_order(
                        action.symbol,
                        "Sell",
                        action.quantity
                    )
                    
                    if order_id:
                        # Update portfolio
                        self.portfolio[action.symbol].quantity -= action.quantity
                        self.cash_balance += action.estimated_value
                        
                        result = {
                            "success": True,
                            "action": action,
                            "order_id": order_id
                        }
                    else:
                        result = {
                            "success": False,
                            "action": action,
                            "error": "Order failed"
                        }
                
                results.append(result)
                
                # Add to trade history
                self.trade_history.append({
                    "timestamp": datetime.now(),
                    "symbol": action.symbol,
                    "action": action.action,
                    "quantity": action.quantity,
                    "price": action.estimated_price,
                    "value": action.estimated_value,
                    "reason": action.reason
                })
                
            except Exception as e:
                log.error(f"Failed to execute {action.action} for {action.symbol}: {e}")
                results.append({
                    "success": False,
                    "action": action,
                    "error": str(e)
                })
        
        return results
    
    async def update_portfolio_state(self):
        """Update portfolio with current market data"""
        total_value = 0
        
        for symbol, asset in self.portfolio.items():
            # Update current price
            asset.current_price = await self._get_current_price(symbol)
            
            # Calculate current value
            current_value = asset.quantity * asset.current_price
            total_value += current_value
            
            # Update P&L
            if asset.quantity > 0:
                asset.pnl = (asset.current_price - asset.entry_price) * asset.quantity
                asset.pnl_percent = ((asset.current_price / asset.entry_price) - 1) * 100
        
        # Update allocations
        total_value += self.cash_balance
        for asset in self.portfolio.values():
            asset.current_allocation = (asset.quantity * asset.current_price) / total_value if total_value > 0 else 0
    
    async def calculate_metrics(self) -> PortfolioMetrics:
        """Calculate comprehensive portfolio metrics"""
        await self.update_portfolio_state()
        
        total_value = self.get_total_value()
        invested_value = total_value - self.cash_balance
        
        # Calculate P&L
        total_pnl = total_value - self.initial_capital
        total_pnl_percent = (total_pnl / self.initial_capital) * 100
        
        # Daily P&L (from history)
        daily_pnl = 0
        daily_pnl_percent = 0
        if self.metrics_history:
            yesterday_value = self.metrics_history[-1].total_value
            daily_pnl = total_value - yesterday_value
            daily_pnl_percent = (daily_pnl / yesterday_value) * 100 if yesterday_value > 0 else 0
        
        # Risk metrics
        returns = self._get_historical_returns()
        
        sharpe_ratio = self._calculate_sharpe_ratio(returns)
        sortino_ratio = self._calculate_sortino_ratio(returns)
        calmar_ratio = self._calculate_calmar_ratio(returns)
        
        max_drawdown = self._calculate_max_drawdown()
        current_drawdown = self._calculate_current_drawdown()
        
        volatility = np.std(returns) * np.sqrt(365) * 100 if returns else 0
        var_95 = self._calculate_var(returns, 0.95) * total_value
        cvar_95 = self._calculate_cvar(returns, 0.95) * total_value
        
        # Portfolio composition metrics
        diversification_ratio = self._calculate_diversification_ratio()
        concentration_risk = self._calculate_concentration_risk()
        correlation_risk = await self._calculate_correlation_risk()
        
        # Market correlation
        beta, alpha = await self._calculate_beta_alpha(returns)
        
        metrics = PortfolioMetrics(
            total_value=total_value,
            cash_balance=self.cash_balance,
            invested_value=invested_value,
            total_pnl=total_pnl,
            total_pnl_percent=total_pnl_percent,
            daily_pnl=daily_pnl,
            daily_pnl_percent=daily_pnl_percent,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            max_drawdown=max_drawdown,
            current_drawdown=current_drawdown,
            beta=beta,
            alpha=alpha,
            volatility=volatility,
            var_95=var_95,
            cvar_95=cvar_95,
            diversification_ratio=diversification_ratio,
            concentration_risk=concentration_risk,
            correlation_risk=correlation_risk
        )
        
        self.metrics_history.append(metrics)
        
        return metrics
    
    def get_total_value(self) -> float:
        """Get total portfolio value"""
        value = self.cash_balance
        for asset in self.portfolio.values():
            value += asset.quantity * asset.current_price
        return value
    
    def _get_historical_returns(self) -> List[float]:
        """Get historical returns from metrics history"""
        if len(self.metrics_history) < 2:
            return []
        
        returns = []
        for i in range(1, len(self.metrics_history)):
            prev_value = self.metrics_history[i-1].total_value
            curr_value = self.metrics_history[i].total_value
            if prev_value > 0:
                returns.append((curr_value - prev_value) / prev_value)
        
        return returns
    
    def _calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio"""
        if not returns or len(returns) < 2:
            return 0
        
        excess_returns = [r - risk_free_rate/365 for r in returns]
        if np.std(excess_returns) == 0:
            return 0
        
        return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(365)
    
    def _calculate_sortino_ratio(self, returns: List[float], target_return: float = 0) -> float:
        """Calculate Sortino ratio"""
        if not returns:
            return 0
        
        excess_returns = [r - target_return for r in returns]
        downside_returns = [r for r in excess_returns if r < 0]
        
        if not downside_returns:
            return float('inf') if np.mean(excess_returns) > 0 else 0
        
        downside_deviation = np.std(downside_returns)
        
        if downside_deviation == 0:
            return 0
        
        return np.mean(excess_returns) / downside_deviation * np.sqrt(365)
    
    def _calculate_calmar_ratio(self, returns: List[float]) -> float:
        """Calculate Calmar ratio"""
        if not returns:
            return 0
        
        annual_return = np.mean(returns) * 365
        max_dd = self._calculate_max_drawdown()
        
        if max_dd == 0:
            return 0
        
        return annual_return / abs(max_dd)
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate maximum drawdown"""
        if not self.metrics_history:
            return 0
        
        values = [m.total_value for m in self.metrics_history]
        peak = values[0]
        max_dd = 0
        
        for value in values:
            if value > peak:
                peak = value
            drawdown = (value - peak) / peak if peak > 0 else 0
            if drawdown < max_dd:
                max_dd = drawdown
        
        return max_dd * 100
    
    def _calculate_current_drawdown(self) -> float:
        """Calculate current drawdown from peak"""
        if not self.metrics_history:
            return 0
        
        values = [m.total_value for m in self.metrics_history]
        peak = max(values)
        current = values[-1]
        
        if peak > 0:
            return ((current - peak) / peak) * 100
        return 0
    
    def _calculate_var(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Value at Risk"""
        if not returns:
            return 0
        
        return np.percentile(returns, (1 - confidence) * 100)
    
    def _calculate_cvar(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Conditional Value at Risk"""
        if not returns:
            return 0
        
        var = self._calculate_var(returns, confidence)
        conditional_returns = [r for r in returns if r <= var]
        
        return np.mean(conditional_returns) if conditional_returns else var
    
    def _calculate_diversification_ratio(self) -> float:
        """Calculate portfolio diversification ratio"""
        n = len(self.portfolio)
        if n <= 1:
            return 1.0
        
        # Herfindahl index
        herfindahl = sum(asset.current_allocation ** 2 for asset in self.portfolio.values())
        
        # Diversification ratio (1 = perfectly diversified)
        return (1 - herfindahl) * (n / (n - 1)) if n > 1 else 0
    
    def _calculate_concentration_risk(self) -> float:
        """Calculate concentration risk"""
        if not self.portfolio:
            return 0
        
        # Max allocation
        max_allocation = max(asset.current_allocation for asset in self.portfolio.values())
        
        # Concentration risk (0 = no concentration, 1 = fully concentrated)
        return max_allocation
    
    async def _calculate_correlation_risk(self) -> float:
        """Calculate correlation risk"""
        if len(self.portfolio) < 2:
            return 0
        
        # Get price histories
        prices = {}
        for symbol in self.portfolio:
            prices[symbol] = await self._get_price_history(symbol)
        
        # Calculate correlations
        correlations = []
        symbols = list(self.portfolio.keys())
        
        for i in range(len(symbols)):
            for j in range(i + 1, len(symbols)):
                if symbols[i] in prices and symbols[j] in prices:
                    corr = np.corrcoef(prices[symbols[i]], prices[symbols[j]])[0, 1]
                    correlations.append(abs(corr))
        
        # Average correlation as risk metric
        return np.mean(correlations) if correlations else 0
    
    async def _calculate_beta_alpha(self, returns: List[float]) -> Tuple[float, float]:
        """Calculate portfolio beta and alpha"""
        if not returns:
            return 1.0, 0.0
        
        # Use BTC as market proxy
        market_returns = await self._get_market_returns("BTCUSDT")
        
        if not market_returns or len(market_returns) != len(returns):
            return 1.0, 0.0
        
        # Calculate beta
        covariance = np.cov(returns, market_returns)[0, 1]
        market_variance = np.var(market_returns)
        
        beta = covariance / market_variance if market_variance > 0 else 1.0
        
        # Calculate alpha
        risk_free_rate = 0.02 / 365
        portfolio_return = np.mean(returns)
        market_return = np.mean(market_returns)
        
        expected_return = risk_free_rate + beta * (market_return - risk_free_rate)
        alpha = (portfolio_return - expected_return) * 365
        
        return beta, alpha
    
    async def _get_current_price(self, symbol: str) -> float:
        """Get current price for symbol"""
        try:
            klines = await self.api.get_kline(symbol, "1", 1)
            if klines:
                return float(klines[0][4])  # Close price
        except Exception as e:
            log.error(f"Failed to get price for {symbol}: {e}")
        return 0
    
    async def _get_price_history(self, symbol: str, periods: int = 100) -> List[float]:
        """Get price history for symbol"""
        try:
            klines = await self.api.get_kline(symbol, "15", periods)
            if klines:
                return [float(k[4]) for k in klines]
        except Exception as e:
            log.error(f"Failed to get price history for {symbol}: {e}")
        return []
    
    async def _get_market_returns(self, symbol: str) -> List[float]:
        """Get market returns for benchmark"""
        prices = await self._get_price_history(symbol)
        if len(prices) < 2:
            return []
        
        returns = []
        for i in range(1, len(prices)):
            returns.append((prices[i] - prices[i-1]) / prices[i-1])
        
        return returns
    
    async def _calculate_volatility(self, symbol: str) -> float:
        """Calculate asset volatility"""
        prices = await self._get_price_history(symbol)
        if len(prices) < 2:
            return 0
        
        returns = []
        for i in range(1, len(prices)):
            returns.append((prices[i] - prices[i-1]) / prices[i-1])
        
        return np.std(returns) * np.sqrt(365 * 96)  # Annualized
    
    async def _calculate_variance(self, symbol: str) -> float:
        """Calculate asset variance"""
        prices = await self._get_price_history(symbol)
        if len(prices) < 2:
            return 0
        
        returns = []
        for i in range(1, len(prices)):
            returns.append((prices[i] - prices[i-1]) / prices[i-1])
        
        return np.var(returns)
    
    async def _calculate_momentum(self, symbol: str, periods: int = 20) -> float:
        """Calculate asset momentum"""
        prices = await self._get_price_history(symbol, periods)
        if len(prices) < 2:
            return 0
        
        return (prices[-1] - prices[0]) / prices[0] * 100
    
    async def _estimate_expected_return(self, symbol: str) -> float:
        """Estimate expected return for asset"""
        # Simple historical average
        prices = await self._get_price_history(symbol, 100)
        if len(prices) < 2:
            return 0
        
        returns = []
        for i in range(1, len(prices)):
            returns.append((prices[i] - prices[i-1]) / prices[i-1])
        
        return np.mean(returns)
    
    def get_portfolio_summary(self) -> str:
        """Get portfolio summary"""
        metrics = self.metrics_history[-1] if self.metrics_history else None
        
        summary = f"""
📊 <b>Portfolio Summary</b>
{'=' * 30}

<b>💰 Value</b>
• Total: ${self.get_total_value():.2f}
• Cash: ${self.cash_balance:.2f}
• Invested: ${self.get_total_value() - self.cash_balance:.2f}

<b>📈 Performance</b>
• Total P&L: ${metrics.total_pnl:.2f} ({metrics.total_pnl_percent:+.1f}%)
• Daily P&L: ${metrics.daily_pnl:.2f} ({metrics.daily_pnl_percent:+.1f}%)
• Sharpe Ratio: {metrics.sharpe_ratio:.2f}
• Max Drawdown: {metrics.max_drawdown:.1f}%

<b>⚠️ Risk Metrics</b>
• VaR (95%): ${metrics.var_95:.2f}
• Beta: {metrics.beta:.2f}
• Volatility: {metrics.volatility:.1f}%
• Concentration: {metrics.concentration_risk:.1%}

<b>📋 Holdings</b>
""" if metrics else "No metrics available yet"
        
        for symbol, asset in self.portfolio.items():
            if asset.quantity > 0:
                summary += f"• {symbol}: {asset.quantity:.3f} @ ${asset.current_price:.2f} ({asset.current_allocation:.1%})\n"
        
        return summary
