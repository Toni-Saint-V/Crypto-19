"""
ML Service for Training and Prediction
Handles model training, prediction, and online learning
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from core.ml.ml_strategy import AdvancedMLStrategy
from web.bybit_client import get_klines

log = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "anton_model.pkl")


class MLService:
    """Service for ML model training and prediction"""
    
    def __init__(self):
        self.model = AdvancedMLStrategy(model_path=MODEL_PATH if os.path.exists(MODEL_PATH) else None)
        self.model_path = MODEL_PATH
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    async def train(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "15m",
        limit: int = 500,
        use_backtest_data: bool = False,
        backtest_trades: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Train ML model using historical or backtest data.
        
        Args:
            symbol: Trading pair symbol
            interval: Timeframe interval
            limit: Number of candles to use
            use_backtest_data: Whether to use backtest results for training
            backtest_trades: List of backtest trades for training labels
        
        Returns:
            Training result dictionary
        """
        try:
            # Fetch historical data
            candles = get_klines(symbol=symbol, interval=interval, limit=limit)
            
            if isinstance(candles, dict) and 'error' in candles:
                return {"error": candles['error']}
            
            if len(candles) < 50:
                return {"error": "Insufficient data for training (need at least 50 candles)"}
            
            # Prepare features
            features_list = []
            labels = []
            
            # Extract features from candles
            for i in range(50, len(candles)):
                candle_window = candles[i-50:i+1]
                try:
                    features = await self.model.extract_features(candle_window)
                    features_list.append(features)
                    
                    # Generate labels based on next candle movement
                    if i < len(candles) - 1:
                        current_close = candles[i]['close']
                        next_close = candles[i+1]['close']
                        price_change = (next_close - current_close) / current_close
                        
                        # Label: 1 for buy (price goes up), 0 for sell (price goes down)
                        label = 1 if price_change > 0.001 else 0  # 0.1% threshold
                        labels.append(label)
                except Exception as e:
                    log.warning(f"Error extracting features at index {i}: {e}")
                    continue
            
            if len(features_list) == 0:
                return {"error": "Failed to extract features from data"}
            
            # If using backtest data, adjust labels based on trade results
            if use_backtest_data and backtest_trades:
                # Map backtest trades to labels
                # This is a simplified approach - in production, you'd want more sophisticated mapping
                for trade in backtest_trades:
                    if trade.get('result_R', 0) > 0:
                        # Winning trade - positive label
                        pass  # Labels already set based on price movement
            
            # Prepare training data
            training_data = [{"features": f} for f in features_list[:len(labels)]]
            
            # Train model
            self.model.train_model(training_data, labels[:len(training_data)])
            
            # Save model
            self.model.save_model(self.model_path)
            
            return {
                "status": "success",
                "message": "Model trained successfully",
                "samples": len(training_data),
                "model_path": self.model_path,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            log.error(f"Error training model: {e}")
            return {"error": str(e)}
    
    async def predict(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "15m",
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Get ML prediction for next candle.
        
        Args:
            symbol: Trading pair symbol
            interval: Timeframe interval
            limit: Number of candles to use for prediction
        
        Returns:
            Prediction dictionary with signal and confidence
        """
        try:
            # Fetch recent candles
            candles = get_klines(symbol=symbol, interval=interval, limit=limit)
            
            if isinstance(candles, dict) and 'error' in candles:
                return {"error": candles['error']}
            
            if len(candles) < 50:
                return {"error": "Insufficient data for prediction (need at least 50 candles)"}
            
            # Extract features from most recent candles
            recent_candles = candles[-51:]  # Last 51 candles for feature extraction
            features = await self.model.extract_features(recent_candles)
            
            # Scale features
            if self.model.scaler is None:
                return {"error": "Model not trained. Please train the model first."}
            
            features_scaled = self.model.scaler.transform([features])
            
            # Get prediction
            if self.model.model is None:
                return {"error": "Model not initialized. Please train the model first."}
            
            prediction = self.model.model.predict(features_scaled)[0]
            probabilities = self.model.model.predict_proba(features_scaled)[0]
            
            # Get confidence (probability of predicted class)
            confidence = float(max(probabilities)) * 100
            
            # Map prediction to signal
            signal_map = {1: "BUY", 0: "SELL"}
            signal = signal_map.get(prediction, "NEUTRAL")
            
            # Get current price
            current_price = candles[-1]['close']
            
            return {
                "symbol": symbol,
                "timeframe": interval,
                "signal": signal,
                "confidence": round(confidence, 2),
                "current_price": current_price,
                "timestamp": datetime.now().isoformat(),
                "probabilities": {
                    "buy": round(float(probabilities[1] if len(probabilities) > 1 else 0) * 100, 2),
                    "sell": round(float(probabilities[0] if len(probabilities) > 0 else 0) * 100, 2)
                }
            }
            
        except Exception as e:
            log.error(f"Error making prediction: {e}")
            return {"error": str(e)}
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        model_exists = os.path.exists(self.model_path)
        
        info = {
            "model_path": self.model_path,
            "model_exists": model_exists,
            "model_initialized": self.model.model is not None
        }
        
        if model_exists and self.model.model is not None:
            try:
                metrics = self.model.get_performance_metrics()
                info.update(metrics)
            except Exception:
                pass
        
        return info

