import { Mode, KPIData, BacktestKPIData } from '../types';

interface StatsTickerProps {
  mode: Mode;
  kpi: KPIData | BacktestKPIData | null;
  backtestKpi?: {
    totalTrades: number;
    profitFactor: number;
    maxDrawdown: number;
  };
}

function formatNumber(value: unknown, digits: number = 2): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(digits);
  }
  return '—';
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number, digits: number = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  color?: 'positive' | 'negative' | 'neutral';
  isLoading?: boolean;
}

function KPICard({ label, value, delta, color = 'neutral', isLoading }: KPICardProps) {
  const colorStyles = {
    positive: { text: 'var(--status-profit)', bg: 'var(--status-profit-bg)', border: 'var(--status-profit-border)' },
    negative: { text: 'var(--status-loss)', bg: 'var(--status-loss-bg)', border: 'var(--status-loss-border)' },
    neutral: { text: 'var(--text-1)', bg: 'var(--surface-2)', border: 'var(--stroke)' },
  };

  const style = colorStyles[color];

  if (isLoading) {
    return (
      <div 
        className="px-4 py-3 rounded-lg flex flex-col gap-1"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
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
      className="px-4 py-3 rounded-lg flex flex-col gap-1"
      style={{ 
        background: style.bg, 
        border: `1px solid ${style.border}`,
      }}
    >
      <div className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="flex items-baseline gap-2">
        <span 
          className="text-lg font-semibold tabular-nums"
          style={{ color: style.text }}
        >
          {value}
        </span>
        {delta && (
          <span 
            className="text-xs font-medium"
            style={{ color: 'var(--text-3)' }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function StatsTicker({ mode, kpi, backtestKpi }: StatsTickerProps) {
  const isBacktest = mode === 'backtest';
  const isLoading = !kpi;

  if (isLoading) {
    return (
      <div 
        className="h-20 min-h-[80px] px-6 flex items-center gap-3 flex-shrink-0"
        style={{ 
          background: 'var(--surface-1)', 
          borderBottom: '1px solid var(--stroke)' 
        }}
      >
        <KPICard label="Loading..." value="—" isLoading={true} />
        <KPICard label="Loading..." value="—" isLoading={true} />
        <KPICard label="Loading..." value="—" isLoading={true} />
      </div>
    );
  }

  return (
    <div 
      className="h-20 min-h-[80px] px-6 flex items-center gap-3 flex-shrink-0 overflow-x-auto"
      style={{ 
        background: 'var(--surface-1)', 
        borderBottom: '1px solid var(--stroke)' 
      }}
    >
      {isBacktest ? (
        <>
          <KPICard
            label="Total PnL"
            value={formatCurrency((kpi as BacktestKPIData).totalPnl ?? 0)}
            color={(kpi as BacktestKPIData).totalPnl >= 0 ? 'positive' : 'negative'}
          />
          <KPICard
            label="Winrate"
            value={formatPercent((kpi as BacktestKPIData).winrate)}
            color="neutral"
          />
          {backtestKpi && (
            <>
              <KPICard
                label="Trades"
                value={backtestKpi.totalTrades.toString()}
                color="neutral"
              />
              <KPICard
                label="Profit Factor"
                value={formatNumber(backtestKpi.profitFactor, 2)}
                color={backtestKpi.profitFactor >= 1 ? 'positive' : 'negative'}
              />
              <KPICard
                label="Max Drawdown"
                value={formatPercent(-backtestKpi.maxDrawdown)}
                color="negative"
              />
            </>
          )}
        </>
      ) : (
        <>
          <KPICard
            label="Total PnL"
            value={formatCurrency((kpi as KPIData).totalPnl ?? 0)}
            color={(kpi as KPIData).totalPnl >= 0 ? 'positive' : 'negative'}
          />
          <KPICard
            label="Winrate"
            value={formatPercent((kpi as KPIData).winrate)}
            color="neutral"
          />
          <KPICard
            label="Positions"
            value={String((kpi as KPIData).activePositions ?? 0)}
            color="neutral"
          />
          <KPICard
            label="Risk Level"
            value={(kpi as KPIData).riskLevel ?? '—'}
            color="neutral"
          />
        </>
      )}
    </div>
  );
}

