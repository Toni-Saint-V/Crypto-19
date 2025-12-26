# Ticket 0010 — Metrics Row: Labels, Units, As-Of, Source
Status: READY
Owner: Frontend Engineer
Priority: P0
Scope: web/dashboard-react

---

## Goal

Every metric must be self-documenting: label + value + units + period + "as of" timestamp + source (tooltip). No ambiguous numbers.

---

## In Scope

### 1. Metric Card Component Redesign

Current `MetricCard.tsx` is too simple. Replace with enhanced version that supports:

```typescript
interface MetricCardProps {
  label: string;           // e.g., "Net P&L"
  value: string;           // e.g., "+$1,247.50"
  subtitle?: string;       // e.g., "today" or "30d"
  asOf?: string;           // e.g., "14:32 UTC"
  source?: string;         // e.g., "Bybit positions API" (tooltip)
  state: 'loading' | 'empty' | 'error' | 'stale' | 'ok';
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;    // for expandable metrics (future)
}
```

### 2. StatsTicker Enhancement

Update `StatsTicker.tsx` to use new MetricCard with full props.

### 3. Number Formatting Rules

Create utility `formatters.ts`:

```typescript
// Currency: $ + comma separator + 2 decimals + sign
formatCurrency(1247.5)     // → "+$1,247.50"
formatCurrency(-847.3)     // → "-$847.30"
formatCurrency(1200000)    // → "$1.2M" (abbreviate large)

// Percentage: 1-2 decimals + % + sign for positive
formatPercent(68.5)        // → "+68.5%"
formatPercent(-12.3)       // → "-12.3%"
formatPercent(0)           // → "0.0%"

// Integer: comma separator
formatInteger(1532)        // → "1,532"

// Crypto quantity: up to 8 decimals, trim trailing zeros
formatCrypto(0.05230000)   // → "0.0523"
formatCrypto(1.00000000)   // → "1"
```

### 4. Per-Mode Metrics Specification

#### LIVE Mode

| Slot | Label | Value Example | Subtitle | As-Of | Source |
|------|-------|---------------|----------|-------|--------|
| 1 | Equity | $10,432.00 | — | 14:32 UTC | Bybit balance API |
| 2 | Net P&L | +$247.50 | today | 14:32 UTC | Calculated |
| 3 | Open Positions | 3 | — | 14:32 UTC | Bybit positions API |
| 4 | Max Drawdown | -8.2% | session | 14:32 UTC | Calculated |
| 5 | Win Rate | +68.5% | last 20 | — | Calculated |
| 6 | Risk Level | Moderate | — | — | Risk engine |

#### TEST Mode

| Slot | Label | Value Example | Subtitle | As-Of | Source |
|------|-------|---------------|----------|-------|--------|
| 1 | Equity (sim) | $10,432.00 | simulated | 14:32 | Internal |
| 2 | Net P&L (sim) | +$247.50 | simulated | 14:32 | Internal |
| 3 | Open Positions | 2 | simulated | 14:32 | Internal |
| 4 | Max Drawdown | -5.1% | session | 14:32 | Internal |
| 5 | Win Rate | +72.0% | sim trades | — | Internal |

#### BACKTEST Mode

| Slot | Label | Value Example | Subtitle | As-Of | Source |
|------|-------|---------------|----------|-------|--------|
| 1 | Final Equity | $12,847.00 | — | — | Backtest engine |
| 2 | Total P&L | +$2,847.00 | — | — | Backtest engine |
| 3 | Total Trades | 142 | — | — | Backtest engine |
| 4 | Max Drawdown | -12.3% | — | — | Backtest engine |
| 5 | Win Rate | +61.2% | — | — | Backtest engine |
| 6 | Profit Factor | 1.87 | — | — | Backtest engine |
| 7 | Sharpe Ratio | 1.42 | — | — | Backtest engine |

### 5. State Handling

| State | Visual | Value Display |
|-------|--------|---------------|
| loading | Skeleton pulse (gray bar) | — |
| empty | Muted text | "—" |
| error | Red "!" icon | "Error" + tooltip with details |
| stale | Amber dot + dimmed value | Value shown but faded |
| ok | Normal | Value shown |

---

## Out of Scope

- ML widgets (separate ticket)
- Metric click-to-expand (future)
- Real-time WebSocket updates (use polling for now)
- Backend changes

---

## Files to Edit

1. `web/dashboard-react/src/components/MetricCard.tsx` — complete rewrite
2. `web/dashboard-react/src/components/StatsTicker.tsx` — use new MetricCard API
3. `web/dashboard-react/src/utils/formatters.ts` — **create new file**
4. `web/dashboard-react/src/types.ts` — add MetricState type

---

## New File: `utils/formatters.ts`

```typescript
// Number formatting utilities

export function formatCurrency(
  value: number | null | undefined,
  options?: { abbreviate?: boolean; showSign?: boolean }
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  
  const { abbreviate = false, showSign = true } = options ?? {};
  const absValue = Math.abs(value);
  
  // Abbreviate large numbers
  if (abbreviate && absValue >= 1_000_000) {
    const millions = value / 1_000_000;
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}$${millions.toFixed(1)}M`;
  }
  
  if (abbreviate && absValue >= 1_000) {
    const thousands = value / 1_000;
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}$${thousands.toFixed(1)}K`;
  }
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);
  
  if (value < 0) return `-${formatted}`;
  if (showSign && value > 0) return `+${formatted}`;
  return formatted;
}

export function formatPercent(
  value: number | null | undefined,
  options?: { decimals?: number; showSign?: boolean }
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  
  const { decimals = 1, showSign = true } = options ?? {};
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatCrypto(
  value: number | null | undefined,
  symbol?: string
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  // Up to 8 decimals, trim trailing zeros
  const formatted = value.toFixed(8).replace(/\.?0+$/, '');
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatTimestamp(date: Date | number | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
```

---

## MetricCard Component (new implementation)

```tsx
import { ReactNode } from 'react';

export type MetricState = 'loading' | 'empty' | 'error' | 'stale' | 'ok';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  asOf?: string;
  source?: string;
  state?: MetricState;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

export default function MetricCard({
  label,
  value,
  subtitle,
  asOf,
  source,
  state = 'ok',
  trend = 'neutral',
  icon,
  className = '',
}: MetricCardProps) {
  // Color based on trend
  const trendColors = {
    up: 'var(--status-profit)',
    down: 'var(--status-loss)',
    neutral: 'var(--text-1)',
  };
  
  const valueColor = state === 'error' 
    ? 'var(--status-loss)' 
    : state === 'stale'
    ? 'var(--text-3)'
    : trendColors[trend];

  // Loading state
  if (state === 'loading') {
    return (
      <div
        className={`px-4 py-3 rounded-lg flex flex-col gap-1 ${className}`}
        style={{ 
          background: 'var(--surface-2)', 
          border: '1px solid var(--stroke)' 
        }}
      >
        <div className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</div>
        <div 
          className="h-6 w-20 rounded animate-pulse" 
          style={{ background: 'var(--surface-3)' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg flex flex-col gap-1 relative group ${className}`}
      style={{ 
        background: 'var(--surface-2)', 
        border: '1px solid var(--stroke)' 
      }}
      title={source}
    >
      {/* Stale indicator */}
      {state === 'stale' && (
        <span 
          className="absolute top-2 right-2 h-2 w-2 rounded-full"
          style={{ background: 'var(--status-warn)' }}
          title="Data may be stale"
        />
      )}
      
      {/* Error indicator */}
      {state === 'error' && (
        <span 
          className="absolute top-2 right-2 text-xs"
          style={{ color: 'var(--status-loss)' }}
          title="Error loading data"
        >
          !
        </span>
      )}

      {/* Label */}
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-xs">{icon}</span>}
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
      </div>
      
      {/* Value + Subtitle */}
      <div className="flex items-baseline gap-2">
        <span 
          className="text-lg font-semibold tabular-nums"
          style={{ color: valueColor }}
        >
          {state === 'empty' ? '—' : value}
        </span>
        {subtitle && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {subtitle}
          </span>
        )}
      </div>
      
      {/* As-of timestamp (small, bottom) */}
      {asOf && state === 'ok' && (
        <div className="text-[10px]" style={{ color: 'var(--text-3)', opacity: 0.7 }}>
          as of {asOf}
        </div>
      )}
      
      {/* Source tooltip on hover (via title attribute) */}
    </div>
  );
}
```

---

## Microcopy Spec

### Metric Labels (exact)

```typescript
// LIVE mode
const liveMetrics = [
  { label: 'Equity', subtitle: undefined },
  { label: 'Net P&L', subtitle: 'today' },
  { label: 'Open Positions', subtitle: undefined },
  { label: 'Max Drawdown', subtitle: 'session' },
  { label: 'Win Rate', subtitle: 'last 20' },
  { label: 'Risk Level', subtitle: undefined },
];

// TEST mode - append "(sim)" to monetary values
const testMetrics = [
  { label: 'Equity', subtitle: 'simulated' },
  { label: 'Net P&L', subtitle: 'simulated' },
  { label: 'Open Positions', subtitle: 'simulated' },
  { label: 'Max Drawdown', subtitle: 'session' },
  { label: 'Win Rate', subtitle: 'sim trades' },
];

// BACKTEST mode
const backtestMetrics = [
  { label: 'Final Equity', subtitle: undefined },
  { label: 'Total P&L', subtitle: undefined },
  { label: 'Total Trades', subtitle: undefined },
  { label: 'Max Drawdown', subtitle: undefined },
  { label: 'Win Rate', subtitle: undefined },
  { label: 'Profit Factor', subtitle: undefined },
  { label: 'Sharpe Ratio', subtitle: undefined },
];
```

### Source Tooltips (exact)

```typescript
const sources: Record<string, string> = {
  equity: 'Bybit balance API',
  netPnl: 'Calculated from positions',
  positions: 'Bybit positions API',
  drawdown: 'Calculated from equity history',
  winRate: 'Calculated from closed trades',
  riskLevel: 'Risk engine assessment',
  profitFactor: 'Backtest engine',
  sharpe: 'Backtest engine (risk-free rate: 0%)',
};
```

### Empty State Text

```typescript
// When no data available
'—'  // em-dash, not hyphen

// For risk level when unknown
'—'  // not "Unknown" or "N/A"
```

---

## Edge Cases

1. **NaN/undefined values:** Always show "—" (em-dash), never "NaN" or "undefined".

2. **Very large numbers:** Use abbreviation ($1.2M, $843K) when value exceeds $100,000.

3. **Negative drawdown display:** Drawdown is always negative; show as "-12.3%" not "12.3%".

4. **Zero values:** Show "0" or "$0.00" — not empty state.

5. **Stale data (>5min old):** Show amber dot indicator + dimmed value.

6. **Error fetching:** Show "!" icon + "Error" as value + tooltip with error message.

7. **Switching modes:** Metrics should show loading state briefly while new data fetches.

---

## Acceptance Checklist

### Visual
- [ ] Every metric shows: label + value + subtitle (where applicable)
- [ ] As-of timestamp visible on hover or always (small text)
- [ ] Source shown in tooltip on hover
- [ ] Loading state shows skeleton pulse
- [ ] Empty state shows "—" (em-dash)
- [ ] Error state shows red "!" indicator
- [ ] Stale state shows amber dot
- [ ] Positive values are green, negative are red
- [ ] Numbers use tabular-nums (fixed-width digits)

### Behavior
- [ ] Mode switch shows loading state for 200-500ms
- [ ] Tooltips appear on hover with source info
- [ ] No "0.00" shown as placeholder when data not yet loaded
- [ ] Large numbers abbreviated correctly ($1.2M)

### Code
- [ ] New `formatters.ts` utility created
- [ ] MetricCard supports all states
- [ ] StatsTicker uses new MetricCard API
- [ ] No TS errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)

---

## Verification Commands

```bash
cd web/dashboard-react
npm run build      # No TS errors
npm run lint       # Linter passes
npm run dev        # Manual visual check

# Test formatter functions (add to test file if tests exist)
```

---

## Notes/Risks

- **Low risk:** Pure UI changes, no state logic changes.
- **Formatting edge cases:** Test with extreme values (0, negative, very large).
- **Tooltip accessibility:** Ensure source info is accessible (not just on hover).

