from __future__ import annotations

import threading
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .service import BacktestService
from .store import BacktestStore

router = APIRouter(tags=["backtest"])
_store = BacktestStore()
_service = BacktestService()


class BacktestRequest(BaseModel):
    symbol: str = Field(default="BTCUSDT")
    timeframe: str = Field(default="1h")
    start: Optional[str] = Field(default=None)
    end: Optional[str] = Field(default=None)
    strategy: str = Field(default="buy_and_hold")
    initial_balance: float = Field(default=1000.0, ge=0.0)
    fee_rate: float = Field(default=0.0004, ge=0.0)
    slippage: float = Field(default=0.0002, ge=0.0)
    params: Dict[str, Any] = Field(default_factory=dict)


@router.post("/api/backtest/run")
def run(req: BacktestRequest) -> Dict[str, Any]:
    job = _store.create(request=req.model_dump())

    def work(job_id: str, payload: Dict[str, Any]) -> None:
        try:
            _store.set_running(job_id)
            _store.set_progress(job_id, 0.1)
            result = _service.run(
                symbol=payload["symbol"],
                timeframe=payload["timeframe"],
                start=payload.get("start"),
                end=payload.get("end"),
                strategy=payload.get("strategy", "buy_and_hold"),
                initial_balance=payload.get("initial_balance", 1000.0),
                fee_rate=payload.get("fee_rate", 0.0),
                slippage=payload.get("slippage", 0.0),
                params=payload.get("params", {}) or {},
            )
            _store.set_progress(job_id, 0.95)
            _store.set_done(job_id, result=result)
        except Exception as e:
            _store.set_error(job_id, str(e))

    threading.Thread(target=work, args=(job.job_id, job.request), daemon=True).start()
    return {"job_id": job.job_id, "status": "queued"}


@router.get("/api/backtest/status/{job_id}")
def status(job_id: str) -> Dict[str, Any]:
    job = _store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return {"job_id": job.job_id, "status": job.status, "progress": job.progress, "error": job.error}


@router.get("/api/backtest/result/{job_id}")
def result(job_id: str) -> Dict[str, Any]:
    job = _store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job.status == "error":
        raise HTTPException(status_code=400, detail=job.error or "error")
    if job.status != "done":
        raise HTTPException(status_code=409, detail=f"not ready: {job.status}")
    return job.result or {}
