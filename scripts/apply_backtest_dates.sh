#!/usr/bin/env bash
set -u -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

ts="$(date "+%Y%m%d_%H%M%S")"
changed=0

echo "INFO: project: $PROJECT_ROOT"

# -----------------------------
# 1) BACKEND: disable duplicate decorator
# -----------------------------
if [ -f "$PROJECT_ROOT/server.py" ]; then
  python3 - "$PROJECT_ROOT/server.py" << 'PY'
import sys, re, pathlib

path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8", errors="ignore").splitlines()

targets = [
    '@app.post("/api/backtest/run")',
    "@app.post('/api/backtest/run')",
]

idxs = []
for i, line in enumerate(text):
    s = line.strip()
    if any(s == t for t in targets):
        idxs.append(i)

if len(idxs) <= 1:
    print("INFO: server.py: no duplicate /api/backtest/run decorators found")
    sys.exit(0)

keep = idxs[0]
disable = idxs[1:]

for i in disable:
    if not text[i].lstrip().startswith("#"):
        text[i] = re.sub(r"^(\s*)", r"\1# DUPLICATE_DISABLED ", text[i])

path.write_text("\n".join(text) + "\n", encoding="utf-8")
print(f"INFO: server.py: kept decorator at line {keep+1}, disabled {len(disable)} duplicate(s): {[x+1 for x in disable]}")
PY
  changed=1
else
  echo "WARN: server.py not found, skip backend patch"
fi

# -----------------------------
# 2) FRONTEND: ensure BacktestConfigPanel exists + wired to API
# -----------------------------
FRONT="$PROJECT_ROOT/web/dashboard-react"
SRC="$FRONT/src"
COMP_DIR="$SRC/components"
CHART_AREA="$COMP_DIR/ChartArea.tsx"
PANEL="$COMP_DIR/BacktestConfigPanel.tsx"

if [ -d "$SRC" ]; then
  mkdir -p "$COMP_DIR"

  if [ ! -f "$PANEL" ]; then
    cat > "$PANEL" << 'TSX'
import React, { useMemo, useState } from "react";

type BacktestResponse = any;

function toIsoOrEmpty(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function BacktestConfigPanel(): JSX.Element {
  const apiBase = (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000";

  const [startLocal, setStartLocal] = useState<string>("");
  const [endLocal, setEndLocal] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const [result, setResult] = useState<BacktestResponse | null>(null);

  const startIso = useMemo(() => toIsoOrEmpty(startLocal), [startLocal]);
  const endIso = useMemo(() => toIsoOrEmpty(endLocal), [endLocal]);

  async function runBacktest(): Promise<void> {
    setErrorText("");
    setResult(null);
    setIsRunning(true);

    try {
      const payload: Record<string, any> = {};
      if (startIso) payload.start = startIso;
      if (endIso) payload.end = endIso;

      const r = await fetch(`${apiBase}/api/backtest/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const txt = await r.text();
      let data: any = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch {
        data = { raw: txt };
      }

      if (!r.ok) {
        setErrorText(`HTTP ${r.status}: ${data?.detail || data?.raw || "error"}`);
        return;
      }

      setResult(data);
    } catch (e: any) {
      setErrorText(String(e?.message || e));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Backtest</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Start</span>
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "inherit" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>End</span>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "inherit" }}
          />
        </label>

        <button
          onClick={runBacktest}
          disabled={isRunning}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            cursor: isRunning ? "default" : "pointer",
            marginTop: 18,
          }}
        >
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>

      {errorText ? (
        <div style={{ marginTop: 10, color: "#ff6b6b", whiteSpace: "pre-wrap" }}>{errorText}</div>
      ) : null}

      {result ? (
        <pre style={{ marginTop: 10, fontSize: 12, opacity: 0.9, overflowX: "auto" }}>
{JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        API_BASE: {(import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000"}
      </div>
    </div>
  );
}
TSX
    echo "INFO: created $PANEL"
    changed=1
  else
    echo "INFO: $PANEL exists (no overwrite)"
  fi

  # Ensure ChartArea imports BacktestConfigPanel if needed
  if [ -f "$CHART_AREA" ]; then
    python3 - "$CHART_AREA" << 'PY'
import sys, pathlib, re

p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8", errors="ignore")

needs = "<BacktestConfigPanel" in s
has_import = re.search(r'from\s+[\'"]./BacktestConfigPanel[\'"]', s) is not None
has_symbol = "BacktestConfigPanel" in s

if needs and not has_import:
    lines = s.splitlines()
    insert_at = 0
    # after last import
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1
    lines.insert(insert_at, 'import BacktestConfigPanel from "./BacktestConfigPanel";')
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("INFO: ChartArea.tsx: added import BacktestConfigPanel")
else:
    print("INFO: ChartArea.tsx: no change needed")
PY
    changed=1
  else
    echo "WARN: $CHART_AREA not found, skip import fix"
  fi
else
  echo "WARN: frontend src not found at $SRC, skip frontend patch"
fi

# -----------------------------
# 3) QUICK CHECKS (no hard fail)
# -----------------------------
if [ -f "$PROJECT_ROOT/server.py" ]; then
  python3 -m py_compile "$PROJECT_ROOT/server.py" >/dev/null 2>&1 || echo "WARN: py_compile server.py failed (check syntax manually)"
fi

echo "DONE: apply_backtest_dates.sh (changed=$changed)"
