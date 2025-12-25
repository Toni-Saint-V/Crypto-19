# Decisions

## 2025-12-24 17:38:14 — Execution rules
- Terminal-first: all repeatable actions via scripts/terminal.
- Big steps only; no micro-changes without verify.
- Design: full redesign after business logic stabilizes (backtest + test loop).

## 2025-12-25 00:49:56 — Removed READY ticket requirement
- Decision: We no longer require READY tickets to start implementation.
- Control mechanism: "Scope / Done / Verify" must be present in every Cursor agent completion message.
