from __future__ import annotations
from typing import List, Dict

from core.services.fetch_bybit_klines import fetch_klines

_last_summary: Dict = {"status": "idle", "return_pct": 0.0, "trades": 0}
_last_equity_curve: List[Dict] = []

class BacktestEngine:
    """
    Простой backtest:
    - берём mock-свечи
    - стратегия: 3 растущих свечи подряд -> вход в лонг
      3 падающих свечи -> выход из позиции
    - считаем доходность и число сделок, строим equity-curve
    """

    def run(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "1m",
        limit: int = 300,
    ) -> Dict:
        global _last_summary, _last_equity_curve

        candles = fetch_klines(symbol=symbol, interval=interval, limit=limit)
        if not candles:
            _last_summary = {
                "status": "error",
                "message": "no candles",
                "return_pct": 0.0,
                "trades": 0,
            }
            _last_equity_curve = []
            return _last_summary

        equity = 10_000.0
        start_equity = equity
        position = 0          # 0 — нет позиции, 1 — лонг
        entry_price = None
        trades = 0
        equity_curve: List[Dict] = []

        for i, c in enumerate(candles):
            price = c["close"]

            # Паттерн из 3-х свечей
            if i >= 3:
                c1, c2, c3 = candles[i-3:i]
                up = c1["close"] < c2["close"] < c3["close"] < price
                down = c1["close"] > c2["close"] > c3["close"] > price
            else:
                up = down = False

            # Выход из лонга
            if position == 1 and down:
                pnl = (price - entry_price) / entry_price
                equity *= (1 + pnl)
                position = 0
                entry_price = None
                trades += 1

            # Вход в лонг
            if position == 0 and up:
                position = 1
                entry_price = price

            equity_curve.append({"time": c["time"], "equity": round(equity, 2)})

        # Если остались в позиции — закрываемся по последней цене
        if position == 1 and entry_price is not None:
            price = candles[-1]["close"]
            pnl = (price - entry_price) / entry_price
            equity *= (1 + pnl)
            trades += 1
            equity_curve[-1]["equity"] = round(equity, 2)

        return_pct = (equity / start_equity - 1) * 100.0

        _last_summary = {
            "status": "completed",
            "return_pct": round(return_pct, 2),
            "trades": trades,
        }
        _last_equity_curve = equity_curve
        return _last_summary

    def summary(self) -> Dict:
        return _last_summary

def get_last_equity_curve() -> List[Dict]:
    return _last_equity_curve
