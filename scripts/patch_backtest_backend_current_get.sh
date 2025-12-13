#!/usr/bin/env bash
set -u -o pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 0

S="$ROOT/server.py"
if [ ! -f "$S" ]; then
  echo "WARN: missing file: $S"
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "WARN: python3 not found; cannot patch $S"
  exit 0
fi

python3 - "$S" << 'PY'
import sys, re, pathlib

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")
orig = s

def find_all(pattern: str, text: str):
    return [m.start() for m in re.finditer(pattern, text, flags=re.MULTILINE)]

# 1) Deduplicate POST /api/backtest/run (rename 2nd+ to legacy)
post_pat = r'@app\.post\(\s*["\']/api/backtest/run["\']\s*\)'
post_pos = list(re.finditer(post_pat, s, flags=re.MULTILINE))
if len(post_pos) >= 2:
    # keep first, rename the rest
    for m in post_pos[1:]:
        start, end = m.span()
        s = s[:start] + '@app.post("/api/backtest/run_legacy")' + s[end:]

# 2) Rename existing GET /api/backtest to /api/backtest/mock and inject new GET /api/backtest
get_pat = r'@app\.get\(\s*["\']/api/backtest["\']\s*\)'
if re.search(get_pat, s, flags=re.MULTILINE):
    # If already patched, do nothing
    if '@app.get("/api/backtest/mock")' in s and 'def api_backtest_current' in s:
        pass
    else:
        # capture the mock handler function name (must be async def)
        m = re.search(get_pat + r'\s*\n\s*async\s+def\s+([A-Za-z_]\w*)\s*\(', s, flags=re.MULTILINE)
        mock_name = m.group(1) if m else None

        # rename first occurrence to /api/backtest/mock
        s = re.sub(get_pat, '@app.get("/api/backtest/mock")', s, count=1, flags=re.MULTILINE)

        # inject new endpoint right before the renamed mock decorator
        anchor = '@app.get("/api/backtest/mock")'
        idx = s.find(anchor)
        if idx != -1 and mock_name:
            inject = f'''
# BACKTEST_CURRENT_ENDPOINT
@app.get("/api/backtest")
async def api_backtest_current():
    """
    Returns the latest backtest result from last_backtest_context (if present),
    otherwise falls back to the mock endpoint.
    """
    try:
        ctx = globals().get("last_backtest_context") or {{}}
        if isinstance(ctx, dict):
            equity_curve = ctx.get("equity_curve") or []
            trades = ctx.get("trades") or []
            prices = ctx.get("prices") or []
            stats = ctx.get("statistics") or {{}}

            # If we have something real, return it
            if equity_curve or trades:
                # Keep response shape stable for frontend
                if not isinstance(stats, dict):
                    stats = {{}}
                return JSONResponse({{
                    "equity_curve": equity_curve,
                    "prices": prices if prices else ([0 for _ in range(len(equity_curve))] if equity_curve else []),
                    "trades": trades,
                    "statistics": stats,
                }})
    except Exception:
        pass

    return await {mock_name}()

'''
            s = s[:idx] + inject + s[idx:]

changed = (s != orig)
if changed:
    p.write_text(s, encoding="utf-8")
    print("OK: server.py patched (backtest current GET + post dedup)")
else:
    print("INFO: no changes applied (already patched or patterns not found)")
PY

echo ""
echo "CHECK ROUTES:"
grep -n '@app.get("/api/backtest")' "$S" 2>/dev/null || true
grep -n '@app.get("/api/backtest/mock")' "$S" 2>/dev/null || true
grep -n '@app.post("/api/backtest/run")' "$S" 2>/dev/null || true
grep -n '@app.post("/api/backtest/run_legacy")' "$S" 2>/dev/null || true

exit 0
