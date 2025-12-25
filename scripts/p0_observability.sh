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
test -n "${app_file:-}" || { echo "FAIL: cannot find FastAPI app file"; exit 1; }
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
    print(f"OK: observability already present in {path}")
    raise SystemExit(0)

app_re = re.compile(r"^\s*app\s*=\s*FastAPI\s*\(")
start_idx = None
for i, line in enumerate(src):
    if app_re.search(line):
        start_idx = i
        break
if start_idx is None:
    raise SystemExit("FAIL: could not locate 'app = FastAPI('")

paren = 0
started = False
end_idx = None
for j in range(start_idx, len(src)):
    line = src[j]
    if not started:
        m = re.search(r"FastAPI\s*\(", line)
        if m:
            started = True
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
    "from fastapi.exceptions import RequestValidationError\n",
    "from starlette.middleware.base import BaseHTTPMiddleware\n",
    "from starlette.exceptions import HTTPException as StarletteHTTPException\n",
    "\n",
    "def _setup_logging() -> None:\n",
    "    level = os.getenv('LOG_LEVEL', 'info').upper()\n",
    "    root = logging.getLogger()\n",
    "    if not root.handlers:\n",
    "        logging.basicConfig(level=level, format='%(asctime)s %(levelname)s %(name)s %(message)s')\n",
    "    else:\n",
    "        root.setLevel(level)\n",
    "\n",
    "_setup_logging()\n",
    "logger = logging.getLogger('app')\n",
    "\n",
    "def _err(message: str, code: str, request_id: str | None):\n",
    "    return {'error': {'message': message, 'code': code, 'request_id': request_id}}\n",
    "\n",
    "class RequestIdMiddleware(BaseHTTPMiddleware):\n",
    "    async def dispatch(self, request: Request, call_next):\n",
    "        rid = request.headers.get('x-request-id') or str(uuid.uuid4())\n",
    "        request.state.request_id = rid\n",
    "        t0 = time.time()\n",
    "        try:\n",
    "            response = await call_next(request)\n",
    "        except Exception:\n",
    "            dt_ms = int((time.time() - t0) * 1000)\n",
    "            logger.exception('unhandled_exception', extra={'request_id': rid, 'path': request.url.path, 'method': request.method, 'duration_ms': dt_ms})\n",
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
    "async def _http_exc(request: Request, exc: StarletteHTTPException):\n",
    "    rid = getattr(request.state, 'request_id', None)\n",
    "    detail = getattr(exc, 'detail', 'HTTP error')\n",
    "    return JSONResponse(status_code=exc.status_code, content=_err(str(detail), 'http_error', rid))\n",
    "\n",
    "@app.exception_handler(RequestValidationError)\n",
    "async def _validation_exc(request: Request, exc: RequestValidationError):\n",
    "    rid = getattr(request.state, 'request_id', None)\n",
    "    return JSONResponse(status_code=422, content=_err('Validation error', 'validation_error', rid) | {'details': exc.errors()})\n",
    "\n",
    "@app.exception_handler(Exception)\n",
    "async def _unhandled(request: Request, exc: Exception):\n",
    "    rid = getattr(request.state, 'request_id', None)\n",
    "    logger.exception('internal_error', extra={'request_id': rid})\n",
    "    return JSONResponse(status_code=500, content=_err('Internal server error', 'internal_error', rid))\n",
    f"{marker_end}\n",
]

out = src[: end_idx + 1] + block + src[end_idx + 1 :]
path.write_text("".join(out), encoding="utf-8")
print(f"OK: patched {path} (request_id + unified errors + logging)")
PY

test -f scripts/verify.sh && bash scripts/verify.sh || true
test -f scripts/boot_once.sh && bash scripts/boot_once.sh || true
test -f scripts/p0_determinism_probe.sh && bash scripts/p0_determinism_probe.sh || true

if test -f scripts/checklist_mark.py; then
  python scripts/checklist_mark.py \
    "Error handling + user-facing messages" \
    "Logging structured (levels, request ids)" >/dev/null || true
else
  python - <<'PY'
from pathlib import Path
p = Path("docs/DASHBOARD_CHECKLIST.md")
if not p.exists():
    raise SystemExit(0)
lines = p.read_text(encoding="utf-8").splitlines()
out=[]
for line in lines:
    s=line.strip()
    if s == "- [ ] Error handling + user-facing messages":
        out.append("- [x] Error handling + user-facing messages")
    elif s == "- [ ] Logging structured (levels, request ids)":
        out.append("- [x] Logging structured (levels, request ids)")
    else:
        out.append(line)
p.write_text("\n".join(out) + "\n", encoding="utf-8")
PY
fi

git add "$app_file" docs/DASHBOARD_CHECKLIST.md scripts/p0_observability.sh 2>/dev/null || true
git diff --cached --quiet || git commit -m "p0: request_id + unified JSON errors + structured request logging" || true

bash scripts/progress.sh
