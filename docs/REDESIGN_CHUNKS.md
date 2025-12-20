# Redesign chunks (draft)

Generated: 2025-12-20 04:32

## Принцип
Редизайн делаем крупными чанками, каждый чанк закрывается визуальной проверкой + тестпланом.

## Chunk 1 — Layout skeleton (100vh + panels + drawer)
- Deliverable: stable layout + mode bar always visible
- Gate: UX_ACCEPTANCE Layout section

## Chunk 2 — Chart module (pro-level)
- Deliverable: readable candles, crosshair + tooltip, volume, overlays (EMA/RSI)
- Gate: no jank on resize; correct states; chart always visible

## Chunk 3 — Data blocks (trades/equity/metrics)
- Deliverable: blocks read from contract endpoints, full states
- Gate: TEST shows meaningful sample data end-to-end

## Chunk 4 — Mode isolation + state management
- Deliverable: 10x mode switches clean; no stale data
- Gate: TESTPLAN passes

## Chunk 5 — Polish pass
- Deliverable: typography/spacing, micro-interactions, empty/error states refined
- Gate: no “dev text” in main UI; premium consistency
