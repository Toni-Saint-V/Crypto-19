from typing import List, Dict, Any
from core.services.fetch_bybit_klines import fetch_klines


class BacktestEngine:
    """
    Простейший серверный бэктест:
    - берём свечи через fetch_klines
    - каждые N свечей открываем сделку и закрываем через M свечей
    - считаем PnL, equity-кривую
    - возвращаем:
        - trades: список сделок
        - candles: свечи, по которым считали
        - equity_curve: баланс после каждой сделки
    """

    def __init__(self) -> None:
        self._last_result: Dict[str, Any] = {}

    def _generate_trades(self, candles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        trades: List[Dict[str, Any]] = []
        if not candles:
            return trades

        step = 20   # каждые 20 свечей
        hold = 5    # держим позицию 5 свечей

        for i in range(0, len(candles) - hold, step):
            entry = candles[i]
            exit_ = candles[i + hold]

            entry_price = float(entry["close"])
            exit_price = float(exit_["close"])

            # простая логика: если выросло — считаем, что это LONG, если упало — SHORT
            side = "LONG" if exit_price >= entry_price else "SHORT"

            if side == "LONG":
                pnl_pct = (exit_price / entry_price - 1.0) * 100.0
            else:
                pnl_pct = (entry_price / exit_price - 1.0) * 100.0

            trades.append(
                {
                    "id": len(trades) + 1,
                    "side": side,
                    "entry_index": i,
                    "exit_index": i + hold,
                    "entry_price": round(entry_price, 2),
                    "exit_price": round(exit_price, 2),
                    "pnl_pct": round(pnl_pct, 2),
                }
            )

        return trades

    def run(self, symbol: str = "BTCUSDT", tf: str = "1m") -> Dict[str, Any]:
        # берём те же свечи, что и для графика
        candles = fetch_klines(symbol=symbol, interval=tf, limit=500)

        if not candles:
            self._last_result = {
                "status": "error",
                "error": "no candles",
                "symbol": symbol,
                "tf": tf,
                "trades": [],
                "equity_curve": [],
                "total_pnl_pct": 0.0,
                "trades_count": 0,
                "candles": [],
            }
            return self._last_result

        trades = self._generate_trades(candles)

        # считаем equity по трейдам, стартуем с условных 1000
        balance = 1000.0
        equity_curve = [{"step": 0, "balance": round(balance, 2)}]

        for idx, t in enumerate(trades, start=1):
            balance *= 1.0 + (t["pnl_pct"] / 100.0)
            equity_curve.append({"step": idx, "balance": round(balance, 2)})

        total_pnl_pct = (balance / 1000.0 - 1.0) * 100.0 if trades else 0.0

        result: Dict[str, Any] = {
            "status": "completed",
            "symbol": symbol,
            "tf": tf,
            "trades": trades,
            "equity_curve": equity_curve,
            "total_pnl_pct": round(total_pnl_pct, 2),
            "trades_count": len(trades),
            "candles": candles,
        }

        self._last_result = result
        return result

    def summary(self) -> Dict[str, Any]:
        # для первого захода, когда ещё не жали Run backtest
        if not self._last_result:
            return {
                "status": "idle",
                "symbol": None,
                "tf": None,
                "trades": [],
                "equity_curve": [],
                "total_pnl_pct": 0.0,
                "trades_count": 0,
                "candles": [],
            }
        return self._last_result
