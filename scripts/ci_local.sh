#!/usr/bin/env bash
set -euo pipefail

python -m pip install -U pip >/dev/null 2>&1 || true

if test -f requirements.txt; then
  python -m pip install -r requirements.txt >/dev/null 2>&1 || true
elif test -f pyproject.toml; then
  python -m pip install -e . >/dev/null 2>&1 || true
elif test -f requirements-dev.txt; then
  python -m pip install -r requirements-dev.txt >/dev/null 2>&1 || true
fi

python -m pip install -U pytest uvicorn python-multipart ruff mypy >/dev/null 2>&1 || true

bash scripts/verify.sh
test -f scripts/p0_determinism_probe.sh && bash scripts/p0_determinism_probe.sh || true
