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
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '—';
}

export default function StatsTicker({ mode, kpi, backtestKpi }: StatsTickerProps) {
  const isBacktest = mode === 'backtest';

  const renderMetric = (label: string, value: string | number, color?: 'positive' | 'negative') => {
    const colorClass =
      color === 'positive'
        ? 'text-emerald-400'
        : color === 'negative'
          ? 'text-red-400'
          : 'text-gray-300';

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">{label}:</span>
        <span className={`text-[11px] font-medium ${colorClass}`}>{value}</span>
      </div>
    );
  };

  if (!kpi) {
    return (
      <div className="h-8 min-h-[32px] px-6 border-b border-[#1A1C22] bg-[#05070A] flex items-center gap-4 text-xs flex-shrink-0">
        <span className="text-gray-500">—</span>
      </div>
    );
  }

  return (
    <div className="h-8 min-h-[32px] px-6 border-b border-[#1A1C22] bg-[#05070A] flex items-center gap-4 text-xs flex-shrink-0">
      {isBacktest ? (
        <>
          {renderMetric(
            'Total PnL',
            `$${formatNumber((kpi as BacktestKPIData).totalPnl, 2)}`,
            (kpi as BacktestKPIData).totalPnl >= 0 ? 'positive' : 'negative'
          )}
          {renderMetric('Winrate', `${formatNumber((kpi as BacktestKPIData).winrate, 1)}%`)}
          {backtestKpi && (
            <>
              {renderMetric('Trades', backtestKpi.totalTrades)}
              {renderMetric('PF', formatNumber(backtestKpi.profitFactor, 2))}
              {renderMetric('DD', `-${formatNumber(backtestKpi.maxDrawdown, 1)}%`, 'negative')}
            </>
          )}
        </>
      ) : (
        <>
          {renderMetric(
            'Total PnL',
            `$${formatNumber((kpi as KPIData).totalPnl, 2)}`,
            (kpi as KPIData).totalPnl >= 0 ? 'positive' : 'negative'
          )}
          {renderMetric('Winrate', `${formatNumber((kpi as KPIData).winrate, 1)}%`)}
          {renderMetric('Positions', (kpi as KPIData).activePositions ?? '—')}
          {renderMetric('Risk', (kpi as KPIData).riskLevel ?? '—')}
        </>
      )}
    </div>
  );
}

