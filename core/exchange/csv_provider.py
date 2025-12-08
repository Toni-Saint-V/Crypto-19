"""
CSV Data Provider
Allows importing local CSV files for backtesting
"""

import pandas as pd
import os
from typing import List, Dict, Any, Optional
from core.exchange.exchange_provider import ExchangeProvider


class CSVExchangeProvider(ExchangeProvider):
    """CSV file provider for local data import"""
    
    def __init__(self, csv_file_path: Optional[str] = None):
        """
        Initialize CSV provider
        
        Args:
            csv_file_path: Path to CSV file (optional, can be set later)
        """
        self.csv_file_path = csv_file_path
        self.data_cache: Optional[pd.DataFrame] = None
    
    def load_csv(self, file_path: str) -> bool:
        """
        Load CSV file
        
        Expected CSV format:
        - timestamp (or time): Unix timestamp or datetime string
        - open: Open price
        - high: High price
        - low: Low price
        - close: Close price
        - volume: Volume (optional)
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            df = pd.read_csv(file_path)
            
            # Normalize column names
            column_mapping = {
                'timestamp': 'time',
                'Timestamp': 'time',
                'TIME': 'time',
                'Date': 'time',
                'date': 'time',
            }
            df.rename(columns=column_mapping, inplace=True)
            
            # Ensure required columns exist
            required_cols = ['time', 'open', 'high', 'low', 'close']
            if not all(col in df.columns for col in required_cols):
                raise ValueError(f"CSV must contain columns: {required_cols}")
            
            # Convert time to timestamp if needed
            if df['time'].dtype == 'object':
                df['time'] = pd.to_datetime(df['time']).astype('int64') // 10**9
            
            # Add volume if missing
            if 'volume' not in df.columns:
                df['volume'] = 0.0
            
            self.data_cache = df
            self.csv_file_path = file_path
            return True
            
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return False
    
    async def fetch_klines(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """
        Fetch klines from loaded CSV data
        
        Args:
            symbol: Ignored (for compatibility)
            timeframe: Ignored (for compatibility)
            limit: Number of candles to return
            
        Returns:
            List of candle dictionaries
        """
        if self.data_cache is None or self.data_cache.empty:
            return []
        
        # Get last N rows
        df = self.data_cache.tail(limit)
        
        candles = []
        for _, row in df.iterrows():
            candles.append(self.normalize_candle({
                "time": int(row['time']),
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": float(row.get('volume', 0))
            }))
        
        return candles
    
    async def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """CSV provider doesn't support order placement"""
        return {"error": "CSV provider is read-only for backtesting"}
    
    async def get_balance(self, asset: str = "USDT") -> float:
        """CSV provider doesn't support balance queries"""
        return 0.0
    
    def get_exchange_name(self) -> str:
        return "Local CSV"

