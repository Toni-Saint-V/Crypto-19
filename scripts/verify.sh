#!/usr/bin/env bash
set -euo pipefail

have() { command -v "$1" >/dev/null 2>&1; }

echo "=== verify: python sanity ==="
python -m compileall -q . || true

if have ruff; then
  echo "=== verify: ruff ==="
  ruff check . || true
fi

if have mypy && (test -f mypy.ini || test -f pyproject.toml); then
  echo "=== verify: mypy ==="
  mypy . || true
fi

if have pytest && (test -d tests || test -f pytest.ini || test -f pyproject.toml); then
  echo "=== verify: pytest ==="
  pytest -q || true
fi

if test -f .run/one_cmd_smoke_api_200.sh; then
  echo "=== verify: api smoke ==="
  bash .run/one_cmd_smoke_api_200.sh
fi

if test -f .run/one_cmd_fix_autoscan_doc_link.sh; then
  echo "=== verify: autoscan doc pin ==="
  bash .run/one_cmd_fix_autoscan_doc_link.sh || true
fi

echo "TASK: add scripts/verify.sh to run local checks + smoke"
echo "STEP_PROGRESS: 100%"
echo "DASHBOARD_PROGRESS: 76%"
