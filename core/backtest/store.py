from __future__ import annotations

import json
import os
import threading
import time
import uuid
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional


@dataclass
class BacktestJob:
    job_id: str
    status: str  # queued|running|done|error
    created_at: float
    updated_at: float
    progress: float
    request: Dict[str, Any]
    result: Optional[Dict[str, Any]]
    error: Optional[str]


class BacktestStore:
    def __init__(self, dir_path: str = "reports/backtests") -> None:
        self._lock = threading.Lock()
        self._jobs: Dict[str, BacktestJob] = {}
        self._dir_path = dir_path
        os.makedirs(self._dir_path, exist_ok=True)

    def create(self, request: Dict[str, Any]) -> BacktestJob:
        now = time.time()
        job = BacktestJob(
            job_id=str(uuid.uuid4()),
            status="queued",
            created_at=now,
            updated_at=now,
            progress=0.0,
            request=request,
            result=None,
            error=None,
        )
        with self._lock:
            self._jobs[job.job_id] = job
        self._persist(job)
        return job

    def set_running(self, job_id: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "running"
            job.updated_at = time.time()
            job.progress = max(job.progress, 0.01)
        self._persist(job)

    def set_progress(self, job_id: str, progress: float) -> None:
        p = min(max(float(progress), 0.0), 1.0)
        with self._lock:
            job = self._jobs[job_id]
            job.updated_at = time.time()
            job.progress = p
        self._persist(job)

    def set_done(self, job_id: str, result: Dict[str, Any]) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "done"
            job.updated_at = time.time()
            job.progress = 1.0
            job.result = result
            job.error = None
        self._persist(job)

    def set_error(self, job_id: str, error: str) -> None:
        with self._lock:
            job = self._jobs[job_id]
            job.status = "error"
            job.updated_at = time.time()
            job.progress = 1.0
            job.result = None
            job.error = (error or "")[:5000]
        self._persist(job)

    def get(self, job_id: str) -> Optional[BacktestJob]:
        with self._lock:
            return self._jobs.get(job_id)

    def _persist(self, job: BacktestJob) -> None:
        path = os.path.join(self._dir_path, f"{job.job_id}.json")
        tmp = f"{path}.tmp_{uuid.uuid4().hex}"
        payload = asdict(job)
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
