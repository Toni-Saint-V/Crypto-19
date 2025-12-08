import asyncio
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import json

import logging
log = logging.getLogger(__name__)
from core.services.fetch_bybit_klines import fetch_klines

class SignalType(Enum):
    STRONG_BUY = 2
    BUY = 1
    NEUTRAL = 0
    SELL = -1
    STRONG_SELL = -2

@dataclass
class MLSignal:
    """ML trading signal"""
    timestamp: datetime
    symbol: str
    signal: SignalType
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: List[float]
    features: Dict[str, float]
    risk_score: float
    expected_return: float
    holding_period: int  # in minutes

class AdvancedMLStrategy:
    """Machine Learning based trading strategy with advanced features"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model: Optional[RandomForestClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_importance: Dict[str, float] = {}
        self.prediction_history: List[Dict] = []
        self.api = None
        
        if model_path:
            self.load_model(model_path)
        else:
            self.initialize_model()
    
    def initialize_model(self):
        """Initialize new ML model"""
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        log.info("Initialized new ML model")
    
    async def extract_features(self, candles: List[Dict]) -> np.ndarray:
        """Extract advanced features from candles"""
        if len(candles) < 50:
            raise ValueError("Insufficient data for feature extraction")
        
        features = []
        closes = np.array([c["close"] for c in candles])
        highs = np.array([c["high"] for c in candles])
        lows = np.array([c["low"] for c in candles])
        volumes = np.array([c["volume"] for c in candles])
        
        # Price features
        features.extend([
            self._calculate_rsi(closes),
            self._calculate_macd(closes),
            self._calculate_bollinger_position(closes),
            self._calculate_stochastic(highs, lows, closes),
            self._calculate_atr(highs, lows, closes),
            self._calculate_obv(closes, volumes),
            self._calculate_vwap(highs, lows, closes, volumes),
            self._calculate_momentum(closes),
            self._calculate_roc(closes),
            self._calculate_williams_r(highs, lows, closes)
        ])
        
        # Volume features
        features.extend([
            self._calculate_volume_ratio(volumes),
            self._calculate_money_flow_index(highs, lows, closes, volumes),
            self._calculate_accumulation_distribution(highs, lows, closes, volumes),
            self._calculate_volume_weighted_momentum(closes, volumes)
        ])
        
        # Volatility features
        features.extend([
            self._calculate_volatility(closes),
            self._calculate_keltner_position(highs, lows, closes),
            self._calculate_donchian_position(highs, lows, closes),
            self._calculate_average_true_range_percent(highs, lows, closes)
        ])
        
        # Pattern features
        features.extend([
            self._detect_double_top(highs),
            self._detect_double_bottom(lows),
            self._detect_head_shoulders(closes),
            self._detect_triangle_pattern(highs, lows),
            self._calculate_fractal_dimension(closes),
            self._calculate_hurst_exponent(closes)
        ])
        
        # Market structure features
        features.extend([
            self._calculate_market_regime(closes),
            self._calculate_trend_strength(closes),
            self._calculate_support_resistance_distance(closes, highs, lows),
            self._calculate_pivot_points(highs, lows, closes)
        ])
        
        # Microstructure features
        features.extend([
            self._calculate_bid_ask_spread_proxy(highs, lows),
            self._calculate_kyle_lambda(closes, volumes),
            self._calculate_amihud_illiquidity(closes, volumes),
            self._calculate_roll_measure(closes)
        ])
        
        return np.array(features).reshape(1, -1)
    
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate RSI"""
        deltas = np.diff(prices)
        gains = deltas.copy()
        gains[gains < 0] = 0
        losses = -deltas.copy()
        losses[losses < 0] = 0
        
        avg_gain = np.mean(gains[-period:]) if len(gains) >= period else np.mean(gains)
        avg_loss = np.mean(losses[-period:]) if len(losses) >= period else np.mean(losses)
        
        if avg_loss == 0:
            return 100 if avg_gain > 0 else 50
        
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_macd(self, prices: np.ndarray) -> float:
        """Calculate MACD histogram"""
        exp1 = self._ema(prices, 12)
        exp2 = self._ema(prices, 26)
        macd = exp1 - exp2
        signal = self._ema(np.array([macd]), 9)
        return macd - signal
    
    def _calculate_bollinger_position(self, prices: np.ndarray, period: int = 20) -> float:
        """Calculate position within Bollinger Bands"""
        sma = np.mean(prices[-period:])
        std = np.std(prices[-period:])
        upper = sma + (2 * std)
        lower = sma - (2 * std)
        
        if upper == lower:
            return 0.5
        
        return (prices[-1] - lower) / (upper - lower)
    
    def _calculate_stochastic(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Calculate Stochastic Oscillator"""
        highest = np.max(highs[-period:])
        lowest = np.min(lows[-period:])
        
        if highest == lowest:
            return 50
        
        k = ((closes[-1] - lowest) / (highest - lowest)) * 100
        return k
    
    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Calculate Average True Range"""
        tr = []
        for i in range(1, len(highs)):
            tr.append(max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            ))
        
        if not tr:
            return 0
        
        return np.mean(tr[-period:]) if len(tr) >= period else np.mean(tr)
    
    def _calculate_obv(self, prices: np.ndarray, volumes: np.ndarray) -> float:
        """Calculate On-Balance Volume trend"""
        obv = 0
        obv_values = []
        
        for i in range(1, len(prices)):
            if prices[i] > prices[i-1]:
                obv += volumes[i]
            elif prices[i] < prices[i-1]:
                obv -= volumes[i]
            obv_values.append(obv)
        
        if len(obv_values) < 2:
            return 0
        
        # Return normalized OBV trend
        return (obv_values[-1] - np.mean(obv_values)) / (np.std(obv_values) + 1e-10)
    
    def _calculate_vwap(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, volumes: np.ndarray) -> float:
        """Calculate VWAP deviation"""
        typical_price = (highs + lows + closes) / 3
        vwap = np.sum(typical_price * volumes) / np.sum(volumes)
        
        if vwap == 0:
            return 0
        
        return (closes[-1] - vwap) / vwap * 100
    
    def _calculate_momentum(self, prices: np.ndarray, period: int = 10) -> float:
        """Calculate price momentum"""
        if len(prices) < period + 1:
            return 0
        
        return (prices[-1] / prices[-period-1] - 1) * 100
    
    def _calculate_roc(self, prices: np.ndarray, period: int = 12) -> float:
        """Calculate Rate of Change"""
        if len(prices) < period + 1:
            return 0
        
        return ((prices[-1] - prices[-period-1]) / prices[-period-1]) * 100
    
    def _calculate_williams_r(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """Calculate Williams %R"""
        highest = np.max(highs[-period:])
        lowest = np.min(lows[-period:])
        
        if highest == lowest:
            return -50
        
        return ((highest - closes[-1]) / (highest - lowest)) * -100
    
    def _calculate_volume_ratio(self, volumes: np.ndarray, period: int = 20) -> float:
        """Calculate volume ratio to average"""
        avg_volume = np.mean(volumes[-period:])
        
        if avg_volume == 0:
            return 1
        
        return volumes[-1] / avg_volume
    
    def _calculate_money_flow_index(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, volumes: np.ndarray, period: int = 14) -> float:
        """Calculate Money Flow Index"""
        typical_price = (highs + lows + closes) / 3
        money_flow = typical_price * volumes
        
        positive_flow = 0
        negative_flow = 0
        
        for i in range(1, min(period + 1, len(typical_price))):
            if typical_price[-i] > typical_price[-i-1]:
                positive_flow += money_flow[-i]
            else:
                negative_flow += money_flow[-i]
        
        if negative_flow == 0:
            return 100
        
        money_ratio = positive_flow / negative_flow
        return 100 - (100 / (1 + money_ratio))
    
    def _calculate_accumulation_distribution(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, volumes: np.ndarray) -> float:
        """Calculate Accumulation/Distribution line"""
        ad = 0
        for i in range(len(closes)):
            if highs[i] != lows[i]:
                mfm = ((closes[i] - lows[i]) - (highs[i] - closes[i])) / (highs[i] - lows[i])
                ad += mfm * volumes[i]
        
        return ad / (np.sum(volumes) + 1e-10)
    
    def _calculate_volume_weighted_momentum(self, prices: np.ndarray, volumes: np.ndarray, period: int = 10) -> float:
        """Calculate volume-weighted momentum"""
        if len(prices) < period:
            return 0
        
        weighted_prices = prices * volumes
        vwm = np.sum(weighted_prices[-period:]) / np.sum(volumes[-period:])
        
        if prices[-period] == 0:
            return 0
        
        return (vwm / prices[-period] - 1) * 100
    
    def _calculate_volatility(self, prices: np.ndarray, period: int = 20) -> float:
        """Calculate annualized volatility"""
        returns = np.diff(prices) / prices[:-1]
        return np.std(returns[-period:]) * np.sqrt(365 * 96) * 100  # 96 = 15-min periods per day
    
    def _calculate_keltner_position(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 20) -> float:
        """Calculate position within Keltner Channels"""
        ema = self._ema(closes, period)
        atr = self._calculate_atr(highs, lows, closes, period)
        
        upper = ema + (2 * atr)
        lower = ema - (2 * atr)
        
        if upper == lower:
            return 0.5
        
        return (closes[-1] - lower) / (upper - lower)
    
    def _calculate_donchian_position(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 20) -> float:
        """Calculate position within Donchian Channels"""
        upper = np.max(highs[-period:])
        lower = np.min(lows[-period:])
        
        if upper == lower:
            return 0.5
        
        return (closes[-1] - lower) / (upper - lower)
    
    def _calculate_average_true_range_percent(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> float:
        """Calculate ATR as percentage of price"""
        atr = self._calculate_atr(highs, lows, closes)
        
        if closes[-1] == 0:
            return 0
        
        return (atr / closes[-1]) * 100
    
    def _detect_double_top(self, highs: np.ndarray, window: int = 20) -> float:
        """Detect double top pattern"""
        if len(highs) < window:
            return 0
        
        recent = highs[-window:]
        peaks = []
        
        for i in range(1, len(recent) - 1):
            if recent[i] > recent[i-1] and recent[i] > recent[i+1]:
                peaks.append((i, recent[i]))
        
        if len(peaks) >= 2:
            # Check if two peaks are similar height
            peak1, peak2 = peaks[-2], peaks[-1]
            if abs(peak1[1] - peak2[1]) / peak1[1] < 0.02:  # Within 2%
                return 1.0
        
        return 0.0
    
    def _detect_double_bottom(self, lows: np.ndarray, window: int = 20) -> float:
        """Detect double bottom pattern"""
        if len(lows) < window:
            return 0
        
        recent = lows[-window:]
        troughs = []
        
        for i in range(1, len(recent) - 1):
            if recent[i] < recent[i-1] and recent[i] < recent[i+1]:
                troughs.append((i, recent[i]))
        
        if len(troughs) >= 2:
            # Check if two troughs are similar depth
            trough1, trough2 = troughs[-2], troughs[-1]
            if abs(trough1[1] - trough2[1]) / trough1[1] < 0.02:  # Within 2%
                return 1.0
        
        return 0.0
    
    def _detect_head_shoulders(self, prices: np.ndarray, window: int = 30) -> float:
        """Detect head and shoulders pattern"""
        if len(prices) < window:
            return 0
        
        # Simplified detection
        recent = prices[-window:]
        mid = len(recent) // 2
        
        left_shoulder = np.max(recent[:mid-5])
        head = np.max(recent[mid-5:mid+5])
        right_shoulder = np.max(recent[mid+5:])
        
        if head > left_shoulder and head > right_shoulder:
            if abs(left_shoulder - right_shoulder) / left_shoulder < 0.05:
                return 1.0
        
        return 0.0
    
    def _detect_triangle_pattern(self, highs: np.ndarray, lows: np.ndarray, window: int = 20) -> float:
        """Detect triangle pattern (converging highs and lows)"""
        if len(highs) < window:
            return 0
        
        recent_highs = highs[-window:]
        recent_lows = lows[-window:]
        
        # Check if range is decreasing
        early_range = np.mean(recent_highs[:5]) - np.mean(recent_lows[:5])
        late_range = np.mean(recent_highs[-5:]) - np.mean(recent_lows[-5:])
        
        if early_range > 0 and late_range > 0:
            convergence = 1 - (late_range / early_range)
            return max(0, min(1, convergence))
        
        return 0.0
    
    def _calculate_fractal_dimension(self, prices: np.ndarray, window: int = 30) -> float:
        """Calculate fractal dimension using box counting method"""
        if len(prices) < window:
            return 1.5
        
        recent = prices[-window:]
        
        # Normalize to [0, 1]
        min_p, max_p = np.min(recent), np.max(recent)
        if max_p == min_p:
            return 1.5
        
        normalized = (recent - min_p) / (max_p - min_p)
        
        # Simple box counting
        boxes_2 = len(set(np.floor(normalized * 2)))
        boxes_4 = len(set(np.floor(normalized * 4)))
        
        if boxes_2 > 0 and boxes_4 > boxes_2:
            return np.log(boxes_4 / boxes_2) / np.log(2)
        
        return 1.5
    
    def _calculate_hurst_exponent(self, prices: np.ndarray, window: int = 100) -> float:
        """Calculate Hurst exponent for trend persistence"""
        if len(prices) < window:
            return 0.5
        
        recent = prices[-window:]
        returns = np.diff(recent) / recent[:-1]
        
        if len(returns) < 2:
            return 0.5
        
        # R/S analysis (simplified)
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0.5
        
        cumsum = np.cumsum(returns - mean_return)
        R = np.max(cumsum) - np.min(cumsum)
        S = std_return
        
        if S > 0:
            RS = R / S
            # Hurst = log(R/S) / log(n/2)
            H = np.log(RS) / np.log(len(returns) / 2)
            return max(0, min(1, H))
        
        return 0.5
    
    def _calculate_market_regime(self, prices: np.ndarray) -> float:
        """Identify market regime (trending vs ranging)"""
        if len(prices) < 50:
            return 0
        
        # Calculate ADX-like measure
        returns = np.diff(prices) / prices[:-1]
        
        # Directional movement
        pos_returns = returns[returns > 0]
        neg_returns = returns[returns < 0]
        
        if len(pos_returns) == 0 or len(neg_returns) == 0:
            return 1.0  # Strong trend
        
        # Ratio of directional movement
        trend_score = abs(len(pos_returns) - len(neg_returns)) / len(returns)
        
        return trend_score
    
    def _calculate_trend_strength(self, prices: np.ndarray, window: int = 20) -> float:
        """Calculate trend strength using linear regression"""
        if len(prices) < window:
            return 0
        
        recent = prices[-window:]
        x = np.arange(len(recent))
        
        # Linear regression
        slope = np.polyfit(x, recent, 1)[0]
        
        # Normalize by price level
        return (slope / np.mean(recent)) * 100
    
    def _calculate_support_resistance_distance(self, prices: np.ndarray, highs: np.ndarray, lows: np.ndarray) -> float:
        """Calculate distance to nearest support/resistance"""
        if len(prices) < 50:
            return 0
        
        current = prices[-1]
        
        # Find recent peaks and troughs
        resistance_levels = []
        support_levels = []
        
        for i in range(10, len(highs) - 1):
            if highs[i] > highs[i-1] and highs[i] > highs[i+1]:
                resistance_levels.append(highs[i])
            if lows[i] < lows[i-1] and lows[i] < lows[i+1]:
                support_levels.append(lows[i])
        
        # Find nearest levels
        nearest_resistance = min([r for r in resistance_levels if r > current], default=current * 1.1)
        nearest_support = max([s for s in support_levels if s < current], default=current * 0.9)
        
        # Return normalized distance
        return (current - nearest_support) / (nearest_resistance - nearest_support) if nearest_resistance != nearest_support else 0.5
    
    def _calculate_pivot_points(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> float:
        """Calculate pivot point position"""
        if len(highs) < 2:
            return 0
        
        # Classic pivot point
        pivot = (highs[-2] + lows[-2] + closes[-2]) / 3
        
        # Position relative to pivot
        return (closes[-1] - pivot) / pivot * 100
    
    def _calculate_bid_ask_spread_proxy(self, highs: np.ndarray, lows: np.ndarray) -> float:
        """Estimate bid-ask spread from high-low"""
        if len(highs) < 20:
            return 0
        
        # Corwin-Schultz spread estimator
        spreads = 2 * (np.exp(np.sqrt(2 * np.log(highs / lows))) - 1) / (1 + np.exp(np.sqrt(2 * np.log(highs / lows))))
        
        return np.mean(spreads[-20:])
    
    def _calculate_kyle_lambda(self, prices: np.ndarray, volumes: np.ndarray) -> float:
        """Calculate Kyle's lambda (price impact)"""
        if len(prices) < 20:
            return 0
        
        returns = np.diff(prices) / prices[:-1]
        signed_volumes = volumes[1:] * np.sign(returns)
        
        if np.std(signed_volumes) == 0:
            return 0
        
        # Price impact coefficient
        lambda_kyle = np.cov(returns, signed_volumes)[0, 1] / np.var(signed_volumes)
        
        return lambda_kyle * 1e6  # Scale for readability
    
    def _calculate_amihud_illiquidity(self, prices: np.ndarray, volumes: np.ndarray) -> float:
        """Calculate Amihud illiquidity ratio"""
        if len(prices) < 20:
            return 0
        
        returns = np.abs(np.diff(prices) / prices[:-1])
        dollar_volumes = prices[1:] * volumes[1:]
        
        # Avoid division by zero
        illiquidity = []
        for r, dv in zip(returns, dollar_volumes):
            if dv > 0:
                illiquidity.append(r / dv)
        
        return np.mean(illiquidity[-20:]) * 1e6 if illiquidity else 0
    
    def _calculate_roll_measure(self, prices: np.ndarray) -> float:
        """Calculate Roll's implied spread"""
        if len(prices) < 20:
            return 0
        
        returns = np.diff(prices)
        
        # Serial covariance
        cov = np.cov(returns[:-1], returns[1:])[0, 1]
        
        if cov >= 0:
            return 0
        
        # Roll's measure
        spread = 2 * np.sqrt(-cov)
        
        return spread / np.mean(prices[-20:]) * 100
    
    def _ema(self, data: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(data) < period:
            return np.mean(data)
        
        alpha = 2 / (period + 1)
        ema = data[0]
        for price in data[1:]:
            ema = alpha * price + (1 - alpha) * ema
        return ema
    
    async def predict_signal(self, symbol: str) -> MLSignal:
        """Generate ML trading signal"""
        try:
            # Load candles
            candles = await fetch_klines(symbol, "15", 200)
            
            # Extract features
            features = await self.extract_features(candles)
            
            # Get feature names for interpretability
            feature_names = self._get_feature_names()
            
            # Make prediction
            if self.model and hasattr(self.model, 'predict_proba'):
                # For trained model
                features_scaled = self.scaler.transform(features) if self.scaler else features
                probabilities = self.model.predict_proba(features_scaled)[0]
                prediction = self.model.predict(features_scaled)[0]
                
                # Get feature importance
                if hasattr(self.model, 'feature_importances_'):
                    importances = self.model.feature_importances_
                    self.feature_importance = dict(zip(feature_names, importances))
            else:
                # Rule-based fallback
                prediction, probabilities = self._rule_based_prediction(features[0])
            
            # Determine signal type
            signal_type = self._map_prediction_to_signal(prediction, probabilities)
            
            # Calculate confidence
            confidence = self._calculate_confidence(probabilities)
            
            # Current price
            current_price = candles[-1]["close"]
            
            # Calculate stop loss and take profits
            volatility = features[0][14]  # Volatility feature index
            stop_loss = current_price * (1 - volatility / 100 * 2)
            take_profits = [
                current_price * (1 + volatility / 100 * 2),
                current_price * (1 + volatility / 100 * 4),
                current_price * (1 + volatility / 100 * 6)
            ]
            
            # Risk score
            risk_score = self._calculate_risk_score(features[0])
            
            # Expected return
            expected_return = self._calculate_expected_return(signal_type, confidence, volatility)
            
            # Holding period
            holding_period = self._estimate_holding_period(signal_type, volatility)
            
            # Create signal
            signal = MLSignal(
                timestamp=datetime.now(),
                symbol=symbol,
                signal=signal_type,
                confidence=confidence,
                entry_price=current_price,
                stop_loss=stop_loss,
                take_profit=take_profits,
                features=dict(zip(feature_names[:10], features[0][:10])),  # Top 10 features
                risk_score=risk_score,
                expected_return=expected_return,
                holding_period=holding_period
            )
            
            # Store prediction
            self.prediction_history.append({
                "timestamp": signal.timestamp.isoformat(),
                "symbol": symbol,
                "signal": signal_type.name,
                "confidence": confidence,
                "price": current_price
            })
            
            return signal
            
        except Exception as e:
            log.error(f"ML prediction error: {e}")
            raise
    
    def _get_feature_names(self) -> List[str]:
        """Get feature names"""
        return [
            "RSI", "MACD", "Bollinger_Position", "Stochastic", "ATR",
            "OBV", "VWAP_Deviation", "Momentum", "ROC", "Williams_R",
            "Volume_Ratio", "MFI", "A/D_Line", "Volume_Momentum",
            "Volatility", "Keltner_Position", "Donchian_Position", "ATR_Percent",
            "Double_Top", "Double_Bottom", "Head_Shoulders", "Triangle",
            "Fractal_Dimension", "Hurst_Exponent",
            "Market_Regime", "Trend_Strength", "SR_Distance", "Pivot_Position",
            "Bid_Ask_Spread", "Kyle_Lambda", "Amihud_Illiquidity", "Roll_Measure"
        ]
    
    def _rule_based_prediction(self, features: np.ndarray) -> Tuple[int, np.ndarray]:
        """Rule-based prediction when ML model is not available"""
        rsi = features[0]
        macd = features[1]
        bollinger_pos = features[2]
        volume_ratio = features[10]
        trend_strength = features[25]
        
        score = 0
        
        # RSI rules
        if rsi < 30:
            score += 2
        elif rsi < 40:
            score += 1
        elif rsi > 70:
            score -= 2
        elif rsi > 60:
            score -= 1
        
        # MACD rules
        if macd > 0:
            score += 1
        else:
            score -= 1
        
        # Bollinger rules
        if bollinger_pos < 0.2:
            score += 1
        elif bollinger_pos > 0.8:
            score -= 1
        
        # Volume confirmation
        if volume_ratio > 1.5:
            score = int(score * 1.2)
        
        # Trend strength
        if abs(trend_strength) > 2:
            score = int(score * 1.3)
        
        # Map score to prediction
        if score >= 3:
            prediction = 2  # Strong buy
            probabilities = np.array([0.05, 0.05, 0.1, 0.2, 0.6])
        elif score >= 1:
            prediction = 1  # Buy
            probabilities = np.array([0.1, 0.1, 0.2, 0.4, 0.2])
        elif score <= -3:
            prediction = -2  # Strong sell
            probabilities = np.array([0.6, 0.2, 0.1, 0.05, 0.05])
        elif score <= -1:
            prediction = -1  # Sell
            probabilities = np.array([0.2, 0.4, 0.2, 0.1, 0.1])
        else:
            prediction = 0  # Neutral
            probabilities = np.array([0.1, 0.2, 0.4, 0.2, 0.1])
        
        return prediction, probabilities
    
    def _map_prediction_to_signal(self, prediction: int, probabilities: np.ndarray) -> SignalType:
        """Map prediction to signal type"""
        if prediction == 2:
            return SignalType.STRONG_BUY
        elif prediction == 1:
            return SignalType.BUY
        elif prediction == -1:
            return SignalType.SELL
        elif prediction == -2:
            return SignalType.STRONG_SELL
        else:
            return SignalType.NEUTRAL
    
    def _calculate_confidence(self, probabilities: np.ndarray) -> float:
        """Calculate prediction confidence"""
        # Confidence based on probability distribution
        max_prob = np.max(probabilities)
        entropy = -np.sum(probabilities * np.log(probabilities + 1e-10))
        
        # Normalize entropy to [0, 1]
        max_entropy = -np.log(1 / len(probabilities))
        confidence = (1 - entropy / max_entropy) * max_prob
        
        return confidence
    
    def _calculate_risk_score(self, features: np.ndarray) -> float:
        """Calculate risk score based on features"""
        volatility = features[14]
        atr_percent = features[17]
        bid_ask_spread = features[28]
        illiquidity = features[30]
        
        # Normalize and combine risk factors
        risk = (
            volatility / 100 * 0.3 +
            atr_percent / 10 * 0.2 +
            bid_ask_spread * 0.2 +
            illiquidity / 10 * 0.3
        )
        
        return min(max(risk, 0), 1)
    
    def _calculate_expected_return(self, signal: SignalType, confidence: float, volatility: float) -> float:
        """Calculate expected return"""
        base_return = {
            SignalType.STRONG_BUY: 0.05,
            SignalType.BUY: 0.03,
            SignalType.NEUTRAL: 0,
            SignalType.SELL: -0.03,
            SignalType.STRONG_SELL: -0.05
        }
        
        expected = base_return.get(signal, 0)
        
        # Adjust for confidence and volatility
        expected *= confidence
        expected *= (1 + volatility / 100)
        
        return expected
    
    def _estimate_holding_period(self, signal: SignalType, volatility: float) -> int:
        """Estimate optimal holding period in minutes"""
        base_period = {
            SignalType.STRONG_BUY: 240,  # 4 hours
            SignalType.BUY: 120,  # 2 hours
            SignalType.NEUTRAL: 60,  # 1 hour
            SignalType.SELL: 120,
            SignalType.STRONG_SELL: 240
        }
        
        period = base_period.get(signal, 60)
        
        # Adjust for volatility
        if volatility > 5:
            period = int(period * 0.7)  # Shorter holding in high volatility
        elif volatility < 2:
            period = int(period * 1.3)  # Longer holding in low volatility
        
        return period
    
    def train_model(self, training_data: List[Dict], labels: List[int]):
        """Train the ML model"""
        if not training_data:
            raise ValueError("No training data provided")
        
        log.info(f"Training model with {len(training_data)} samples")
        
        # Prepare features
        X = np.array([d["features"] for d in training_data])
        y = np.array(labels)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        
        # Calculate feature importance
        if hasattr(self.model, 'feature_importances_'):
            feature_names = self._get_feature_names()
            self.feature_importance = dict(zip(feature_names, self.model.feature_importances_))
        
        log.info("Model training completed")
    
    def save_model(self, path: str):
        """Save trained model"""
        if not self.model:
            raise ValueError("No model to save")
        
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "feature_importance": self.feature_importance,
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "version": "1.0"
            }
        }, path)
        
        log.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load trained model"""
        try:
            data = joblib.load(path)
            self.model = data["model"]
            self.scaler = data["scaler"]
            self.feature_importance = data["feature_importance"]
            
            log.info(f"Model loaded from {path}")
        except Exception as e:
            log.error(f"Failed to load model: {e}")
            self.initialize_model()
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get model performance metrics"""
        if not self.prediction_history:
            return {}
        
        # Calculate metrics from prediction history
        total_predictions = len(self.prediction_history)
        
        # Signal distribution
        signal_counts = {}
        confidence_values = []
        
        for pred in self.prediction_history:
            signal = pred["signal"]
            signal_counts[signal] = signal_counts.get(signal, 0) + 1
            confidence_values.append(pred["confidence"])
        
        return {
            "total_predictions": total_predictions,
            "signal_distribution": signal_counts,
            "average_confidence": np.mean(confidence_values) if confidence_values else 0,
            "confidence_std": np.std(confidence_values) if confidence_values else 0,
            "top_features": sorted(
                self.feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10] if self.feature_importance else []
        }
