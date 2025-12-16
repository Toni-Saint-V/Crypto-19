from __future__ import annotations

from typing import Any, Dict, Optional
from .contract import MLScoreRequest, FeatureVector

def extract_features(req: MLScoreRequest) -> FeatureVector:
    ctx = req.context
    mode = getattr(ctx, "mode", "LIVE")
    symbol = getattr(ctx, "symbol", None) or ""
    tf = getattr(ctx, "timeframe", None) or ""

    f: Dict[str, float] = {}
    f["is_live"] = 1.0 if mode == "LIVE" else 0.0
    f["has_symbol"] = 1.0 if bool(symbol) else 0.0
    f["has_timeframe"] = 1.0 if bool(tf) else 0.0

    m: Optional[Dict[str, Any]] = req.market or None
    if isinstance(m, dict):
        for k in ("volatility", "trend_strength", "spread", "liquidity"):
            v = m.get(k)
            if isinstance(v, (int, float)):
                f[k] = float(v)

    return FeatureVector(features=f)
