from __future__ import annotations

from typing import List
from .contract import FeatureVector, ScoreOutput

def score_from_features(fv: FeatureVector) -> ScoreOutput:
    f = fv.features or {}
    explain: List[str] = []
    tags: List[str] = []

    quality = 50.0
    risk = 50.0
    conf = 0.5

    if f.get("is_live", 0.0) >= 1.0:
        tags.append("LIVE")
        risk += 10.0
        explain.append("LIVE mode: risk posture increased.")
    else:
        tags.append("SIM")

    vol = float(f.get("volatility", 0.0) or 0.0)
    if vol > 0:
        quality += min(15.0, vol * 5.0)
        risk += min(20.0, vol * 6.0)
        explain.append(f"volatility affects quality/risk (vol={vol:.3f})")

    tr = float(f.get("trend_strength", 0.0) or 0.0)
    if tr > 0:
        quality += min(20.0, tr * 8.0)
        conf += min(0.25, tr * 0.1)
        tags.append("TREND")
        explain.append(f"trend supports confidence (trend={tr:.3f})")

    if f.get("has_symbol", 0.0) < 1.0:
        quality -= 5.0
        conf -= 0.1
        explain.append("missing symbol reduces confidence")
    if f.get("has_timeframe", 0.0) < 1.0:
        quality -= 5.0
        conf -= 0.1
        explain.append("missing timeframe reduces confidence")

    quality = max(0.0, min(100.0, quality))
    risk = max(0.0, min(100.0, risk))
    conf = max(0.0, min(1.0, conf))

    if quality >= 70:
        tags.append("HIGH_QUALITY")
    if risk >= 70:
        tags.append("HIGH_RISK")

    return ScoreOutput(
        signalQuality=quality,
        riskScore=risk,
        confidence=conf,
        tags=tags,
        explain=explain[:8],
    )
