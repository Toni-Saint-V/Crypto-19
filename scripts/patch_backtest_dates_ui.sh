#!/usr/bin/env bash
set -u -o pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 0

F="$ROOT/web/dashboard-react/src/components/BacktestConfigPanel.tsx"
if [ ! -f "$F" ]; then
  echo "WARN: missing file: $F"
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "WARN: python3 not found; cannot patch $F"
  exit 0
fi

python3 - "$F" << 'PY'
import sys, re, pathlib

p = pathlib.Path(sys.argv[1])
txt = p.read_text(encoding="utf-8", errors="ignore")
orig = txt

MARK_STATE = "/* BACKTEST_DATE_RANGE */"
MARK_UI = "{/* BACKTEST_DATE_RANGE_UI */}"

def ensure_use_state(s: str) -> str:
    if "useState" in s:
        return s

    lines = s.splitlines()
    for i, line in enumerate(lines[:80]):
        if "from 'react'" in line or 'from "react"' in line:
            if "{" in line and "}" in line:
                if "useState" not in line:
                    line2 = line
                    line2 = re.sub(r"{\s*", "{ useState, ", line2, count=1)
                    lines[i] = line2
                return "\n".join(lines) + "\n" if s.endswith("\n") else "\n".join(lines)
            else:
                lines.insert(i + 1, 'import { useState } from "react";')
                return "\n".join(lines) + "\n" if s.endswith("\n") else "\n".join(lines)

    # no react import found -> do nothing
    return s

def insert_state_before_return(s: str) -> str:
    if MARK_STATE in s:
        return s

    m = re.search(r"\breturn\s*\(", s)
    if not m:
        return s

    state_block = f'''
  {MARK_STATE}
  const toDatetimeLocal = (d: Date) => {{
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${{d.getFullYear()}}-${{pad(d.getMonth() + 1)}}-${{pad(d.getDate())}}T${{pad(d.getHours())}}:${{pad(d.getMinutes())}}`;
  }};

  const __now = new Date();
  const __defaultEnd = toDatetimeLocal(__now);
  const __defaultStart = toDatetimeLocal(new Date(__now.getTime() - 30 * 24 * 3600 * 1000));

  const [startIso, setStartIso] = useState<string>(__defaultStart);
  const [endIso, setEndIso] = useState<string>(__defaultEnd);
'''

    # insert just before "return("
    idx = m.start()
    return s[:idx] + state_block + "\n" + s[idx:]

def insert_ui_after_return_line(s: str) -> str:
    if MARK_UI in s:
        return s

    lines = s.splitlines()
    out = []
    inserted = False

    for i, line in enumerate(lines):
        out.append(line)
        if not inserted and re.search(r"\breturn\s*\(\s*$", line):
            # try to align with next line indent
            next_indent = "  "
            if i + 1 < len(lines):
                m = re.match(r"(\s*)", lines[i + 1])
                next_indent = m.group(1) if m else "  "

            ui_block = [
                f"{next_indent}{MARK_UI}",
                f"{next_indent}<div style={{ display: \"flex\", gap: 12, alignItems: \"end\", marginBottom: 12, flexWrap: \"wrap\" }}>",
                f"{next_indent}  <label style={{ display: \"flex\", flexDirection: \"column\", gap: 4 }}>",
                f"{next_indent}    <span style={{ fontSize: 12, opacity: 0.8 }}>Start</span>",
                f"{next_indent}    <input",
                f"{next_indent}      type=\"datetime-local\"",
                f"{next_indent}      value={{startIso}}",
                f"{next_indent}      onChange={{(e) => setStartIso(e.target.value)}}",
                f"{next_indent}    />",
                f"{next_indent}  </label>",
                f"{next_indent}  <label style={{ display: \"flex\", flexDirection: \"column\", gap: 4 }}>",
                f"{next_indent}    <span style={{ fontSize: 12, opacity: 0.8 }}>End</span>",
                f"{next_indent}    <input",
                f"{next_indent}      type=\"datetime-local\"",
                f"{next_indent}      value={{endIso}}",
                f"{next_indent}      onChange={{(e) => setEndIso(e.target.value)}}",
                f"{next_indent}    />",
                f"{next_indent}  </label>",
                f"{next_indent}</div>",
            ]
            out.extend(ui_block)
            inserted = True

    return "\n".join(out) + ("\n" if s.endswith("\n") else "")

def patch_payload(s: str) -> str:
    # Prefer patching object-literal JSON.stringify({ ... })
    if "start_ts" in s and "end_ts" in s and "start_iso" in s and "end_iso" in s:
        return s

    pat = r"(body\s*:\s*JSON\.stringify\(\s*{)"
    m = re.search(pat, s)
    if m:
        insert = (
            "start_ts: Math.floor(new Date(startIso).getTime() / 1000),\n"
            "      end_ts: Math.floor(new Date(endIso).getTime() / 1000),\n"
            "      start_iso: startIso,\n"
            "      end_iso: endIso,\n"
            "      "
        )
        s2 = re.sub(pat, r"\1\n      " + insert, s, count=1)
        return s2

    # If it uses JSON.stringify(payload), try to inject into payload object if it exists
    m2 = re.search(r"\bconst\s+payload\s*=\s*{", s)
    if m2 and "JSON.stringify(payload)" in s:
        idx = m2.end()
        inject = (
            "\n  start_ts: Math.floor(new Date(startIso).getTime() / 1000),"
            "\n  end_ts: Math.floor(new Date(endIso).getTime() / 1000),"
            "\n  start_iso: startIso,"
            "\n  end_iso: endIso,"
        )
        return s[:idx] + inject + s[idx:]

    return s

try:
    txt = ensure_use_state(txt)
    txt = insert_state_before_return(txt)
    txt = insert_ui_after_return_line(txt)
    txt = patch_payload(txt)

    if txt != orig:
        p.write_text(txt, encoding="utf-8")
        print("OK: patched BacktestConfigPanel.tsx (date range + payload)")
    else:
        print("INFO: no changes applied (already patched or patterns not found)")
except Exception as e:
    print(f"WARN: patch failed: {e}")

PY

echo "CHECK:"
grep -n "BACKTEST_DATE_RANGE" "$F" 2>/dev/null || true
grep -n "datetime-local" "$F" 2>/dev/null || true
grep -n "start_ts" "$F" 2>/dev/null || true
grep -n "end_ts" "$F" 2>/dev/null || true

exit 0
