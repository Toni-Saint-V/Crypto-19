# Ticket 0009 — Mode Shell: Semantic Controls + Color Tokens
Status: READY
Owner: Frontend Engineer
Priority: P0
Scope: web/dashboard-react

---

## Goal

Make mode switching semantically distinct (not just cosmetic). Each mode (LIVE/TEST/BACKTEST) must have:
- Distinct color palette (already exists, needs verification)
- Distinct CTA labels (not just "Run/Stop")
- Distinct mode badge copy (LIVE=danger, TEST=sandbox, BACKTEST=analysis)
- No page scroll (100vh layout, already mostly done — verify)

---

## In Scope

### 1. Mode Color Tokens (verify/fix)

Current tokens in `index.css` (lines 41-60):
- LIVE: teal (`#14b8a6`) — **CHANGE to red** (`#ef4444`)
- TEST: amber (`#f59e0b`) — **CHANGE to blue** (`#3b82f6`)
- BACKTEST: purple (`#a855f7`) — keep as-is

Rationale: LIVE must feel "dangerous" (red). TEST must feel "safe playground" (blue).

### 2. CTA Labels (by mode + state)

Update `App.tsx` → `getPrimaryCta()` (lines 371-398):

| Mode | State | Current Label | New Label |
|------|-------|---------------|-----------|
| LIVE | idle | "Start Bot" | "START LIVE BOT" |
| LIVE | running | "Stop Bot" | "⚠ STOP BOT" |
| TEST | idle | "Start Test" | "Start Test" |
| TEST | running | "Pause" | "Pause Test" |
| TEST | paused | "Resume" | "Resume Test" |
| TEST | (stop secondary) | "Stop" | "Stop Test" |
| BACKTEST | idle | "Run Backtest" | "Run Backtest" |
| BACKTEST | running | "Cancel" | "Cancel" |
| BACKTEST | done | "Re-run" | "Run Again" |

### 3. Mode Badge Copy

Update `ModeBadge.tsx` (lines 9-13) and `AIChatPanel.tsx` (lines 126-127):

| Mode | Current | New Badge | New Subtitle |
|------|---------|-----------|--------------|
| LIVE | "LIVE" | "🔴 LIVE" | "Live Trading" |
| TEST | "TEST" | "TEST" | "Simulated (no risk)" |
| BACKTEST | "BACKTEST" | "BACKTEST" | "Historical Analysis" |

### 4. Segmented Control Styling

Update `TopBar.tsx` → `ModeButton` (lines 18-45):
- Active segment: filled with mode color + glow (already done)
- LIVE segment: add pulsing dot when running
- Transition: verify 200ms ease-out on switch

### 5. No Page Scroll Verification

Verify in `index.css` (lines 102-111):
```css
html, body, #root {
  height: 100vh;
  overflow: hidden;
  overscroll-behavior: none;
}
```
Already correct — just verify no regressions.

---

## Out of Scope

- Kill Switch (Ticket 0011)
- Metrics row changes (Ticket 0010)
- Backend changes
- New components (Safety Policy, Audit Log)
- Mode switching state isolation (already implemented in App.tsx)

---

## Files to Edit

1. `web/dashboard-react/src/index.css` — color token changes (lines 48-60)
2. `web/dashboard-react/src/App.tsx` — CTA label logic (lines 371-398)
3. `web/dashboard-react/src/components/TopBar.tsx` — optional pulsing dot for LIVE running
4. `web/dashboard-react/src/components/ModeBadge.tsx` — badge copy + emoji
5. `web/dashboard-react/src/components/AIChatPanel.tsx` — modeLabel (line 126-127)

---

## Microcopy Spec

### CTA Button Text (exact)

```typescript
// LIVE mode
'START LIVE BOT'    // idle, uppercase for emphasis
'⚠ STOP BOT'        // running, warning emoji

// TEST mode
'Start Test'        // idle
'Pause Test'        // running
'Resume Test'       // paused
'Stop Test'         // secondary CTA when running

// BACKTEST mode
'Run Backtest'      // idle
'Cancel'            // running/queued
'Run Again'         // done
```

### Mode Badge Text (exact)

```typescript
const modeLabels: Record<Mode, string> = {
  LIVE: '🔴 LIVE',
  TEST: 'TEST',
  BACKTEST: 'BACKTEST',
};

const modeSubtitles: Record<Mode, string> = {
  LIVE: 'Live Trading',
  TEST: 'Simulated (no risk)',
  BACKTEST: 'Historical Analysis',
};
```

---

## Edge Cases

1. **Mode switch while running:** Already handled (App.tsx lines 71-121). Verify abort controller cancels in-flight requests.

2. **Rapid mode switching:** Verify modeVersionRef guards against stale updates.

3. **LIVE running indicator:** Add pulsing red dot next to "LIVE" in segmented control only when `liveRunning === true`.

4. **Color contrast:** New LIVE red (#ef4444) on dark background — verify WCAG AA (should pass).

---

## Acceptance Checklist

### Visual
- [ ] LIVE mode uses red accent (`#ef4444`)
- [ ] TEST mode uses blue accent (`#3b82f6`)
- [ ] BACKTEST mode uses purple accent (`#a855f7`) — unchanged
- [ ] Mode badge shows 🔴 emoji in LIVE mode
- [ ] No page scroll at any viewport size (verify 100vh)
- [ ] Segmented control transition is smooth (200ms)

### Behavior
- [ ] CTA labels change per mode+state table above
- [ ] Mode switch aborts pending requests (no stale data)
- [ ] 10× rapid mode switching leaves UI in consistent state
- [ ] LIVE segment shows pulsing dot when bot is running

### Code
- [ ] No TS errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] All color tokens use CSS variables (no hardcoded hex in components)

---

## CSS Token Changes (exact diff)

```css
/* OLD (index.css lines 48-60) */
--accent-live: #14b8a6; /* teal-500 */
--accent-live-light: #2dd4bf; /* teal-400 */
--accent-live-dark: #0d9488; /* teal-600 */
--accent-live-bg: rgba(20, 184, 166, 0.1);
--accent-live-border: rgba(20, 184, 166, 0.3);
--accent-live-glow: rgba(20, 184, 166, 0.25);

--accent-test: #f59e0b; /* amber-500 */
--accent-test-light: #fbbf24; /* amber-400 */
--accent-test-dark: #d97706; /* amber-600 */
--accent-test-bg: rgba(245, 158, 11, 0.1);
--accent-test-border: rgba(245, 158, 11, 0.3);
--accent-test-glow: rgba(245, 158, 11, 0.25);

/* NEW */
--accent-live: #ef4444; /* red-500 */
--accent-live-light: #f87171; /* red-400 */
--accent-live-dark: #dc2626; /* red-600 */
--accent-live-bg: rgba(239, 68, 68, 0.1);
--accent-live-border: rgba(239, 68, 68, 0.3);
--accent-live-glow: rgba(239, 68, 68, 0.25);

--accent-test: #3b82f6; /* blue-500 */
--accent-test-light: #60a5fa; /* blue-400 */
--accent-test-dark: #2563eb; /* blue-600 */
--accent-test-bg: rgba(59, 130, 246, 0.1);
--accent-test-border: rgba(59, 130, 246, 0.3);
--accent-test-glow: rgba(59, 130, 246, 0.25);
```

---

## Verification Commands

```bash
cd web/dashboard-react
npm run build      # No TS errors
npm run lint       # Linter passes
npm run dev        # Manual visual check
```

---

## Notes/Risks

- **Low risk:** Mostly string/token changes, no logic changes.
- **Visual regression:** Color changes are intentional but may need stakeholder approval.
- **Accessibility:** Red on dark passes WCAG AA; blue on dark passes WCAG AA.

