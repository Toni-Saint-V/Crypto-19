#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

ts="$(date "+%Y%m%d_%H%M%S")"
out="reports/smoke_backtest_${ts}.md"
base="http://127.0.0.1:8000"

log() { printf "%s\n" "$*" | tee -a "$out" >/dev/null; }

log "# SMOKE BACKTEST"
log ""
log "Generated: $(date -Iseconds)"
log "Base: ${base}"
log ""

# Start backend if needed (do not fail hard)
if pgrep -f "python3 server.py" >/dev/null 2>&1; then
  log "INFO: backend already running"
else
  if [ -f "$PROJECT_ROOT/server.py" ]; then
    (python3 server.py >/tmp/cbp_backend.log 2>&1 &) && log "INFO: backend started (log: /tmp/cbp_backend.log)" || log "WARN: failed to start backend (see /tmp/cbp_backend.log if created)"
    sleep 1
  else
    log "WARN: server.py not found, cannot start backend"
  fi
fi

# Decorator duplicate check
if [ -f "$PROJECT_ROOT/server.py" ]; then
  cnt="$(python3 - << 'PY' 2>/dev/null || true
import pathlib
p=pathlib.Path("server.py")
t=p.read_text(errors="ignore")
print(t.count('@app.post("/api/backtest/run")') + t.count("@app.post('/api/backtest/run')"))
PY
)"
  log ""
  log "## server.py decorators count for /api/backtest/run"
  log "- count: ${cnt:-unknown}"
fi

curl_check() {
  name="$1"
  method="$2"
  url="$3"
  data="${4:-}"
  tmp_body="$(mktemp)"
  code="000"

  if [ "$method" = "GET" ]; then
    code="$(curl -sS -m 10 -o "$tmp_body" -w "%{http_code}" "$url" 2>/dev/null || echo "000")"
  else
    code="$(curl -sS -m 15 -o "$tmp_body" -w "%{http_code}" -X "$method" -H "Content-Type: application/json" --data "$data" "$url" 2>/dev/null || echo "000")"
  fi

  log ""
  log "## ${name}"
  log "- ${method} ${url}"
  log "- http: ${code}"
  log "- body (first 80 lines):"
  sed -n "1,80p" "$tmp_body" | sed "s/^/  /" | tee -a "$out" >/dev/null || true
  rm -f "$tmp_body" >/dev/null 2>&1 || true
}

curl_check "dashboard" "GET" "${base}/api/dashboard"
curl_check "backtest list" "GET" "${base}/api/backtest"
curl_check "backtest run empty" "POST" "${base}/api/backtest/run" "{}"

# sample range (last 2 hours)
range_json="$(python3 - << 'PY' 2>/dev/null || true
import datetime, json
now=datetime.datetime.utcnow()
start=now-datetime.timedelta(hours=2)
print(json.dumps({"start": start.isoformat(timespec="seconds")+"Z", "end": now.isoformat(timespec="seconds")+"Z"}))
PY
)"
if [ -n "${range_json:-}" ]; then
  curl_check "backtest run range" "POST" "${base}/api/backtest/run" "$range_json"
else
  log ""
  log "WARN: could not build range_json"
fi

log ""
log "DONE: ${out}"
echo "WROTE: ${out}"

exit 0
