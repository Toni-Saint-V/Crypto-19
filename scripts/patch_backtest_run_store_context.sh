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
import sys, re, pathlib, datetime

p = pathlib.Path(sys.argv[1])
txt = p.read_text(encoding="utf-8", errors="ignore")
orig = txt

# Make a backup (best-effort)
try:
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    b = p.with_suffix(f".py.bak_{ts}")
    b.write_text(orig, encoding="utf-8")
except Exception:
    pass

# Locate the backtest run handler block
decor_pat = r'@app\.post\(\s*["\']/api/backtest/run["\']\s*\)'
m = re.search(decor_pat, txt, flags=re.MULTILINE)
if not m:
    print("INFO: /api/backtest/run decorator not found; no changes")
    sys.exit(0)

# Find the async def after decorator
m2 = re.search(decor_pat + r'\s*\n(\s*)async\s+def\s+([A-Za-z_]\w*)\s*\(', txt, flags=re.MULTILINE)
if not m2:
    print("INFO: /api/backtest/run handler def not found; no changes")
    sys.exit(0)

base_indent = m2.group(1)
fn_name = m2.group(2)

# Slice function block by indentation (simple heuristic)
start_idx = m2.start(0)
def_idx = txt.find("async def " + fn_name, m2.end(0) - 200)
if def_idx == -1:
    def_idx = m2.start(0)

lines = txt.splitlines(True)

# Find line numbers
line_start = 0
pos = 0
for i, line in enumerate(lines):
    if pos <= def_idx < pos + len(line):
        line_start = i
        break
    pos += len(line)

# Determine function end: first line after def with indentation <= base_indent and not blank/comment
fn_indent = base_indent + "    "
end_line = len(lines)
for j in range(line_start + 1, len(lines)):
    l = lines[j]
    if l.strip() == "":
        continue
    if re.match(rf'^{re.escape(base_indent)}\S', l):
        end_line = j
        break

fn_lines = lines[line_start:end_line]
fn_text = "".join(fn_lines)

# 1) If the handler has `await request.json()`, inject parsing of start/end params once (idempotent marker)
MARK_PARAMS = "# BACKTEST_RUN_PARAMS"
if MARK_PARAMS not in fn_text:
    mj = re.search(r'await\s+request\.json\(\s*\)', fn_text)
    if mj:
        # Insert right after the first await request.json() line
        fn_split = fn_text.splitlines(True)
        out = []
        inserted = False
        for line in fn_split:
            out.append(line)
            if (not inserted) and ("await request.json()" in line):
                ins = (
                    f"{fn_indent}{MARK_PARAMS}\n"
                    f"{fn_indent}start_ts = data.get(\"start_ts\")\n"
                    f"{fn_indent}end_ts = data.get(\"end_ts\")\n"
                    f"{fn_indent}start_iso = data.get(\"start_iso\")\n"
                    f"{fn_indent}end_iso = data.get(\"end_iso\")\n"
                )
                out.append(ins)
                inserted = True
        fn_text = "".join(out)

# 2) Store success payload into last_backtest_context for returns like: return JSONResponse(payload)
# Only patch returns WITHOUT status_code (avoid overwriting context with errors)
MARK_STORE = "# BACKTEST_STORE_CONTEXT"
if MARK_STORE not in fn_text:
    def repl(m):
        expr = m.group(1).strip()
        block = (
            f"{fn_indent}{MARK_STORE}\n"
            f"{fn_indent}_ctx = {expr}\n"
            f"{fn_indent}try:\n"
            f"{fn_indent}    if isinstance(_ctx, dict):\n"
            f"{fn_indent}        globals()[\"last_backtest_context\"] = _ctx\n"
            f"{fn_indent}except Exception:\n"
            f"{fn_indent}    pass\n"
            f"{fn_indent}return JSONResponse(_ctx)\n"
        )
        return block

    # Replace first matching "return JSONResponse(<expr>)" without extra args
    fn_text2, n = re.subn(
        r'^\s*return\s+JSONResponse\(\s*([^\),][^)]*?)\s*\)\s*$',
        repl,
        fn_text,
        count=1,
        flags=re.MULTILINE
    )
    if n == 1:
        fn_text = fn_text2

# If changed, reassemble the file
new_txt = "".join(lines[:line_start]) + fn_text + "".join(lines[end_line:])

if new_txt != orig:
    p.write_text(new_txt, encoding="utf-8")
    print("OK: patched /api/backtest/run to store last_backtest_context (best-effort)")
else:
    print("INFO: no changes applied (already patched or no safe return pattern found)")
PY

echo ""
echo "CHECK (server.py):"
grep -n '@app.post("/api/backtest/run")' "$S" 2>/dev/null || true
grep -n 'BACKTEST_STORE_CONTEXT' "$S" 2>/dev/null || true
grep -n 'BACKTEST_RUN_PARAMS' "$S" 2>/dev/null || true

exit 0
