from __future__ import annotations
import re
from pathlib import Path

CHECKLIST = Path("docs/DASHBOARD_CHECKLIST.md")

def mark_by_substrings(*needles: str) -> int:
    if not CHECKLIST.exists():
        raise SystemExit("FAIL: docs/DASHBOARD_CHECKLIST.md missing")
    s = CHECKLIST.read_text(encoding="utf-8").splitlines()
    changed = 0
    out = []
    for line in s:
        m = re.match(r"^(\s*-\s*)\[(.)\](\s+)(.*)$", line)
        if not m:
            out.append(line)
            continue
        prefix, state, gap, text = m.groups()
        if state.lower() != "x" and any(n.lower() in text.lower() for n in needles):
            out.append(f"{prefix}[x]{gap}{text}")
            changed += 1
        else:
            out.append(line)
    if changed:
        CHECKLIST.write_text("\n".join(out) + "\n", encoding="utf-8")
    return changed

if __name__ == "__main__":
    import sys
    n = mark_by_substrings(*sys.argv[1:])
    print(f"marked={n}")
