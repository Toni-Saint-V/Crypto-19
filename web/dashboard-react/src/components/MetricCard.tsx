import type { MetricState } from '../types';

type MetricTrend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string; // units + period + "as of <time>" (or "—")
  source?: string; // tooltip
  state?: MetricState;
  trend?: MetricTrend;
  tooltip?: string; // overrides title (e.g. error detail)
  className?: string;
}

export default function MetricCard({
  label,
  value,
  subtitle,
  source,
  state = 'ok',
  trend = 'neutral',
  tooltip,
  className = '',
}: MetricCardProps) {
  const trendColors: Record<MetricTrend, string> = {
    up: 'var(--status-profit)',
    down: 'var(--status-loss)',
    neutral: 'var(--text-1)',
  };

  const valueColor =
    state === 'error' ? 'var(--status-loss)' : state === 'stale' ? 'var(--text-3)' : trendColors[trend];

  const titleText = tooltip ?? source;

  if (state === 'loading') {
    return (
      <div
        className={`min-w-[140px] h-[64px] px-4 py-3 rounded-xl flex flex-col justify-between ${className}`}
        style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
      >
        <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          {label}
        </div>
        <div className="h-5 w-20 rounded animate-pulse" style={{ background: 'var(--surface-3)' }} />
        <div className="h-3 w-28 rounded animate-pulse" style={{ background: 'var(--surface-3)', opacity: 0.6 }} />
      </div>
    );
  }

  return (
    <div
      className={`min-w-[140px] h-[64px] px-4 py-3 rounded-xl flex flex-col justify-between relative ${className}`}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
      title={titleText}
    >
      {state === 'stale' && (
        <span
          className="absolute top-2 right-2 h-2 w-2 rounded-full"
          style={{ background: 'var(--status-warn)' }}
          title="Data delayed"
        />
      )}
      {state === 'error' && (
        <span
          className="absolute top-1.5 right-2 text-xs font-bold"
          style={{ color: 'var(--status-loss)' }}
          title={tooltip ?? 'Error'}
        >
          !
        </span>
      )}

      <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
        {label}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-sm font-semibold tabular-nums" style={{ color: valueColor }}>
          {state === 'empty' ? '—' : state === 'error' ? 'Error' : value}
        </div>
      </div>

      <div className="text-[10px] leading-tight" style={{ color: 'var(--text-3)', opacity: 0.8 }}>
        {subtitle ?? '—'}
      </div>
    </div>
  );
}
