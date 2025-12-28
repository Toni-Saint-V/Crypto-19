import { useState } from 'react';
import { Mode, normalizeMode } from '../types';

interface TopBarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  symbol: string;
  exchange: string;
  balance: number;
  primaryCtaLabel: string;
  onPrimaryCta: () => void;
  primaryCtaDisabled?: boolean;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
  secondaryCtaDisabled?: boolean;
}

function ModeButton(props: {
  label: string;
  value: Mode;
  active: boolean;
  onClick: () => void;
  accent: { bg: string; glow: string };
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const { label, active, onClick, accent, hovered, onHoverChange } = props;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ease-out ${
        active ? 'shadow-lg' : ''
      }`}
      style={{
        background: active ? accent.bg : 'transparent',
        boxShadow: active ? `0 0 12px ${accent.glow}` : 'none',
        color: active ? 'var(--text-1)' : (hovered ? 'var(--text-2)' : 'var(--text-3)'),
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {label}
    </button>
  );
}

export default function TopBar({
  mode,
  onModeChange,
  symbol,
  exchange,
  balance,
  primaryCtaLabel,
  onPrimaryCta,
  primaryCtaDisabled = false,
  secondaryCtaLabel,
  onSecondaryCta,
  secondaryCtaDisabled = false,
}: TopBarProps) {
  const [hoveredMode, setHoveredMode] = useState<Mode | null>(null);
  const [settingsHovered, setSettingsHovered] = useState(false);
  
  const modeAccents: Record<Mode, { color: string; bg: string; border: string; glow: string }> = {
    BACKTEST: {
      color: 'var(--accent-backtest)',
      bg: 'var(--accent-backtest-bg)',
      border: 'var(--accent-backtest-border)',
      glow: 'var(--accent-backtest-glow)',
    },
    LIVE: {
      color: 'var(--accent-live)',
      bg: 'var(--accent-live-bg)',
      border: 'var(--accent-live-border)',
      glow: 'var(--accent-live-glow)',
    },
    TEST: {
      color: 'var(--accent-test)',
      bg: 'var(--accent-test-bg)',
      border: 'var(--accent-test-border)',
      glow: 'var(--accent-test-glow)',
    },
  };

  const accent = modeAccents[mode];

  return (
    <div 
      className="h-14 min-h-[56px] flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: 'var(--surface-1)',
        borderBottom: `1px solid var(--stroke)`,
      }}
    >
      {/* Left: Brand + Symbol + Exchange + Balance */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-base font-semibold">
          <span style={{ color: 'var(--text-1)' }}>Crypto</span>
          <span style={{ color: accent.color }}>Bot Pro</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-3)' }}>
          {symbol} • {exchange} • <span style={{ color: 'var(--text-2)' }}>${balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Center: Mode Segmented Control (DOMINANT) */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ background: 'var(--surface-2)', padding: '4px', borderRadius: 'var(--radius-2)' }}>
        <ModeButton
          label="LIVE"
          value="LIVE"
          active={mode === 'LIVE'}
          onClick={() => onModeChange(normalizeMode('live'))}
          accent={{ bg: modeAccents.LIVE.bg, glow: modeAccents.LIVE.glow }}
          hovered={hoveredMode === 'LIVE'}
          onHoverChange={(h) => setHoveredMode(h ? 'LIVE' : null)}
        />
        <ModeButton
          label="TEST"
          value="TEST"
          active={mode === 'TEST'}
          onClick={() => onModeChange(normalizeMode('test'))}
          accent={{ bg: modeAccents.TEST.bg, glow: modeAccents.TEST.glow }}
          hovered={hoveredMode === 'TEST'}
          onHoverChange={(h) => setHoveredMode(h ? 'TEST' : null)}
        />
        <ModeButton
          label="BACKTEST"
          value="BACKTEST"
          active={mode === 'BACKTEST'}
          onClick={() => onModeChange(normalizeMode('backtest'))}
          accent={{ bg: modeAccents.BACKTEST.bg, glow: modeAccents.BACKTEST.glow }}
          hovered={hoveredMode === 'BACKTEST'}
          onHoverChange={(h) => setHoveredMode(h ? 'BACKTEST' : null)}
        />
      </div>

      {/* Right: CTA + Connection + Settings */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Secondary CTA (optional) */}
        {secondaryCtaLabel && onSecondaryCta && (
          <button
            onClick={onSecondaryCta}
            disabled={secondaryCtaDisabled}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ease-out hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--stroke)',
              color: 'var(--text-2)',
            }}
            aria-label={secondaryCtaLabel}
            title={secondaryCtaDisabled ? 'Action unavailable' : undefined}
          >
            {secondaryCtaLabel}
          </button>
        )}

        {/* Primary CTA */}
        <button
          onClick={onPrimaryCta}
          disabled={primaryCtaDisabled}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: primaryCtaDisabled 
              ? 'var(--surface-2)'
              : accent.bg,
            boxShadow: primaryCtaDisabled 
              ? 'none'
              : `0 0 12px ${accent.glow}`,
            border: primaryCtaDisabled ? '1px solid var(--stroke)' : `1px solid ${accent.border}`,
            color: primaryCtaDisabled ? 'var(--text-3)' : accent.color,
          }}
          title={primaryCtaDisabled ? 'Action unavailable' : undefined}
          aria-label={primaryCtaLabel}
        >
          {primaryCtaLabel}
        </button>

        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
          <span 
            className="inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--status-profit)' }}
          />
          <span>Connected</span>
        </div>

        <button 
          className="p-1.5 transition-colors rounded-lg"
          style={{ 
            color: 'var(--text-3)',
            background: settingsHovered ? 'var(--surface-2)' : 'transparent',
          }}
          onMouseEnter={() => setSettingsHovered(true)}
          onMouseLeave={() => setSettingsHovered(false)}
          aria-label="Settings"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
