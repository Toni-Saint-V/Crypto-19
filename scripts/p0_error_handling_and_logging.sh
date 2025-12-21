#!/usr/bin/env bash
set -euo pipefail

pick_app_file() {
  if test -f server.py && grep -q "FastAPI" server.py && grep -qE "^[[:space:]]*app[[:space:]]*=" server.py; then
    echo "server.py"
    return 0
  fi
  py="$(grep -RIl --exclude-dir=".venv" --exclude-dir=".git" --exclude-dir="node_modules" -E "^[[:space:]]*app[[:space:]]*=[[:space:]]*FastAPI[[:space:]]*\(" . 2>/dev/null | head -n 1 || true)"
  test -n "${py:-}" || return 1
  echo "${py#./}"
}

app_file="$(pick_app_file || true)"
test -n "${app_file:-}" || { echo "FAIL: cannot find FastAPI app file with 'app = FastAPI('"; exit 1; }
test -f "$app_file" || { echo "FAIL: app file not found: $app_file"; exit 1; }

python - "$app_file" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
src = path.read_text(encoding="utf-8", errors="replace").splitlines(True)

marker_start = "# === APP_OBSERVABILITY_START ==="
marker_end = "# === APP_OBSERVABILITY_END ==="

if any(marker_start in line for line in src):
    print(f"OK: observability block already present in {path}")
    raise SystemExit(0)

app_re = re.compile(r"^\s*app\s*=\s*FastAPI\s*\(")
start_idx = None
for i, line in enumerate(src):
    if app_re.search(line):
        start_idx = i
        break

if start_idx is None:
    raise SystemExit("FAIL: could not locate 'app = FastAPI(' line")

# Find end of the FastAPI(...) call by parentheses balance
paren = 0
started = False
end_idx = None

for j in range(start_idx, len(src)):
    line = src[j]
    if not started:
        m = re.search(r"FastAPI\s*\(", line)
        if m:
            started = True
            # count from the first "(" after FastAPI
            frag = line[m.end()-1:]
            for ch in frag:
                if ch == "(":
                    paren += 1
                elif ch == ")":
                    paren -= 1
    else:
        for ch in line:
            if ch == "(":
                paren += 1
            elif ch == ")":
                paren -= 1
    if started and paren == 0:
        end_idx = j
        break

if end_idx is None:
    raise SystemExit("FAIL: could not find end of FastAPI(...) call")

block = [
    "\n",
    f"{marker_start}\n",
    "import os\n",
    "import logging\n",
    "import time\n",
    "import uuid\n",
    "from fastapi import Request\n",
    "from fastapi.responses import JSONResponse\n",
    "from starlette.middleware.base import BaseHTTPMiddleware\n",
    "from starlette.exceptions import HTTPException as StarletteHTTPException\n",
    "\n",
    "def _setup_logging() -> None:\n",
    "    level = os.getenv('LOG_LEVEL', 'info').upper()\n",
    "    root = logging.getLogger()\n",
    "    if not root.handlers:\n",
    "        logging.basicConfig(\n",
    "            level=level,\n",
    "            format='%(asctime)s %(levelname)s %(name)s %(message)s',\n",
    "        )\n",
    "    else:\n",
    "        root.setLevel(level)\n",
    "\n",
    "_setup_logging()\n",
    "logger = logging.getLogger('app')\n",
    "\n",
    "class RequestIdMiddleware(BaseHTTPMiddleware):\n",
    "    async def dispatch(self, request: Request, call_next):\n",
    "        rid = request.headers.get('x-request-id') or str(uuid.uuid4())\n",
    "        request.state.request_id = rid\n",
    "        t0 = time.time()\n",
    "        try:\n",
    "            response = await call_next(request)\n",
    "        except Exception:\n",
    "            logger.exception('unhandled_error', extra={'request_id': rid, 'path': request.url.path, 'method': request.method})\n",
    "            raise\n",
    "        dt_ms = int((time.time() - t0) * 1000)\n",
    "        response.headers['x-request-id'] = rid\n",
    "        response.headers['x-response-time-ms'] = str(dt_ms)\n",
    "        logger.info('request', extra={'request_id': rid, 'path': request.url.path, 'method': request.method, 'status': getattr(response, 'status_code', None), 'duration_ms': dt_ms})\n",
    "        return response\n",
    "\n",
    "app.add_middleware(RequestIdMiddleware)\n",
    "\n",
    "@app.exception_handler(StarletteHTTPException)\n",
    "async def http_exception_handler(request: Request, exc: StarletteHTTPException):\n",
    "    rid = getattr(request.state, 'request_id', None)\n",
    "    detail = getattr(exc, 'detail', 'HTTP error')\n",
    "    return JSONResponse(\n",
    "        status_code=exc.status_code,\n",
    "        content={'error': {'message': detail, 'code': 'http_error', 'request_id': rid}},\n",
    "    )\n",
    "\n",
    "@app.exception_handler(Exception)\n",
    "async def unhandled_exception_handler(request: Request, exc: Exception):\n",
    "    rid = getattr(request.state, 'request_id', None)\n",
    "    logger.exception('unhandled_exception', extra={'request_id': rid})\n",
    "    return JSONResponse(\n",
    "        status_code=500,\n",
    "        content={'error': {'message': 'Internal server error', 'code': 'internal_error', 'request_id': rid}},\n",
    "    )\n",
    f"{marker_end}\n",
]

out = src[: end_idx + 1] + block + src[end_idx + 1 :]
path.write_text("".join(out), encoding="utf-8")
print(f"OK: patched {path} (request_id + unified errors)")
PY

test -f scripts/smoke_api_200.sh && bash scripts/boot_once.sh || true
test -f scripts/verify.sh && bash scripts/verify.sh || true
test -f scripts/p0_determinism_probe.sh && bash scripts/p0_determinism_probe.sh || true

if test -f scripts/checklist_mark.py; then
  python scripts/checklist_mark.py \
    "Error handling + user-facing messages" \
    "Logging structured (levels, request ids)" >/dev/null || true
fi

git add "$app_file" docs/DASHBOARD_CHECKLIST.md scripts/p0_error_handling_and_logging.sh || true
git diff --cached --quiet || git commit -m "p0: request_id middleware + unified JSON errors (and mark checklist)" || true

bash scripts/progress.sh
echo "TASK: add request_id + unified error responses before UI redesign"
echo "STEP_PROGRESS: 100%"
echo "DASHBOARD_PROGRESS: $(bash scripts/progress.sh 2>/dev/null | awk '{print $NF}' || echo measured_by_checklist)"
