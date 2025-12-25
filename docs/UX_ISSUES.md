# UX Issues — Dashboard

## Non-negotiables (Layout Contracts)
- 100vh / 100dvh, no page scroll.
- Chart is hero and always visible.
- Chat right fixed width; messages scroll inside; input pinned.
- Backtest results: bottom drawer overlay, collapsed by default, max-height ~38vh, internal scroll, must NOT change chart height.
- Modes do not leak after 10 rapid switches.

## Current Known Breaks (P0)
1) Backtest drawer receives no data (panel depended on window event that is not dispatched).
2) Drawer uses hardcoded `right: 380px` instead of chat width variable -> fragile.
3) Inconsistent mode casing across boundaries -> risk of sending wrong-mode requests.
4) Multiple fetch patterns (some ignore apiBase) -> dev/prod mismatch risk.
5) ChartHUD shows defaults (LIVE/UNKNOWN) -> trust hit.

## Fix Targets (P0)
- Replace magic layout numbers with CSS vars `--chat-w`, `--drawer-max-h`.
- Backtest job-only dataflow: job_id -> status -> result -> drawer.
- Single API client and no bypass calls.
- Mode lock: only UPPER in stores; normalize inputs.
- Polling must abort/stop on mode switch.

## Definition of Done
- No page scroll across desktop/tablet/mobile.
- Drawer never shifts chart height.
- After Run Backtest, drawer always shows results.
- 10-switch test has zero leakage.

## Common Pitfalls
- "Quick fix" via window events again.
- Responsive tweaks that reintroduce page scroll.
- Leaving one stray hardcoded width/offset.
