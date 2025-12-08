"""
Enhanced Backtest Engine
Supports multiple strategies, risk/reward calculations, and comprehensive metrics
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from core.backtest.loader import load_dataset
from core.backtest.diagnostics import diagnose
import logging

log = logging.getLogger(__name__)


class BacktestEngine:
    """Enhanced backtest engine with strategy support"""
    
    def __init__(self):
        self.strategies = {}
        self._register_strategies()
    
    def _register_strategies(self):
        """Register available strategies"""
        try:
            from strategies.pattern3_extreme import pattern3_extreme
            self.strategies['pattern3_extreme'] = {
                'function': pattern3_extreme,
                'name': 'Three-Candle Swing Pattern with Extremum',
                'description': 'Detects three-candle structure with swing-low, red pierce, and green engulfing reversal'
            }
        except ImportError as e:
            log.warning(f"Could not import pattern3_extreme strategy: {e}")
        
        # Placeholder for other strategies
        self.strategies['momentum_ml_v2'] = {
            'function': None,  # To be implemented
            'name': 'Momentum ML v2',
            'description': 'Momentum-based model using volatility features and AI confidence. Analyzes price momentum with machine learning predictions.'
        }
        self.strategies['reversion_alpha'] = {
            'function': None,  # To be implemented
            'name': 'Reversion α',
            'description': 'Mean reversion with Bollinger deviation logic. Trades price reversions from extreme levels.'
        }
        self.strategies['ensemble_beta'] = {
            'function': None,  # To be implemented
            'name': 'Ensemble β',
            'description': 'Combined signals from Momentum + Reversion strategies. Uses weighted ensemble approach.'
        }
    
    def run(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "15m",
        strategy: str = "pattern3_extreme",
        risk_per_trade: float = 100.0,
        rr_ratio: float = 4.0,
        limit: int = 500
    ) -> Dict[str, Any]:
        """
        Run backtest with specified strategy and parameters.
        
        Args:
            symbol: Trading pair symbol
            interval: Timeframe interval
            strategy: Strategy name
            risk_per_trade: Risk amount in USD per trade
            rr_ratio: Risk/Reward ratio
            limit: Number of candles to load
        
        Returns:
            Dictionary with trades, summary, and metrics
        """
        # Load data
        data = load_dataset(symbol, interval, limit)
        
        if not data or len(data) < 4:
            return {
                "error": "Insufficient data",
                "symbol": symbol,
                "strategy": strategy,
                "timeframe": interval,
                "trades": [],
                "summary": {}
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Ensure required columns exist
        if 'volume' not in df.columns:
            df['volume'] = 0.0
        
        # Get strategy function
        if strategy not in self.strategies:
            return {
                "error": f"Strategy '{strategy}' not found",
                "available_strategies": list(self.strategies.keys())
            }
        
        strategy_func = self.strategies[strategy]['function']
        if strategy_func is None:
            return {
                "error": f"Strategy '{strategy}' is not yet implemented"
            }
        
        # Run strategy
        try:
            trades = strategy_func(df, risk_per_trade=risk_per_trade, rr_ratio=rr_ratio)
        except Exception as e:
            log.error(f"Error running strategy {strategy}: {e}")
            return {
                "error": str(e),
                "symbol": symbol,
                "strategy": strategy,
                "timeframe": interval
            }
        
        # Calculate summary metrics
        summary = self._calculate_summary(trades, risk_per_trade)
        
        return {
            "symbol": symbol,
            "strategy": strategy,
            "timeframe": interval,
            "trades": trades,
            "summary": summary
        }
    
    def _calculate_summary(self, trades: List[Dict], risk_per_trade: float) -> Dict[str, Any]:
        """Calculate backtest summary metrics"""
        if not trades:
            return {
                "total_trades": 0,
                "winrate": 0.0,
                "avg_R": 0.0,
                "pnl_%": 0.0,
                "sharpe": 0.0,
                "max_dd": 0.0,
                "total_pnl_usd": 0.0
            }
        
        # Calculate basic metrics
        total_trades = len(trades)
        winning_trades = [t for t in trades if t.get('result_R', 0) > 0]
        losing_trades = [t for t in trades if t.get('result_R', 0) <= 0]
        
        winrate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0.0
        
        # Calculate R-based metrics
        r_values = [t.get('result_R', 0) for t in trades]
        avg_R = np.mean(r_values) if r_values else 0.0
        
        # Calculate PnL
        total_pnl_usd = sum([t.get('result_R', 0) * risk_per_trade for t in trades])
        initial_capital = 10000.0  # Default starting capital
        pnl_pct = (total_pnl_usd / initial_capital * 100) if initial_capital > 0 else 0.0
        
        # Calculate equity curve for drawdown
        equity_curve = [initial_capital]
        for trade in trades:
            pnl = trade.get('result_R', 0) * risk_per_trade
            equity_curve.append(equity_curve[-1] + pnl)
        
        # Calculate max drawdown
        peak = initial_capital
        max_dd = 0.0
        for equity in equity_curve:
            if equity > peak:
                peak = equity
            drawdown = ((peak - equity) / peak * 100) if peak > 0 else 0.0
            if drawdown > max_dd:
                max_dd = drawdown
        
        # Calculate Sharpe ratio (simplified)
        if len(r_values) > 1:
            returns = np.array(r_values)
            sharpe = (np.mean(returns) / np.std(returns) * np.sqrt(252)) if np.std(returns) > 0 else 0.0
        else:
            sharpe = 0.0
        
        return {
            "total_trades": total_trades,
            "winrate": round(winrate, 1),
            "avg_R": round(avg_R, 2),
            "pnl_%": round(pnl_pct, 2),
            "sharpe": round(sharpe, 2),
            "max_dd": round(max_dd, 2),
            "total_pnl_usd": round(total_pnl_usd, 2),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades)
        }
    
    def summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate summary from multiple strategy backtests.
        
        Args:
            results: List of backtest result dictionaries
        
        Returns:
            Aggregated summary with comparison metrics
        """
        if not results:
            return {"error": "No results provided"}
        
        summary_data = []
        for result in results:
            if 'summary' in result and 'error' not in result:
                summary_data.append({
                    'strategy': result.get('strategy', 'unknown'),
                    'symbol': result.get('symbol', 'unknown'),
                    'timeframe': result.get('timeframe', 'unknown'),
                    **result.get('summary', {})
                })
        
        return {
            "strategies": summary_data,
            "best_strategy": max(summary_data, key=lambda x: x.get('pnl_%', 0)) if summary_data else None,
            "total_strategies": len(summary_data)
        }
    
    def get_available_strategies(self) -> Dict[str, Dict[str, str]]:
        """Get list of available strategies with descriptions"""
        return {
            name: {
                'name': info['name'],
                'description': info['description'],
                'available': info['function'] is not None
            }
            for name, info in self.strategies.items()
        }
