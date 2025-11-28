import time
from typing import Dict, List

from core.backtest.engine import get_last_equity_curve

class AnalyticsEngine:
    def get_equity_curve(self) -> Dict:
        """
        Отдаём кривую депозита последнего бэктеста.
        Если бэктеста ещё не было — рисуем плоскую линию на 10 000 USDT.
        """
        series: List[Dict] = get_last_equity_curve()

        if not series:
            now = int(time.time())
            base = 10_000.0
            series = [
                {"time": now - 60 * (60 - i), "equity": base}
                for i in range(60)
            ]

        return {
            "series": series,
            "meta": {"source": "backtest" if get_last_equity_curve() else "mock"},
        }
