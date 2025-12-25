# Cursor continuation (bugfix finish) — CryptoBot19Clean

You are finishing the bugfix pass we were doing in Cursor. Do not ask questions. Make the minimal safe code changes to fix the issues below, run checks, and report changed files + how to verify.

## Scope
Fix these 3 bugs (P0, correctness). Do not change API/contracts unless absolutely required. Avoid refactors unrelated to the bugs.

## Bug 1 — Pydantic field order error in DashboardSnapshot
Problem:
- `DashboardSnapshot` has fields with defaults declared before required fields (`symbol`, `timeframe`). In Pydantic, required fields must not come after defaulted fields, otherwise model creation can fail.

Fix:
- Reorder fields so required fields come first (preferred).
- Or make the later fields non-required with defaults (only if semantically correct).
- Ensure any validators / model_config still behave correctly after reordering.

Acceptance:
- Creating `DashboardSnapshot(symbol=..., timeframe=...)` works without validation/definition errors.
- No new mypy/linters issues introduced.

## Bug 2 — keyboard variable undefined when no buttons exist
Problem:
- `keyboard` is defined only inside a conditional that depends on `buttons` being non-empty.
- If `buttons` is empty, code still uses `reply_markup=keyboard`, causing NameError.

Fix:
- Ensure `keyboard` is always defined (e.g., `keyboard = None` by default).
- Or only pass reply_markup if keyboard exists.
- Keep behavior identical when buttons are present.

Acceptance:
- No NameError path exists.
- Rendering works both with and without buttons.

## Bug 3 — BacktestEngine.run metadata corruption when caller provides candles/signals
Problem:
- When `BacktestEngine.run()` is called with precomputed `candles` and `signals`, metadata may end up with `symbol=None` and/or `timeframe=None` if caller didn’t pass them.
- Downstream code expects valid symbol/timeframe.

Fix:
- Enforce non-null symbol/timeframe in result metadata:
  - If explicit args are provided, use them.
  - Otherwise derive from candles (if available in candle schema) or from engine context/defaults.
  - If truly impossible, raise a clear error early (explicit status/message), rather than returning corrupted metadata.
- Keep standard path (where engine loads data) unchanged.

Acceptance:
- Backtest result metadata always has valid `symbol` and `timeframe`.
- No silent None values in metadata for symbol/timeframe.

## Output required
1) List of changed files.
2) Briefly: what you changed for Bug 1-3.
3) How to verify quickly (commands / minimal manual steps).

## Guardrails
- No contract changes unless necessary.
- No broad refactors.
- Prefer small, explicit fixes with tests if any exist.
