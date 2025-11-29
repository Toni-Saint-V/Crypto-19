from dataclasses import dataclass
from typing import List, Dict, Any

from core.services.fetch_bybit_klines import fetch_klines


@dataclass
class Trade:
    entry_index: int
    exit_index: int
    side: str
    entry_price: float
    exit_price: float
    pnl_pct: float


class BacktestEngine:
    """
    Простой бэктест:
    - берём последние N свечей по symbol/tf
    - считаем SMA(10) и SMA(30)
    - входим LONG, когда fast > slow (и позиции нет)
    - выходим, когда fast < slow
    - считаем PnL в процентах, суммируем по всем сделкам
    """
    def __init__(self) -> None:
        self.last_result: Dict[str, Any] = {
            "status": "idle",
            "symbol": "BTCUSDT",
            "tf": "1m",
            "total_pnl_pct": 0.0,
            "trades_count": 0,
            "trades": [],
            "candles": [],
        }

    def _load_candles(self, symbol: str, tf: str, limit: int = 300) -> List[Dict[str, Any]]:
        raw = fetch_klines(symbol=symbol, interval=tf, limit=limit)
        candles: List[Dict[str, Any]] = []
        for c in raw or []:
            try:
                candles.append(
                    {
                        "time": int(c["time"]),
                        "open": float(c["open"]),
                        "high": float(c["high"]),
                        "low": float(c["low"]),
                        "close": float(c["close"]),
                    }
                )
            except (KeyError, TypeError, ValueError):
                continue
        return candles

    def _sma(self, data: List[float], idx: int
cd ~/cryptobot_pro && \

cat > core/backtest/engine.py << 'EOF'
from dataclasses import dataclass
from typing import List, Dict, Any

from core.services.fetch_bybit_klines import fetch_klines


@dataclass
class Trade:
    entry_index: int
    exit_index: int
    side: str
    entry_price: float
    exit_price: float
    pnl_pct: float


class BacktestEngine:
    """
    Простой бэктест:
    - берём последние N свечей по symbol/tf
    - считаем SMA(10) и SMA(30)
    - входим LONG, когда fast > slow (и позиции нет)
    - выходим, когда fast < slow
    - считаем PnL в процентах, суммируем по всем сделкам
    """
    def __init__(self) -> None:
        self.last_result: Dict[str, Any] = {
            "status": "idle",
            "symbol": "BTCUSDT",
            "tf": "1m",
            "total_pnl_pct": 0.0,
            "trades_count": 0,
            "trades": [],
            "candles": [],
        }

    def _load_candles(self, symbol: str, tf: str, limit: int = 300) -> List[Dict[str, Any]]:
        raw = fetch_klines(symbol=symbol, interval=tf, limit=limit)
        candles: List[Dict[str, Any]] = []
        for c in raw or []:
            try:
                candles.append(
                    {
                        "time": int(c["time"]),
                        "open": float(c["open"]),
                        "high": float(c["high"]),
                        "low": float(c["low"]),
                        "close": float(c["close"]),
                    }
                )
            except (KeyError, TypeError, ValueError):
                continue
        return candles

    def _sma(self, data: List[float], idx: int, window: int) -> float | None:
        if idx + 1 < window:
            return None
        segment = data[idx + 1 - window : idx + 1]
        return sum(segment) / window

    def run(self, symbol: str = "BTCUSDT", tf: str = "1m") -> Dict[str, Any]:
        candles = self._load_candles(symbol, tf, limit=300)
        if len(candles) < 40:
            self.last_result = {
                "status": "no_data",
                "symbol": symbol,
                "tf": tf,
                "total_pnl_pct": 0.0,
                "trades_count": 0,
                "trades": [],
                "candles": candles,
            }
            return self.last_result

        closes = [c["close"] for c in candles]
        trades: List[Trade] = []
        position: Dict[str, Any] | None = None

        for i in range(len(closes)):
            fast = self._sma(closes, i, 10)
            slow = self._sma(closes, i, 30)
            if fast is None or slow is None:
                continue

            # вход в LONG
            if position is None and fast > slow:
                position = {
                    "side": "LONG",
                    "entry_index": i,
                    "entry_price": closes[i],
                }
                continue

            # выход из LONG
            if position is not None and fast < slow:
                entry_index = position["entry_index"]
                entry_price = position["entry_price"]
                exit_index = i
                exit_price = closes[i]
                pnl_pct = (exit_price / entry_price - 1.0) * 100.0
                trades.append(
                    Trade(
                        entry_index=entry_index,
                        exit_index=exit_index,
                        side="LONG",
                        entry_price=round(entry_price, 2),
                        exit_price=round(exit_price, 2),
                        pnl_pct=round(pnl_pct, 2),
                    )
                )
                position = None

        total_pnl = round(sum(t.pnl_pct for t in trades), 2)

        result: Dict[str, Any] = {
            "status": "completed",
            "symbol": symbol,
            "tf": tf,
            "total_pnl_pct": total_pnl,
            "trades_count": len(trades),
            "trades": [
                {
                    "entry_index": t.entry_index,
                    "exit_index": t.exit_index,
                    "side": t.side,
                    "entry_price": t.entry_price,
                    "exit_price": t.exit_price,
                    "pnl_pct": t.pnl_pct,
                }
                for t in trades
            ],
            "candles": candles,
        }
        self.last_result = result
        return result

    def summary(self) -> Dict[str, Any]:
        return self.last_result
