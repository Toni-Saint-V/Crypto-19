from __future__ import annotations

from .contract import MLScoreRequest, MLScoreResponse
from .features import extract_features
from .scorer import score_from_features

def ml_score(req: MLScoreRequest) -> MLScoreResponse:
    fv = extract_features(req)
    out = score_from_features(fv)
    return MLScoreResponse(output=out, featureVector=fv)
