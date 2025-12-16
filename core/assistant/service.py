from __future__ import annotations

from typing import List
from .contract import AssistantRequest, AssistantResponse, AssistantAction

def assistant_reply(req: AssistantRequest) -> AssistantResponse:
    ctx = req.context
    mode = getattr(ctx, "mode", "LIVE")
    symbol = getattr(ctx, "symbol", None) or "UNKNOWN"
    tf = getattr(ctx, "timeframe", None) or "UNKNOWN"

    actions: List[AssistantAction] = [
        AssistantAction(type="explain_drawdown", label="Explain drawdown", payload={}),
        AssistantAction(type="why_entries", label="Why entries?", payload={}),
        AssistantAction(type="optimize_params", label="Optimize params", payload={"scope": "safe_suggestions_only"}),
        AssistantAction(type="risk_warnings", label="Risk warnings", payload={"mode": mode}),
    ]

    answer = (
        f"Assistant MVP online. Mode={mode}, Symbol={symbol}, TF={tf}. "
        "Suggestions only. No auto-trading."
    )
    return AssistantResponse(answer=answer, actions=actions)
