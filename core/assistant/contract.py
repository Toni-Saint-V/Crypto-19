from __future__ import annotations

from typing import Any, Dict, List, Optional, Literal

try:
    from pydantic import BaseModel, Field
except Exception:
    BaseModel = object  # type: ignore
    def Field(default=None, **kwargs):  # type: ignore
        return default

Mode = Literal["LIVE", "TEST", "BACKTEST"]
Role = Literal["system", "user", "assistant", "tool"]

class ChatMessage(BaseModel):  # type: ignore[misc]
    role: Role
    content: str
    name: Optional[str] = None

class TradingContext(BaseModel):  # type: ignore[misc]
    mode: Mode = "LIVE"
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    risk: Optional[Dict[str, Any]] = None
    positions: Optional[List[Dict[str, Any]]] = None
    recentTrades: Optional[List[Dict[str, Any]]] = None
    metrics: Optional[Dict[str, Any]] = None
    backtestResult: Optional[Dict[str, Any]] = None

class AssistantAction(BaseModel):  # type: ignore[misc]
    type: str
    label: str
    payload: Dict[str, Any] = Field(default_factory=dict)

class AssistantRequest(BaseModel):  # type: ignore[misc]
    messages: List[ChatMessage] = Field(default_factory=list)
    context: TradingContext = Field(default_factory=TradingContext)

class AssistantResponse(BaseModel):  # type: ignore[misc]
    answer: str
    actions: List[AssistantAction] = Field(default_factory=list)
