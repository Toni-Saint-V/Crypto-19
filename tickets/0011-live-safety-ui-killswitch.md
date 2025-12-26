# Ticket 0011 — LIVE Safety UI: Kill Switch + Confirm Modal + Audit Log Skeleton
Status: READY
Owner: Frontend Engineer
Priority: P0
Scope: web/dashboard-react

---

## Goal

Add critical safety UI for LIVE mode:
1. Kill Switch button (stops all, visible in LIVE only)
2. Confirmation modal for dangerous actions
3. Audit Log UI skeleton (view-only, no backend yet)

This is UI skeleton only — backend integration comes later.

---

## In Scope

### 1. Kill Switch Button

**Location:** TopBar, right side, visible only in LIVE mode

**Anatomy:**
```
┌───────────────────┐
│ ⚡ STOP ALL       │
└───────────────────┘
```

**Styling:**
- Background: `var(--status-loss)` (#ef4444)
- Text: white, bold, 12px
- Border: 2px solid `#f87171`
- Size: auto-width (fits content) × 36px height
- Border-radius: 8px

**Behavior:**
- Single click: shake animation (100ms) + tooltip "Double-click to stop all"
- Double click: opens confirmation modal
- Alternative: hold for 2 seconds (show progress ring)
- Disabled state: when no active positions/orders (grayed out)

**Visibility rules:**
- LIVE mode + bot running: visible + enabled
- LIVE mode + bot stopped + no positions: visible + disabled
- TEST/BACKTEST mode: hidden

### 2. Confirmation Modal

**Generic confirmation modal for dangerous actions.**

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Stop All Trading?                                    │  ← Title
├─────────────────────────────────────────────────────────┤
│                                                         │
│ This will:                                              │
│ • Cancel all pending orders                             │
│ • Close all open positions at market                    │
│ • Disable the trading bot                               │
│                                                         │
│ This action cannot be undone.                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                      [Cancel]  [STOP ALL]               │  ← Actions
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Overlay: semi-transparent black (rgba(0,0,0,0.7))
- Modal: `var(--surface-1)` background, `var(--stroke)` border
- Width: 400px max, centered
- Border-radius: 16px
- Title: 18px bold, white
- Body: 14px, `var(--text-2)`
- Cancel button: outline style, `var(--surface-2)` background
- Confirm button: `var(--status-loss)` background, white text

**Animation:**
- Fade in overlay: 150ms
- Scale up modal: 150ms (from 0.95 to 1.0)

### 3. Audit Log UI Skeleton

**Location:** Bottom drawer → "Audit" tab (LIVE mode only)

**Structure:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📋 Audit Log                                           [Export CSV]     │
├─────────────────────────────────────────────────────────────────────────┤
│ TIME          ACTION           DETAILS                     STATUS       │
├─────────────────────────────────────────────────────────────────────────┤
│ 14:32:45      BUY 0.1 BTC     BTCUSDT @ $43,250           ✓ Executed   │
│ 14:28:12      STOP MODIFIED   Stop: $42,800 → $43,100     ✓ Executed   │
│ 14:15:00      TRADE BLOCKED   Exceeded daily loss limit   ⚠ Blocked    │
└─────────────────────────────────────────────────────────────────────────┘
```

**For now:** Show mock data only. No backend integration.

**Empty state:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📋 Audit Log                                           [Export CSV]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    No audit entries yet.                                │
│                    Actions will appear here when trading is active.    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Out of Scope

- Backend API for kill switch (just console.log for now)
- Backend API for audit log (mock data only)
- Safety Policy settings UI (separate ticket)
- Autonomy Level controls (separate ticket)
- Real position/order data (use mock)

---

## Files to Create

1. `web/dashboard-react/src/components/KillSwitch.tsx` — new component
2. `web/dashboard-react/src/components/ConfirmModal.tsx` — new component
3. `web/dashboard-react/src/components/AuditLog.tsx` — new component

## Files to Edit

4. `web/dashboard-react/src/components/TopBar.tsx` — add KillSwitch
5. `web/dashboard-react/src/App.tsx` — add modal state, handleKillSwitch
6. `web/dashboard-react/src/components/BacktestSheet.tsx` or equivalent — add Audit tab (LIVE only)

---

## Component Specs

### KillSwitch.tsx

```tsx
interface KillSwitchProps {
  onActivate: () => void;
  disabled?: boolean;
  className?: string;
}

export default function KillSwitch({ onActivate, disabled, className }: KillSwitchProps) {
  const [clickCount, setClickCount] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);

  // Double-click detection
  const handleClick = () => {
    if (disabled) return;
    
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 2) {
        onActivate();
        return 0;
      }
      return newCount;
    });
    
    // Reset click count after 400ms
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => setClickCount(0), 400);
  };

  // Hold-to-activate (2 seconds)
  const handleMouseDown = () => {
    if (disabled) return;
    let progress = 0;
    holdTimerRef.current = window.setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        onActivate();
        setHoldProgress(0);
      }
    }, 100); // 20 steps × 100ms = 2 seconds
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setHoldProgress(0);
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
      className={`relative px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
        ${clickCount === 1 ? 'animate-shake' : ''}
        ${className}`}
      style={{
        background: 'var(--status-loss)',
        border: '2px solid var(--status-loss-border)',
        color: 'white',
      }}
      title={disabled ? 'No active trading' : 'Double-click or hold to stop all'}
    >
      {/* Progress ring for hold-to-activate */}
      {holdProgress > 0 && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeDasharray={`${holdProgress * 2.83} 283`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}
      <span className="flex items-center gap-1.5">
        <span>⚡</span>
        <span>STOP ALL</span>
      </span>
    </button>
  );
}
```

### ConfirmModal.tsx

```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  bullets?: string[];
  confirmLabel?: string;
  confirmDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  bullets,
  confirmLabel = 'Confirm',
  confirmDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 animate-fadeIn"
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl animate-scaleIn"
        style={{ 
          background: 'var(--surface-1)', 
          border: '1px solid var(--stroke)' 
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-1)' }}>
          {title}
        </h2>
        
        {/* Message */}
        <div className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
          {message}
        </div>
        
        {/* Bullet list */}
        {bullets && bullets.length > 0 && (
          <ul className="text-sm mb-4 space-y-1" style={{ color: 'var(--text-2)' }}>
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--stroke)',
              color: 'var(--text-2)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-bold rounded-lg transition-all"
            style={{
              background: confirmDestructive ? 'var(--status-loss)' : 'var(--accent-active)',
              color: 'white',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### AuditLog.tsx

```tsx
interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  status: 'executed' | 'blocked' | 'pending' | 'error';
}

// Mock data for skeleton
const MOCK_ENTRIES: AuditEntry[] = [
  {
    id: '1',
    timestamp: Date.now() - 60000,
    action: 'BUY 0.1 BTC',
    details: 'BTCUSDT @ $43,250',
    status: 'executed',
  },
  {
    id: '2',
    timestamp: Date.now() - 240000,
    action: 'STOP MODIFIED',
    details: 'Stop: $42,800 → $43,100',
    status: 'executed',
  },
  {
    id: '3',
    timestamp: Date.now() - 600000,
    action: 'TRADE BLOCKED',
    details: 'Exceeded daily loss limit',
    status: 'blocked',
  },
];

interface AuditLogProps {
  entries?: AuditEntry[];
}

export default function AuditLog({ entries = MOCK_ENTRIES }: AuditLogProps) {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const statusIcons: Record<AuditEntry['status'], string> = {
    executed: '✓',
    blocked: '⚠',
    pending: '⏳',
    error: '✕',
  };

  const statusColors: Record<AuditEntry['status'], string> = {
    executed: 'var(--status-profit)',
    blocked: 'var(--status-warn)',
    pending: 'var(--text-3)',
    error: 'var(--status-loss)',
  };

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-sm" style={{ color: 'var(--text-3)' }}>
          No audit entries yet.
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
          Actions will appear here when trading is active.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--stroke)' }}
      >
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            Audit Log
          </span>
        </div>
        <button
          className="px-3 py-1 text-xs font-medium rounded-lg transition-all"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--stroke)',
            color: 'var(--text-2)',
          }}
          onClick={() => {
            // TODO: Implement CSV export
            console.log('Export CSV');
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--stroke)' }}>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text-3)' }}>
                TIME
              </th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text-3)' }}>
                ACTION
              </th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text-3)' }}>
                DETAILS
              </th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text-3)' }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr 
                key={entry.id} 
                style={{ borderBottom: '1px solid var(--stroke)' }}
                className="hover:bg-white/5"
              >
                <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--text-3)' }}>
                  {formatTime(entry.timestamp)}
                </td>
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-1)' }}>
                  {entry.action}
                </td>
                <td className="px-4 py-2" style={{ color: 'var(--text-2)' }}>
                  {entry.details}
                </td>
                <td className="px-4 py-2">
                  <span 
                    className="flex items-center gap-1"
                    style={{ color: statusColors[entry.status] }}
                  >
                    <span>{statusIcons[entry.status]}</span>
                    <span className="capitalize">{entry.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## CSS Additions (index.css)

```css
/* Shake animation for kill switch */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
}

.animate-shake {
  animation: shake 0.2s ease-in-out;
}

/* Fade in for modal overlay */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out;
}

/* Scale in for modal */
@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scaleIn {
  animation: scaleIn 0.15s ease-out;
}
```

---

## Microcopy Spec

### Kill Switch

```typescript
// Button text
'⚡ STOP ALL'

// Tooltip (enabled)
'Double-click or hold 2s to stop all trading'

// Tooltip (disabled)
'No active trading'
```

### Confirmation Modal (Kill Switch)

```typescript
// Title
'⚠️ Stop All Trading?'

// Message
'This will immediately stop all trading activity:'

// Bullets
[
  'Cancel all pending orders',
  'Close all open positions at market price',
  'Disable the trading bot',
]

// Footer warning
'This action cannot be undone.'

// Confirm button
'STOP ALL'
```

### Audit Log

```typescript
// Header
'📋 Audit Log'

// Export button
'Export CSV'

// Empty state
{
  title: 'No audit entries yet.',
  subtitle: 'Actions will appear here when trading is active.',
}

// Status labels
{
  executed: '✓ Executed',
  blocked: '⚠ Blocked',
  pending: '⏳ Pending',
  error: '✕ Error',
}
```

---

## Edge Cases

1. **Rapid double-click:** Debounce to prevent multiple modal opens.

2. **Modal open + mode switch:** Close modal on mode switch (modal should only exist in LIVE).

3. **Hold interrupted:** If user moves mouse off button while holding, cancel the hold timer.

4. **Kill switch while modal open:** Disable kill switch button when modal is open.

5. **Audit log overflow:** Table body scrolls independently; header stays fixed.

6. **Export CSV (stub):** Show toast "Coming soon" or log to console.

7. **Accessibility:** Modal should trap focus; ESC closes modal; confirm button auto-focused.

---

## Acceptance Checklist

### Visual
- [ ] Kill Switch visible only in LIVE mode
- [ ] Kill Switch has red background, white text
- [ ] Kill Switch shakes on single click
- [ ] Kill Switch shows progress ring on hold
- [ ] Modal has dark overlay
- [ ] Modal animates in smoothly
- [ ] Audit Log table displays mock entries
- [ ] Audit Log empty state displays correctly

### Behavior
- [ ] Single click on Kill Switch shows tooltip hint
- [ ] Double click opens confirmation modal
- [ ] 2-second hold activates kill switch
- [ ] Modal Cancel button closes modal
- [ ] Modal STOP ALL button triggers action + closes modal
- [ ] Modal closes on overlay click
- [ ] Modal closes on ESC key
- [ ] Kill Switch disabled when no active trading

### Code
- [ ] KillSwitch.tsx created
- [ ] ConfirmModal.tsx created
- [ ] AuditLog.tsx created
- [ ] TopBar.tsx imports and renders KillSwitch (LIVE only)
- [ ] CSS animations added to index.css
- [ ] No TS errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)

---

## App.tsx Integration (pseudo-code)

```tsx
// In App.tsx, add:
const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);

const handleKillSwitch = useCallback(() => {
  // For now, just log
  console.log('KILL SWITCH ACTIVATED');
  setLiveRunning(false);
  // TODO: Call backend API to stop all
}, []);

// In render, add:
{mode === 'LIVE' && (
  <KillSwitch
    onActivate={() => setKillSwitchModalOpen(true)}
    disabled={!liveRunning}
  />
)}

<ConfirmModal
  isOpen={killSwitchModalOpen}
  onClose={() => setKillSwitchModalOpen(false)}
  onConfirm={handleKillSwitch}
  title="⚠️ Stop All Trading?"
  message="This will immediately stop all trading activity:"
  bullets={[
    'Cancel all pending orders',
    'Close all open positions at market price',
    'Disable the trading bot',
  ]}
  confirmLabel="STOP ALL"
  confirmDestructive={true}
/>
```

---

## Verification Commands

```bash
cd web/dashboard-react
npm run build      # No TS errors
npm run lint       # Linter passes
npm run dev        # Manual visual check

# Test scenarios:
# 1. Switch to LIVE mode → Kill Switch visible
# 2. Switch to TEST/BACKTEST → Kill Switch hidden
# 3. Single click Kill Switch → shake animation
# 4. Double click Kill Switch → modal opens
# 5. Hold Kill Switch 2s → modal opens
# 6. Modal ESC → closes
# 7. Modal overlay click → closes
# 8. Modal STOP ALL → logs and closes
```

---

## Notes/Risks

- **Medium risk:** New components, but no backend integration yet.
- **Accessibility:** Modal focus trapping needs careful implementation.
- **Animation performance:** Keep animations simple (CSS only, no JS animation libs).
- **False positives:** Kill Switch must be hard to trigger accidentally (double-click + hold both help).

