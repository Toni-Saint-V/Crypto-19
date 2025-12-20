# UX spec (draft, non-negotiable)

Generated: 2025-12-20 04:32

## Hard rules
- No page scroll (100vh layout)
- Chart always visible (hero)
- Chat panel fixed width on the right
- Chat messages scroll inside; input pinned to bottom
- BACKTEST results use bottom drawer:
  - collapsed by default
  - max-height
  - overflow:auto inside
  - drawer must not change chart height

## Visual system (initial)
- Spacing: consistent 8px grid
- Typography: clear hierarchy, no dev text in main UI
- States: loading/empty/error/partial data for every block
- No fake “0.00” placeholders in user-facing UI

## Mode visibility
- Mode (LIVE/TEST/BACKTEST) must be always visible and must gate controls availability.
