#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

S="$PROJECT_ROOT/server.py"
if [ ! -f "$S" ]; then
  echo "ERROR: not found: $S"
  exit 1
fi

python3 - "$S" << 'PY'
import sys, pathlib, re

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")
orig = s

# 1) Resolve duplicate POST /api/backtest/run by renaming the 2nd occurrence to /api/backtest/run_legacy
post_pat = '@app.post("/api/backtest/run")'
post_idxs = [m.start() for m in re.finditer(re.escape(post_pat), s)]
if len(post_idxs) >= 2:
    # replace only the second occurrence
    first = post_idxs[0]
    second = post_idxs[1]
    s = s[:second] + s[second:].replace(post_pat, '@app.post("/api/backtest/run_legacy")', 1)

# 2) Move legacy GET /api/backtest -> /api/backtest/legacy
get_pat = '@app.get("/api/backtest")'
if get_pat in s and '@app.get("/api/backtest/legacy")' not in s:
    s = s.replace(get_pat, '@app.get("/api/backtest/legacy")', 1)

# 3) Add new GET /api/backtest endpoint that returns last_backtest_context, fallback to legacy
marker = "# BACKTEST_CURRENT_ENDPOINT"
if marker not in s:
    # insert right before the legacy function decorator (now /api/backtest/legacy)
    anchor = '@app.get("/api/backtest/legacy")'
    idx = s.find(anchor)
    if idx != -1:
        inject = f'''
{marker}
@app.get("/api/backtest")
async def api_backtest_current():
    """
    Returns the latest REAL backtest result if available (from last_backtest_context),
    otherwise falls back to legacy mock endpoint.
    """
    global last_backtest_context

    try:
        ctx = last_backtest_context or {{}}

        equity_curve = ctx.get("equity_curve") or []
        trades = ctx.get("trades") or []
        prices = ctx.get("prices") or []

        # Build statistics compatible with frontend expectations
        stats = dict(ctx.get("statistics") or {{}})

        # total_trades
        if "total_trades" not in stats:
            stats["total_trades"] = len(trades)

        # total_return
        if "total_return" not in stats:
            if len(equity_curve) >= 2 and equity_curve[0]:
                stats["total_return"] = round(((equity_curve[-1] - equity_curve[0]) / equity_curve[0]) * 100, 2)
            else:
                stats["total_return"] = 0.0

        # max_drawdown (percent)
        if "max_drawdown" not in stats:
            peak = None
            max_dd = 0.0
            for v in equity_curve:
                try:
                    x = float(v)
                except Exception:
                    continue
                if peak is None or x > peak:
                    peak = x
                if peak and peak > 0:
                    dd = (peak - x) / peak * 100.0
                    if dd > max_dd:
                        max_dd = dd
            stats["max_drawdown"] = round(max_dd, 2)

        # profit_factor (optional; keep 0 if unknown)
        if "profit_factor" not in stats:
            stats["profit_factor"] = float(ctx.get("profit_factor") or 0.0)

        # Ensure arrays exist (frontend usually can handle empty)
        if not prices and equity_curve:
            prices = [0 for _ in range(len(equity_curve))]

        payload = {{
            "equity_curve": equity_curve,
            "prices": prices,
            "trades": trades,
            "statistics": stats,
        }}

        # If no real result yet, fallback to legacy mock
        if not equity_curve and not trades:
            return await api_backtest_legacy()

        return JSONResponse(payload)
    except Exception:
        return await api_backtest_legacy()

'''
        s = s[:idx] + inject + s[idx:]

changed = (s != orig)
if changed:
    p.write_text(s, encoding="utf-8")
    print("OK: server.py patched")
else:
    print("INFO: no changes applied (already patched or anchors not found)")
PY

echo ""
echo "CHECK ROUTES:"
grep -n '@app.get("/api/backtest")' server.py 2>/dev/null || true
grep -n '@app.get("/api/backtest/legacy")' server.py 2>/dev/null || true
grep -n '@app.post("/api/backtest/run")' server.py 2>/dev/null || true
grep -n '@app.post("/api/backtest/run_legacy")' server.py 2>/dev/null || true

exit 0
