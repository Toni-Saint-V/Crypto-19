from __future__ import annotations

from typing import Any, Dict, List, Optional, Literal

try:
    from pydantic import BaseModel, Field
except Exception:  # pragma: no cover
    BaseModel = object  # type: ignore
    def Field(default=None, **kwargs):  # type: ignore
        return default

Mode = Literal["LIVE", "TEST", "BACKTEST"]

class MLContext(BaseModel):  # type: ignore[misc]
    mode: Mode = "LIVE"
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    positions: Optional[List[Dict[str, Any]]] = None
    recentTrades: Optional[List[Dict[str, Any]]] = None
    backtestResult: Optional[Dict[str, Any]] = None

class FeatureVector(BaseModel):  # type: ignore[misc]
    features: Dict[str, float] = Field(default_factory=dict)

class ScoreOutput(BaseModel):  # type: ignore[misc]
    signalQuality: float = 50.0
    riskScore: float = 50.0
    confidence: float = 0.5
    tags: List[str] = Field(default_factory=list)
    explain: List[str] = Field(default_factory=list)

class MLScoreRequest(BaseModel):  # type: ignore[misc]
    context: MLContext = Field(default_factory=MLContext)
    market: Optional[Dict[str, Any]] = None

class MLScoreResponse(BaseModel):  # type: ignore[misc]
    output: ScoreOutput
    featureVector: FeatureVector
