# CURSOR FOLLOW-UP (FAST): Ensure data-mode actually works (index.css already OK)

## MINI PROMPT
- No questions. Minimal diff. Fix in one pass.
- No API contract changes. No refactors unless strictly needed.

## What we saw
index.css already has:
- --scrollbar-thumb / --scrollbar-thumb-hover tokens
- [data-mode="backtest|live|test"] overrides for --accent-active
- overscroll-behavior: none + overflow hidden on root

So the only remaining risk is: the app may NOT be setting `data-mode` on the real root, or the values don’t match the CSS selectors.

## Fix (required)
File: web/dashboard-react/src/App.tsx (or the top-level layout component that wraps everything)

Do this:
- Ensure a stable root element has `data-mode` set, so CSS selectors work:
  - Prefer: the top-most wrapper div that spans the whole app (the one that is 100vh container)
  - Example: `<div data-mode={modeLower} ...>...</div>`
- Ensure the value matches index.css selectors EXACTLY:
  - must be one of: `"live" | "test" | "backtest"` (lowercase)
  - if internal enum is uppercase, convert: `const modeLower = mode.toLowerCase()`
  - if any code uses "BACKTESTING", map it to "backtest" for the attribute

Optional (only if you can’t guarantee wrapper lifetime):
- Set it on the document root:
  - `document.documentElement.dataset.mode = modeLower;`
  - but prefer the wrapper attribute first.

## Acceptance (2 min)
- Switch modes: selection color + any future `--accent-active` driven UI changes per mode.
- No regressions: still no page scroll, chart remains visible.

