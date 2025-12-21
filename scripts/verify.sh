#!/usr/bin/env bash
set -euo pipefail

have() { command -v "$1" >/dev/null 2>&1; }

echo "=== verify: python sanity ==="
python -m compileall -q -x '(/\.backup/|/\.venv/|/node_modules/|/\.git/)' . || true

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

if test -f scripts/smoke_api_200.sh; then
  echo "=== verify: api smoke ==="
  bash scripts/smoke_api_200.sh
fi

if test -f scripts/pin_autoscan_doc_link.sh; then
  echo "=== verify: autoscan doc pin (dry) ==="
  NO_COMMIT=1 bash scripts/pin_autoscan_doc_link.sh || true
fi
