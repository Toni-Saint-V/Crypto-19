import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
import json
from bot.core.logger import get_logger
from bot.trading.bybit_v5 import BybitV5

log = get_logger("analytics")

class TimeFrame(Enum):
    HOUR_1 = "1h"
    HOUR_4 = "4h"
    HOUR_24 = "24h"
    DAY_7 = "7d"
    DAY_30 = "30d"
    ALL_TIME = "all"

@dataclass
class TradeMetrics:
    """Trade performance metrics"""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    total_profit: float = 0.0
    total_loss: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    average_win: float = 0.0
    average_loss: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    recovery_factor: float = 0.0
    avg_trade_duration: timedelta = timedelta()
    best_pair: Optional[str] = None
    worst_pair: Optional[str] = None

@dataclass
class MarketMetrics:
    """Market analysis metrics"""
    volatility: float = 0.0
    trend_strength: float = 0.0
    correlation_matrix: Dict[str, Dict[str, float]] = field(default_factory=dict)
    volume_profile: Dict[str, float] = field(default_factory=dict)
    liquidity_score: float = 0.0
    market_efficiency: float = 0.0

@dataclass
class RiskMetrics:
    """Risk management metrics"""
    var_95: float = 0.0  # Value at Risk 95%
    cvar_95: float = 0.0  # Conditional VaR
    beta: float = 0.0
    alpha: float = 0.0
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    max_exposure: float = 0.0
    risk_adjusted_return: float = 0.0

class AnalyticsEngine:
    """Advanced analytics and reporting engine"""
    
    def __init__(self):
        self.api = BybitV5()
        self.trade_history: List[Dict] = []
        self.price_history: Dict[str, List[Dict]] = {}
        self.metrics_cache: Dict[str, Any] = {}
        self.last_update: Optional[datetime] = None
        
    async def calculate_trade_metrics(
        self,
        timeframe: TimeFrame = TimeFrame.DAY_7
    ) -> TradeMetrics:
        """Calculate comprehensive trade metrics"""
        try:
            # Get trade history (mock for now, integrate with real DB)
            trades = await self._get_trade_history(timeframe)
            
            if not trades:
                return TradeMetrics()
            
            metrics = TradeMetrics()
            metrics.total_trades = len(trades)
            
            profits = []
            losses = []
            durations = []
            
            for trade in trades:
                pnl = trade.get("pnl", 0)
                if pnl > 0:
                    metrics.winning_trades += 1
                    profits.append(pnl)
                elif pnl < 0:
                    metrics.losing_trades += 1
                    losses.append(abs(pnl))
                
                # Trade duration
                if "entry_time" in trade and "exit_time" in trade:
                    duration = trade["exit_time"] - trade["entry_time"]
                    durations.append(duration)
            
            # Calculate aggregates
            if profits:
                metrics.total_profit = sum(profits)
                metrics.average_win = np.mean(profits)
                metrics.largest_win = max(profits)
            
            if losses:
                metrics.total_loss = sum(losses)
                metrics.average_loss = np.mean(losses)
                metrics.largest_loss = max(losses)
            
            # Win rate
            if metrics.total_trades > 0:
                metrics.win_rate = metrics.winning_trades / metrics.total_trades * 100
            
            # Profit factor
            if metrics.total_loss > 0:
                metrics.profit_factor = metrics.total_profit / metrics.total_loss
            
            # Sharpe ratio (simplified)
            if trades:
                returns = [t.get("pnl", 0) / t.get("investment", 1) for t in trades]
                if len(returns) > 1:
                    metrics.sharpe_ratio = self._calculate_sharpe_ratio(returns)
            
            # Max drawdown
            metrics.max_drawdown = self._calculate_max_drawdown(trades)
            
            # Recovery factor
            if metrics.max_drawdown != 0:
                net_profit = metrics.total_profit - metrics.total_loss
                metrics.recovery_factor = net_profit / abs(metrics.max_drawdown)
            
            # Average trade duration
            if durations:
                avg_seconds = np.mean([d.total_seconds() for d in durations])
                metrics.avg_trade_duration = timedelta(seconds=avg_seconds)
            
            # Best and worst performing pairs
            pair_performance = {}
            for trade in trades:
                pair = trade.get("symbol", "UNKNOWN")
                if pair not in pair_performance:
                    pair_performance[pair] = 0
                pair_performance[pair] += trade.get("pnl", 0)
            
            if pair_performance:
                metrics.best_pair = max(pair_performance.items(), key=lambda x: x[1])[0]
                metrics.worst_pair = min(pair_performance.items(), key=lambda x: x[1])[0]
            
            return metrics
            
        except Exception as e:
            log.error(f"Trade metrics calculation error: {e}")
            return TradeMetrics()
    
    async def calculate_market_metrics(
        self,
        symbols: List[str] = None
    ) -> MarketMetrics:
        """Calculate market analysis metrics"""
        if symbols is None:
            symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
        
        metrics = MarketMetrics()
        
        try:
            # Volatility calculation
            volatilities = []
            for symbol in symbols:
                vol = await self._calculate_volatility(symbol)
                volatilities.append(vol)
            
            metrics.volatility = np.mean(volatilities)
            
            # Trend strength
            trends = []
            for symbol in symbols:
                trend = await self._calculate_trend_strength(symbol)
                trends.append(trend)
            
            metrics.trend_strength = np.mean(trends)
            
            # Correlation matrix
            metrics.correlation_matrix = await self._calculate_correlations(symbols)
            
            # Volume profile
            for symbol in symbols:
                volume = await self._get_volume_profile(symbol)
                metrics.volume_profile[symbol] = volume
            
            # Market efficiency (simplified Hurst exponent)
            metrics.market_efficiency = await self._calculate_market_efficiency(symbols[0])
            
            # Liquidity score
            metrics.liquidity_score = await self._calculate_liquidity_score(symbols)
            
            return metrics
            
        except Exception as e:
            log.error(f"Market metrics calculation error: {e}")
            return metrics
    
    async def calculate_risk_metrics(
        self,
        portfolio_value: float = 10000
    ) -> RiskMetrics:
        """Calculate risk management metrics"""
        metrics = RiskMetrics()
        
        try:
            # Get historical returns
            returns = await self._get_portfolio_returns()
            
            if not returns or len(returns) < 2:
                return metrics
            
            # Value at Risk (VaR) at 95% confidence
            metrics.var_95 = self._calculate_var(returns, 0.95) * portfolio_value
            
            # Conditional VaR (CVaR)
            metrics.cvar_95 = self._calculate_cvar(returns, 0.95) * portfolio_value
            
            # Beta (relative to BTC as market)
            market_returns = await self._get_market_returns("BTCUSDT")
            if market_returns and len(market_returns) == len(returns):
                metrics.beta = self._calculate_beta(returns, market_returns)
                
                # Alpha
                risk_free_rate = 0.02 / 365  # Daily risk-free rate
                metrics.alpha = self._calculate_alpha(
                    returns, market_returns, metrics.beta, risk_free_rate
                )
            
            # Sortino ratio
            metrics.sortino_ratio = self._calculate_sortino_ratio(returns)
            
            # Calmar ratio
            annual_return = np.mean(returns) * 365
            max_dd = self._calculate_max_drawdown_from_returns(returns)
            if max_dd != 0:
                metrics.calmar_ratio = annual_return / abs(max_dd)
            
            # Max exposure
            metrics.max_exposure = await self._calculate_max_exposure()
            
            # Risk-adjusted return
            if np.std(returns) > 0:
                metrics.risk_adjusted_return = np.mean(returns) / np.std(returns)
            
            return metrics
            
        except Exception as e:
            log.error(f"Risk metrics calculation error: {e}")
            return metrics
    
    def _calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio"""
        if not returns or len(returns) < 2:
            return 0.0
        
        excess_returns = [r - risk_free_rate/365 for r in returns]
        if np.std(excess_returns) == 0:
            return 0.0
        
        return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(365)
    
    def _calculate_max_drawdown(self, trades: List[Dict]) -> float:
        """Calculate maximum drawdown"""
        if not trades:
            return 0.0
        
        cumulative = 0
        peak = 0
        max_dd = 0
        
        for trade in trades:
            cumulative += trade.get("pnl", 0)
            if cumulative > peak:
                peak = cumulative
            drawdown = (cumulative - peak) / peak if peak > 0 else 0
            if drawdown < max_dd:
                max_dd = drawdown
        
        return max_dd * 100  # Return as percentage
    
    def _calculate_max_drawdown_from_returns(self, returns: List[float]) -> float:
        """Calculate maximum drawdown from returns"""
        if not returns:
            return 0.0
        
        cumulative = np.cumprod(1 + np.array(returns))
        running_max = np.maximum.accumulate(cumulative)
        drawdown = (cumulative - running_max) / running_max
        
        return np.min(drawdown)
    
    async def _calculate_volatility(self, symbol: str, periods: int = 20) -> float:
        """Calculate volatility for a symbol"""
        try:
            klines = await self.api.get_kline(symbol, "15", periods)
            if not klines or len(klines) < 2:
                return 0.0
            
            closes = [float(k[4]) for k in klines]
            returns = np.diff(closes) / closes[:-1]
            
            return np.std(returns) * np.sqrt(96) * 100  # Annualized volatility
            
        except Exception as e:
            log.error(f"Volatility calculation error for {symbol}: {e}")
            return 0.0
    
    async def _calculate_trend_strength(self, symbol: str) -> float:
        """Calculate trend strength using ADX-like indicator"""
        try:
            klines = await self.api.get_kline(symbol, "15", 50)
            if not klines or len(klines) < 14:
                return 0.0
            
            highs = np.array([float(k[2]) for k in klines])
            lows = np.array([float(k[3]) for k in klines])
            closes = np.array([float(k[4]) for k in klines])
            
            # Simple trend strength: ratio of directional movement
            plus_dm = np.diff(highs)
            minus_dm = -np.diff(lows)
            
            plus_dm[plus_dm < 0] = 0
            minus_dm[minus_dm < 0] = 0
            
            atr = np.mean(np.maximum(
                highs[1:] - lows[1:],
                np.abs(highs[1:] - closes[:-1]),
                np.abs(lows[1:] - closes[:-1])
            ))
            
            if atr == 0:
                return 0.0
            
            plus_di = np.mean(plus_dm) / atr * 100
            minus_di = np.mean(minus_dm) / atr * 100
            
            if plus_di + minus_di == 0:
                return 0.0
            
            dx = abs(plus_di - minus_di) / (plus_di + minus_di) * 100
            
            return min(dx, 100)  # Return as 0-100 scale
            
        except Exception as e:
            log.error(f"Trend strength calculation error for {symbol}: {e}")
            return 0.0
    
    async def _calculate_correlations(self, symbols: List[str]) -> Dict[str, Dict[str, float]]:
        """Calculate correlation matrix between symbols"""
        correlations = {}
        
        try:
            # Get price data for all symbols
            price_data = {}
            for symbol in symbols:
                klines = await self.api.get_kline(symbol, "15", 100)
                if klines:
                    price_data[symbol] = [float(k[4]) for k in klines]
            
            # Calculate correlations
            for sym1 in symbols:
                correlations[sym1] = {}
                for sym2 in symbols:
                    if sym1 == sym2:
                        correlations[sym1][sym2] = 1.0
                    elif sym1 in price_data and sym2 in price_data:
                        # Ensure same length
                        min_len = min(len(price_data[sym1]), len(price_data[sym2]))
                        if min_len > 1:
                            corr = np.corrcoef(
                                price_data[sym1][:min_len],
                                price_data[sym2][:min_len]
                            )[0, 1]
                            correlations[sym1][sym2] = round(corr, 3)
                        else:
                            correlations[sym1][sym2] = 0.0
                    else:
                        correlations[sym1][sym2] = 0.0
            
        except Exception as e:
            log.error(f"Correlation calculation error: {e}")
        
        return correlations
    
    async def _get_volume_profile(self, symbol: str) -> float:
        """Get average volume for symbol"""
        try:
            klines = await self.api.get_kline(symbol, "15", 24)
            if not klines:
                return 0.0
            
            volumes = [float(k[5]) for k in klines]
            return np.mean(volumes)
            
        except Exception as e:
            log.error(f"Volume profile error for {symbol}: {e}")
            return 0.0
    
    async def _calculate_market_efficiency(self, symbol: str) -> float:
        """Calculate market efficiency (0-100, higher = more efficient)"""
        try:
            klines = await self.api.get_kline(symbol, "15", 100)
            if not klines or len(klines) < 10:
                return 50.0
            
            closes = [float(k[4]) for k in klines]
            
            # Calculate autocorrelation
            returns = np.diff(closes) / closes[:-1]
            if len(returns) > 1:
                autocorr = np.corrcoef(returns[:-1], returns[1:])[0, 1]
                # Convert to efficiency score (low autocorrelation = high efficiency)
                efficiency = (1 - abs(autocorr)) * 100
                return min(max(efficiency, 0), 100)
            
            return 50.0
            
        except Exception as e:
            log.error(f"Market efficiency calculation error: {e}")
            return 50.0
    
    async def _calculate_liquidity_score(self, symbols: List[str]) -> float:
        """Calculate overall liquidity score"""
        try:
            scores = []
            for symbol in symbols:
                klines = await self.api.get_kline(symbol, "15", 24)
                if klines:
                    # Simple liquidity proxy: volume * (1 - spread/price)
                    volumes = [float(k[5]) for k in klines]
                    highs = [float(k[2]) for k in klines]
                    lows = [float(k[3]) for k in klines]
                    
                    avg_volume = np.mean(volumes)
                    avg_spread = np.mean([(h - l) / l for h, l in zip(highs, lows)])
                    
                    # Normalize to 0-100 scale
                    liquidity = min(avg_volume / 1000000 * (1 - avg_spread), 100)
                    scores.append(liquidity)
            
            return np.mean(scores) if scores else 0.0
            
        except Exception as e:
            log.error(f"Liquidity score calculation error: {e}")
            return 0.0
    
    def _calculate_var(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Value at Risk"""
        if not returns:
            return 0.0
        
        return np.percentile(returns, (1 - confidence) * 100)
    
    def _calculate_cvar(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Conditional Value at Risk"""
        if not returns:
            return 0.0
        
        var = self._calculate_var(returns, confidence)
        conditional_returns = [r for r in returns if r <= var]
        
        return np.mean(conditional_returns) if conditional_returns else var
    
    def _calculate_beta(self, asset_returns: List[float], market_returns: List[float]) -> float:
        """Calculate beta coefficient"""
        if not asset_returns or not market_returns:
            return 1.0
        
        covariance = np.cov(asset_returns, market_returns)[0, 1]
        market_variance = np.var(market_returns)
        
        if market_variance == 0:
            return 1.0
        
        return covariance / market_variance
    
    def _calculate_alpha(
        self,
        asset_returns: List[float],
        market_returns: List[float],
        beta: float,
        risk_free_rate: float
    ) -> float:
        """Calculate alpha (Jensen's alpha)"""
        if not asset_returns or not market_returns:
            return 0.0
        
        asset_return = np.mean(asset_returns)
        market_return = np.mean(market_returns)
        
        expected_return = risk_free_rate + beta * (market_return - risk_free_rate)
        
        return (asset_return - expected_return) * 365  # Annualized
    
    def _calculate_sortino_ratio(self, returns: List[float], target_return: float = 0) -> float:
        """Calculate Sortino ratio"""
        if not returns:
            return 0.0
        
        excess_returns = [r - target_return for r in returns]
        downside_returns = [r for r in excess_returns if r < 0]
        
        if not downside_returns:
            return float('inf') if np.mean(excess_returns) > 0 else 0.0
        
        downside_deviation = np.std(downside_returns)
        
        if downside_deviation == 0:
            return 0.0
        
        return np.mean(excess_returns) / downside_deviation * np.sqrt(365)
    
    async def _get_trade_history(self, timeframe: TimeFrame) -> List[Dict]:
        """Get trade history for timeframe"""
        # Mock implementation - integrate with real database
        # This would fetch from your trade database
        return self.trade_history
    
    async def _get_portfolio_returns(self) -> List[float]:
        """Get portfolio returns"""
        # Mock implementation - integrate with real portfolio tracking
        # This would calculate actual portfolio returns
        return [0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025]
    
    async def _get_market_returns(self, symbol: str) -> List[float]:
        """Get market returns for benchmark"""
        try:
            klines = await self.api.get_kline(symbol, "15", 100)
            if not klines or len(klines) < 2:
                return []
            
            closes = [float(k[4]) for k in klines]
            returns = list(np.diff(closes) / closes[:-1])
            
            return returns
            
        except Exception as e:
            log.error(f"Market returns error: {e}")
            return []
    
    async def _calculate_max_exposure(self) -> float:
        """Calculate maximum exposure"""
        # This would check actual position sizes
        # Mock implementation
        return 5000.0
    
    def format_metrics_report(
        self,
        trade_metrics: TradeMetrics,
        market_metrics: MarketMetrics,
        risk_metrics: RiskMetrics
    ) -> str:
        """Format comprehensive metrics report"""
        report = """
📊 <b>Analytics Report</b>
{'=' * 30}

<b>📈 Trading Performance</b>
• Total Trades: {total_trades}
• Win Rate: {win_rate:.1f}%
• Profit Factor: {profit_factor:.2f}
• Sharpe Ratio: {sharpe:.2f}
• Max Drawdown: {max_dd:.1f}%
• Best Pair: {best_pair}
• Worst Pair: {worst_pair}

<b>💰 P&L Statistics</b>
• Total Profit: ${total_profit:.2f}
• Total Loss: ${total_loss:.2f}
• Largest Win: ${largest_win:.2f}
• Largest Loss: ${largest_loss:.2f}
• Average Win: ${avg_win:.2f}
• Average Loss: ${avg_loss:.2f}

<b>📊 Market Analysis</b>
• Volatility: {volatility:.1f}%
• Trend Strength: {trend:.1f}%
• Market Efficiency: {efficiency:.1f}%
• Liquidity Score: {liquidity:.1f}

<b>⚠️ Risk Metrics</b>
• VaR (95%): ${var:.2f}
• CVaR (95%): ${cvar:.2f}
• Beta: {beta:.2f}
• Alpha: {alpha:.2f}%
• Sortino Ratio: {sortino:.2f}
• Max Exposure: ${max_exp:.2f}
""".format(
            total_trades=trade_metrics.total_trades,
            win_rate=trade_metrics.win_rate,
            profit_factor=trade_metrics.profit_factor,
            sharpe=trade_metrics.sharpe_ratio,
            max_dd=trade_metrics.max_drawdown,
            best_pair=trade_metrics.best_pair or "N/A",
            worst_pair=trade_metrics.worst_pair or "N/A",
            total_profit=trade_metrics.total_profit,
            total_loss=trade_metrics.total_loss,
            largest_win=trade_metrics.largest_win,
            largest_loss=trade_metrics.largest_loss,
            avg_win=trade_metrics.average_win,
            avg_loss=trade_metrics.average_loss,
            volatility=market_metrics.volatility,
            trend=market_metrics.trend_strength,
            efficiency=market_metrics.market_efficiency,
            liquidity=market_metrics.liquidity_score,
            var=risk_metrics.var_95,
            cvar=risk_metrics.cvar_95,
            beta=risk_metrics.beta,
            alpha=risk_metrics.alpha,
            sortino=risk_metrics.sortino_ratio,
            max_exp=risk_metrics.max_exposure
        )
        
        return report
