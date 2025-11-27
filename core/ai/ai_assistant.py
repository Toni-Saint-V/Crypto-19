import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import numpy as np
from bot.core.logger import get_logger
from bot.trading.bybit_v5 import BybitV5
from bot.trading.candles import load_candles

log = get_logger("ai_assistant")

class SignalStrength(Enum):
    STRONG_BUY = ("🟢🟢🟢", "Strong Buy", 0.8)
    BUY = ("🟢🟢", "Buy", 0.6)
    WEAK_BUY = ("🟢", "Weak Buy", 0.4)
    NEUTRAL = ("⚪", "Neutral", 0.0)
    WEAK_SELL = ("🔴", "Weak Sell", -0.4)
    SELL = ("🔴🔴", "Sell", -0.6)
    STRONG_SELL = ("🔴🔴🔴", "Strong Sell", -0.8)

@dataclass
class MarketAnalysis:
    """Market analysis result"""
    symbol: str
    timestamp: datetime
    price: float
    signal: SignalStrength
    confidence: float
    reasons: List[str]
    technical_indicators: Dict[str, float]
    sentiment: str
    risk_level: str
    entry_points: List[float]
    stop_loss: float
    take_profit: List[float]
    analysis_text: str

@dataclass
class TradingRecommendation:
    """Trading recommendation from AI"""
    action: str  # BUY, SELL, HOLD
    symbol: str
    confidence: float
    position_size: float
    entry_price: float
    stop_loss: float
    take_profit: float
    reasoning: str
    risk_reward_ratio: float
    expected_duration: str

class AIAssistant:
    """Advanced AI trading assistant with market analysis capabilities"""
    
    def __init__(self):
        self.api = BybitV5()
        self.analysis_cache: Dict[str, MarketAnalysis] = {}
        self.recommendation_history: List[TradingRecommendation] = []
        self.learning_data: List[Dict] = []
        
    async def analyze_market(self, symbol: str = "BTCUSDT") -> MarketAnalysis:
        """Comprehensive market analysis"""
        try:
            # Load candles
            candles = await load_candles(symbol, "15", 200)
            if len(candles) < 50:
                raise ValueError("Insufficient data for analysis")
            
            # Calculate technical indicators
            indicators = await self._calculate_indicators(candles)
            
            # Determine signal strength
            signal = self._determine_signal(indicators)
            
            # Calculate confidence
            confidence = self._calculate_confidence(indicators, signal)
            
            # Generate reasoning
            reasons = self._generate_reasons(indicators, signal)
            
            # Determine sentiment
            sentiment = self._analyze_sentiment(indicators)
            
            # Calculate risk level
            risk_level = self._calculate_risk_level(indicators)
            
            # Find entry points
            entry_points = self._find_entry_points(candles, indicators)
            
            # Calculate stop loss and take profit
            current_price = candles[-1]["close"]
            stop_loss, take_profits = self._calculate_sl_tp(current_price, indicators)
            
            # Generate detailed analysis
            analysis_text = self._generate_analysis_text(
                symbol, indicators, signal, confidence, reasons
            )
            
            analysis = MarketAnalysis(
                symbol=symbol,
                timestamp=datetime.now(),
                price=current_price,
                signal=signal,
                confidence=confidence,
                reasons=reasons,
                technical_indicators=indicators,
                sentiment=sentiment,
                risk_level=risk_level,
                entry_points=entry_points,
                stop_loss=stop_loss,
                take_profit=take_profits,
                analysis_text=analysis_text
            )
            
            # Cache the analysis
            self.analysis_cache[symbol] = analysis
            
            return analysis
            
        except Exception as e:
            log.error(f"Market analysis error: {e}")
            raise
    
    async def _calculate_indicators(self, candles: List[Dict]) -> Dict[str, float]:
        """Calculate technical indicators"""
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        volumes = np.array([c["volume"] for c in candles])
        
        # Moving averages
        ma7 = np.mean(closes[-7:])
        ma20 = np.mean(closes[-20:])
        ma50 = np.mean(closes[-50:]) if len(closes) >= 50 else ma20
        
        # RSI calculation
        deltas = np.diff(closes)
        gains = deltas.copy()
        gains[gains < 0] = 0
        losses = -deltas.copy()
        losses[losses < 0] = 0
        
        avg_gain = np.mean(gains[-14:]) if len(gains) >= 14 else np.mean(gains)
        avg_loss = np.mean(losses[-14:]) if len(losses) >= 14 else np.mean(losses)
        
        if avg_loss != 0:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        else:
            rsi = 100 if avg_gain > 0 else 50
        
        # MACD
        ema12 = self._calculate_ema(closes, 12)
        ema26 = self._calculate_ema(closes, 26)
        macd = ema12 - ema26
        signal_line = self._calculate_ema(np.array([macd]), 9)
        macd_histogram = macd - signal_line
        
        # Bollinger Bands
        bb_middle = ma20
        bb_std = np.std(closes[-20:])
        bb_upper = bb_middle + (2 * bb_std)
        bb_lower = bb_middle - (2 * bb_std)
        
        # Volume analysis
        volume_ma = np.mean(volumes[-20:])
        volume_ratio = volumes[-1] / volume_ma if volume_ma > 0 else 1
        
        # Price position
        price = closes[-1]
        price_position = (price - bb_lower) / (bb_upper - bb_lower) if bb_upper != bb_lower else 0.5
        
        # Trend strength
        trend_strength = abs(ma7 - ma20) / ma20 * 100 if ma20 > 0 else 0
        
        return {
            "price": price,
            "ma7": ma7,
            "ma20": ma20,
            "ma50": ma50,
            "rsi": rsi,
            "macd": macd,
            "macd_signal": signal_line,
            "macd_histogram": macd_histogram,
            "bb_upper": bb_upper,
            "bb_middle": bb_middle,
            "bb_lower": bb_lower,
            "volume_ratio": volume_ratio,
            "price_position": price_position,
            "trend_strength": trend_strength,
            "volatility": bb_std / bb_middle * 100 if bb_middle > 0 else 0
        }
    
    def _calculate_ema(self, data: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(data) < period:
            return np.mean(data)
        
        alpha = 2 / (period + 1)
        ema = data[0]
        for price in data[1:]:
            ema = alpha * price + (1 - alpha) * ema
        return ema
    
    def _determine_signal(self, indicators: Dict[str, float]) -> SignalStrength:
        """Determine trading signal based on indicators"""
        score = 0
        
        # Moving average signals
        if indicators["ma7"] > indicators["ma20"]:
            score += 0.2
        if indicators["ma20"] > indicators["ma50"]:
            score += 0.2
        
        # RSI signals
        if indicators["rsi"] < 30:
            score += 0.3
        elif indicators["rsi"] > 70:
            score -= 0.3
        elif 40 <= indicators["rsi"] <= 60:
            score += 0.1
        
        # MACD signals
        if indicators["macd_histogram"] > 0:
            score += 0.2
        else:
            score -= 0.2
        
        # Bollinger Bands signals
        if indicators["price_position"] < 0.2:
            score += 0.25
        elif indicators["price_position"] > 0.8:
            score -= 0.25
        
        # Volume confirmation
        if indicators["volume_ratio"] > 1.5:
            score = score * 1.2
        
        # Map score to signal strength
        if score >= 0.8:
            return SignalStrength.STRONG_BUY
        elif score >= 0.6:
            return SignalStrength.BUY
        elif score >= 0.4:
            return SignalStrength.WEAK_BUY
        elif score <= -0.8:
            return SignalStrength.STRONG_SELL
        elif score <= -0.6:
            return SignalStrength.SELL
        elif score <= -0.4:
            return SignalStrength.WEAK_SELL
        else:
            return SignalStrength.NEUTRAL
    
    def _calculate_confidence(self, indicators: Dict[str, float], signal: SignalStrength) -> float:
        """Calculate confidence level for the signal"""
        confidence = 0.5  # Base confidence
        
        # Trend alignment
        if indicators["ma7"] > indicators["ma20"] > indicators["ma50"]:
            confidence += 0.15
        elif indicators["ma7"] < indicators["ma20"] < indicators["ma50"]:
            confidence += 0.15
        
        # RSI confirmation
        if (signal in [SignalStrength.BUY, SignalStrength.STRONG_BUY] and indicators["rsi"] < 40) or \
           (signal in [SignalStrength.SELL, SignalStrength.STRONG_SELL] and indicators["rsi"] > 60):
            confidence += 0.1
        
        # Volume confirmation
        if indicators["volume_ratio"] > 1.2:
            confidence += 0.1
        
        # Volatility adjustment
        if indicators["volatility"] < 2:
            confidence += 0.05
        elif indicators["volatility"] > 5:
            confidence -= 0.1
        
        # MACD confirmation
        if abs(indicators["macd_histogram"]) > 0:
            confidence += 0.1
        
        return min(max(confidence, 0.1), 0.95)
    
    def _generate_reasons(self, indicators: Dict[str, float], signal: SignalStrength) -> List[str]:
        """Generate reasoning for the signal"""
        reasons = []
        
        # Moving average analysis
        if indicators["ma7"] > indicators["ma20"]:
            reasons.append("📈 Short-term trend is bullish (MA7 > MA20)")
        else:
            reasons.append("📉 Short-term trend is bearish (MA7 < MA20)")
        
        # RSI analysis
        if indicators["rsi"] < 30:
            reasons.append("🔥 RSI indicates oversold condition")
        elif indicators["rsi"] > 70:
            reasons.append("❄️ RSI indicates overbought condition")
        else:
            reasons.append(f"📊 RSI in neutral zone ({indicators['rsi']:.0f})")
        
        # MACD analysis
        if indicators["macd_histogram"] > 0:
            reasons.append("✅ MACD showing bullish momentum")
        else:
            reasons.append("⚠️ MACD showing bearish momentum")
        
        # Bollinger Bands
        if indicators["price_position"] < 0.2:
            reasons.append("💚 Price near lower Bollinger Band (potential bounce)")
        elif indicators["price_position"] > 0.8:
            reasons.append("🔴 Price near upper Bollinger Band (potential resistance)")
        
        # Volume
        if indicators["volume_ratio"] > 1.5:
            reasons.append(f"📢 High volume confirmation ({indicators['volume_ratio']:.1f}x average)")
        elif indicators["volume_ratio"] < 0.5:
            reasons.append("🔇 Low volume warning")
        
        # Trend strength
        if indicators["trend_strength"] > 2:
            reasons.append(f"💪 Strong trend detected ({indicators['trend_strength']:.1f}%)")
        
        return reasons
    
    def _analyze_sentiment(self, indicators: Dict[str, float]) -> str:
        """Analyze market sentiment"""
        bullish_score = 0
        bearish_score = 0
        
        if indicators["ma7"] > indicators["ma20"]:
            bullish_score += 1
        else:
            bearish_score += 1
        
        if indicators["rsi"] < 50:
            bullish_score += 0.5
        else:
            bearish_score += 0.5
        
        if indicators["macd_histogram"] > 0:
            bullish_score += 1
        else:
            bearish_score += 1
        
        if indicators["price_position"] < 0.5:
            bullish_score += 0.5
        else:
            bearish_score += 0.5
        
        if bullish_score > bearish_score * 1.5:
            return "🐂 Bullish"
        elif bearish_score > bullish_score * 1.5:
            return "🐻 Bearish"
        else:
            return "🤷 Mixed"
    
    def _calculate_risk_level(self, indicators: Dict[str, float]) -> str:
        """Calculate current risk level"""
        risk_score = 0
        
        # Volatility risk
        if indicators["volatility"] > 5:
            risk_score += 2
        elif indicators["volatility"] > 3:
            risk_score += 1
        
        # Overbought/oversold risk
        if indicators["rsi"] > 80 or indicators["rsi"] < 20:
            risk_score += 1
        
        # Price position risk
        if indicators["price_position"] > 0.9 or indicators["price_position"] < 0.1:
            risk_score += 1
        
        # Trend strength risk
        if indicators["trend_strength"] < 0.5:
            risk_score += 1
        
        if risk_score >= 4:
            return "🔴 High Risk"
        elif risk_score >= 2:
            return "🟡 Medium Risk"
        else:
            return "🟢 Low Risk"
    
    def _find_entry_points(self, candles: List[Dict], indicators: Dict[str, float]) -> List[float]:
        """Find optimal entry points"""
        current_price = indicators["price"]
        entry_points = []
        
        # Primary entry at current price if signal is strong
        entry_points.append(current_price)
        
        # Secondary entry near support levels
        if indicators["price_position"] > 0.5:
            entry_points.append(indicators["bb_middle"])
            entry_points.append(indicators["ma20"])
        
        # Scale-in entries
        if current_price > indicators["bb_lower"]:
            entry_points.append(indicators["bb_lower"] * 1.01)
        
        return sorted(list(set(entry_points)))
    
    def _calculate_sl_tp(self, price: float, indicators: Dict[str, float]) -> Tuple[float, List[float]]:
        """Calculate stop loss and take profit levels"""
        # Stop loss
        volatility_factor = max(indicators["volatility"] / 100, 0.02)
        stop_loss = price * (1 - volatility_factor * 1.5)
        
        # Multiple take profit levels
        take_profits = [
            price * (1 + volatility_factor * 2),    # TP1: 2x risk
            price * (1 + volatility_factor * 4),    # TP2: 4x risk
            price * (1 + volatility_factor * 6),    # TP3: 6x risk
        ]
        
        return stop_loss, take_profits
    
    def _generate_analysis_text(
        self,
        symbol: str,
        indicators: Dict[str, float],
        signal: SignalStrength,
        confidence: float,
        reasons: List[str]
    ) -> str:
        """Generate detailed analysis text"""
        text = f"""
🤖 <b>AI Market Analysis: {symbol}</b>
{'=' * 30}

📊 <b>Current Status</b>
• Price: ${indicators['price']:.2f}
• Signal: {signal.value[0]} {signal.value[1]}
• Confidence: {confidence * 100:.0f}%

📈 <b>Technical Overview</b>
• RSI: {indicators['rsi']:.0f}
• MACD: {'Bullish' if indicators['macd_histogram'] > 0 else 'Bearish'}
• MA Trend: {'Bullish' if indicators['ma7'] > indicators['ma20'] else 'Bearish'}
• Volatility: {indicators['volatility']:.1f}%
• Volume: {indicators['volume_ratio']:.1f}x average

🎯 <b>Key Observations</b>
"""
        for reason in reasons[:5]:
            text += f"• {reason}\n"
        
        text += f"""
💡 <b>AI Recommendation</b>
Based on the analysis of multiple technical indicators and market conditions, 
the AI suggests a {signal.value[1].lower()} position with {confidence * 100:.0f}% confidence.

<i>Remember: This is AI analysis, not financial advice. Always manage your risk!</i>
"""
        return text
    
    async def get_trading_signals(self, symbols: List[str] = None) -> List[MarketAnalysis]:
        """Get trading signals for multiple symbols"""
        if symbols is None:
            symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
        
        signals = []
        for symbol in symbols:
            try:
                analysis = await self.analyze_market(symbol)
                signals.append(analysis)
            except Exception as e:
                log.error(f"Failed to analyze {symbol}: {e}")
        
        # Sort by signal strength and confidence
        signals.sort(key=lambda x: (x.signal.value[2], x.confidence), reverse=True)
        return signals
    
    async def generate_recommendation(
        self,
        symbol: str,
        balance: float,
        risk_percentage: float = 2.0
    ) -> TradingRecommendation:
        """Generate specific trading recommendation"""
        try:
            analysis = await self.analyze_market(symbol)
            
            # Determine action
            if analysis.signal in [SignalStrength.STRONG_BUY, SignalStrength.BUY]:
                action = "BUY"
            elif analysis.signal in [SignalStrength.STRONG_SELL, SignalStrength.SELL]:
                action = "SELL"
            else:
                action = "HOLD"
            
            # Calculate position size based on risk
            risk_amount = balance * (risk_percentage / 100)
            price_risk = abs(analysis.price - analysis.stop_loss)
            position_size = risk_amount / price_risk if price_risk > 0 else 0
            
            # Risk reward ratio
            potential_reward = analysis.take_profit[0] - analysis.price
            risk_reward = potential_reward / price_risk if price_risk > 0 else 0
            
            # Expected duration based on timeframe
            if analysis.signal.value[2] > 0.6:
                duration = "1-3 hours"
            elif analysis.signal.value[2] > 0.4:
                duration = "3-6 hours"
            else:
                duration = "6-12 hours"
            
            # Generate reasoning
            reasoning = f"""
Based on comprehensive technical analysis:
• {analysis.sentiment} market sentiment detected
• {analysis.risk_level} risk environment
• Key signals: {', '.join(analysis.reasons[:3])}
• Optimal entry near ${analysis.price:.2f}
• Risk/Reward ratio: {risk_reward:.1f}:1
"""
            
            recommendation = TradingRecommendation(
                action=action,
                symbol=symbol,
                confidence=analysis.confidence,
                position_size=position_size,
                entry_price=analysis.price,
                stop_loss=analysis.stop_loss,
                take_profit=analysis.take_profit[0],
                reasoning=reasoning.strip(),
                risk_reward_ratio=risk_reward,
                expected_duration=duration
            )
            
            self.recommendation_history.append(recommendation)
            return recommendation
            
        except Exception as e:
            log.error(f"Failed to generate recommendation: {e}")
            raise
    
    def format_signals_message(self, signals: List[MarketAnalysis]) -> str:
        """Format trading signals for display"""
        if not signals:
            return "No trading signals available at the moment."
        
        message = "🤖 <b>AI Trading Signals</b>\n\n"
        
        for signal in signals[:5]:
            message += f"""
<b>{signal.symbol}</b>
{signal.signal.value[0]} {signal.signal.value[1]} • Confidence: {signal.confidence * 100:.0f}%
Price: ${signal.price:.2f} • {signal.risk_level}
{signal.reasons[0] if signal.reasons else 'Analyzing...'}
{'─' * 20}
"""
        
        message += "\n<i>Use /ai_analyze [symbol] for detailed analysis</i>"
        return message
    
    def format_recommendation_message(self, rec: TradingRecommendation) -> str:
        """Format recommendation for display"""
        emoji = "🟢" if rec.action == "BUY" else "🔴" if rec.action == "SELL" else "⚪"
        
        message = f"""
{emoji} <b>Trading Recommendation: {rec.symbol}</b>
{'=' * 30}

<b>Action:</b> {rec.action}
<b>Confidence:</b> {rec.confidence * 100:.0f}%

<b>📊 Trade Setup</b>
• Entry: ${rec.entry_price:.2f}
• Stop Loss: ${rec.stop_loss:.2f}
• Take Profit: ${rec.take_profit:.2f}
• Position Size: {rec.position_size:.3f}
• Risk/Reward: {rec.risk_reward_ratio:.1f}:1
• Est. Duration: {rec.expected_duration}

<b>📝 AI Analysis</b>
{rec.reasoning}

<i>⚠️ Risk Warning: Trade at your own risk</i>
"""
        return message
