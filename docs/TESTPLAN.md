# Test Plan — MVP Production Readiness

## P0 Manual Checks
### A) 100vh / no-scroll
- Desktop: no page scroll; only chat messages and drawer content scroll.
- Drawer expanded: chart remains same height; overlay sits above.

### B) Mode Isolation (10-switch)
Sequence: LIVE -> TEST -> BACKTEST repeated 3 times quickly.
Assertions:
- No console errors.
- No network requests from previous mode after switch.
- UI shows correct mode label everywhere.
- Polling stops for old mode.

### C) Backtest Job Flow
- Click Run Backtest:
  - UI shows job queued/running.
  - Progress updates (if available).
  - On done: result fetched and drawer populated.
- Start new backtest while one running:
  - old job is ignored/cancelled (UI never overwrites with stale result).

## P0 Automated (Recommended)
- Playwright:
  - no-scroll check (document.body scrollHeight == clientHeight).
  - 10-switch test with network inspection.
  - backtest flow with mocked endpoints.

## Definition of Done
- All P0 manual checks pass.
- Playwright suite covers at least: no-scroll, 10-switch, backtest job.
