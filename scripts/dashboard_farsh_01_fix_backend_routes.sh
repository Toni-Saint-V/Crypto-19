#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 - << 'PY'
from __future__ import annotations
import re
from pathlib import Path

p = Path("server.py")
txt = p.read_text(encoding="utf-8", errors="ignore")

# 1) Remove the placeholder duplicate block:
# @app.get("/api/backtest")
# @app.post("/api/backtest/run")
# async def api_backtest_run(request: Request):
#     # Логика запуска бэктеста
#     return {"status": "Backtest started"}
block_re = re.compile(
    r'\n@app\.get\("/api/backtest"\)\s*'
    r'\n@app\.post\("/api/backtest/run"\)\s*'
    r'\nasync def api_backtest_run\(request:\s*Request\):\s*'
    r'\n\s*#\s*Логика запуска бэктеста\s*'
    r'\n\s*return\s*\{"status":\s*"Backtest started"\}\s*'
    r'(?=\n)',  # keep following content
    re.MULTILINE
)

new_txt, n = block_re.subn("\n", txt)
if n != 1:
    raise SystemExit(f"ERROR: expected to remove 1 placeholder block, removed {n}. Abort.")

txt = new_txt

# 2) Ensure legacy mock is reachable via GET /api/backtest (optional but useful for UI dev)
# If legacy exists and isn't decorated, add @app.get("/api/backtest") right above it.
needle = "async def api_backtest_legacy():"
idx = txt.find(needle)
if idx == -1:
    raise SystemExit("ERROR: api_backtest_legacy not found. Abort.")

before = txt[:idx]
after = txt[idx:]

# Look back a little to see if a decorator already exists immediately above legacy
tail = before[-200:]
if '@app.get("/api/backtest")' not in tail:
    # Insert decorator with a blank line before for readability if needed
    insert = '@app.get("/api/backtest")\n'
    # Ensure there's exactly one blank line before decorator
    if not before.endswith("\n\n"):
        if before.endswith("\n"):
            before = before + "\n"
        else:
            before = before + "\n\n"
    txt = before + insert + after

# 3) Final safety checks
post_count = len(re.findall(r'@app\.post\("/api/backtest/run"\)', txt))
if post_count != 1:
    raise SystemExit(f"ERROR: expected exactly 1 @app.post('/api/backtest/run'), got {post_count}. Abort.")

# Also avoid duplicate function name collisions (should be only one 'async def api_backtest_run')
run_def_count = len(re.findall(r'async def api_backtest_run\(', txt))
if run_def_count != 1:
    raise SystemExit(f"ERROR: expected exactly 1 api_backtest_run def, got {run_def_count}. Abort.")

p.write_text(txt, encoding="utf-8")
print("OK: cleaned duplicate backtest routes in server.py")
PY

echo ""
echo "VERIFY: backtest routes occurrences"
grep -n '@app.post("/api/backtest/run")' -n server.py || true
grep -n '@app.get("/api/backtest")' -n server.py || true

echo ""
echo "VERIFY: python compile"
python3 -m compileall server.py core >/dev/null
echo "OK: compileall"
