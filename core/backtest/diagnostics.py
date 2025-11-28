from typing import Dict, List

def diagnose(result: Dict, equity_curve: List[Dict]) -> Dict:
    """
    Простейшая диагностика результата бэктеста.
    Можно расширить (max drawdown, Sharpe и т.п.).
    """
    if not equity_curve:
        return {"note": "empty equity curve"}

    equities = [p["equity"] for p in equity_curve]
    return {
        "max_equity": max(equities),
        "min_equity": min(equities),
        "trades": result.get("trades", 0),
    }
