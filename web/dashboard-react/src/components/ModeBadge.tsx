import { Mode } from '../types';

interface ModeBadgeProps {
  mode: Mode;
  className?: string;
}

export default function ModeBadge({ mode, className = '' }: ModeBadgeProps) {
  const modeLabels: Record<Mode, string> = {
    LIVE: 'LIVE',
    TEST: 'TEST',
    BACKTEST: 'BACKTEST',
  };

  const modeAccents: Record<Mode, { color: string; bg: string; border: string }> = {
    BACKTEST: {
      color: 'var(--accent-backtest)',
      bg: 'var(--accent-backtest-bg)',
      border: 'var(--accent-backtest-border)',
    },
    LIVE: {
      color: 'var(--accent-live)',
      bg: 'var(--accent-live-bg)',
      border: 'var(--accent-live-border)',
    },
    TEST: {
      color: 'var(--accent-test)',
      bg: 'var(--accent-test-bg)',
      border: 'var(--accent-test-border)',
    },
  };

  const accent = modeAccents[mode];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${className}`}
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        color: accent.color,
      }}
    >
      {modeLabels[mode]}
    </span>
  );
}

