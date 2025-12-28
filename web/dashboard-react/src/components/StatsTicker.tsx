import { Mode, KPIData, BacktestKPIData, MetricState } from '../types';
import MetricCard from './MetricCard';
import { formatCurrency, formatInteger, formatNumber, formatPercent } from '../utils/formatters';

interface StatsTickerProps {
  mode: Mode;
  kpi: KPIData | BacktestKPIData | null;
  balance?: number;
  backtestKpi?: {
    totalTrades: number;
    profitFactor: number;
    maxDrawdown: number;
  };
  backtestJobStatus?: 'idle' | 'queued' | 'running' | 'done' | 'error';
  backtestError?: string | null;
}

function subtitleLine(units: string, period: string, asOf: string): string {
  return `${units} · ${period} · as of ${asOf}`;
}

export default function StatsTicker({
  mode,
  kpi,
  balance,
  backtestKpi,
  backtestJobStatus = 'idle',
  backtestError,
}: StatsTickerProps) {
  const isBacktest = mode === 'BACKTEST';
  const isLoading = !kpi;
  const asOf = '—';

  const backtestReady = (backtestJobStatus === 'done') || Boolean(backtestKpi && backtestKpi.totalTrades > 0);
  const backtestState: MetricState =
    backtestJobStatus === 'error'
      ? 'error'
      : backtestJobStatus === 'running' || backtestJobStatus === 'queued'
      ? 'loading'
      : backtestReady
      ? 'ok'
      : 'empty';

  if (isLoading) {
    return (
      <div
        className="h-20 min-h-[80px] px-6 flex items-center gap-3 flex-shrink-0 overflow-x-auto"
        style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--stroke)' }}
      >
        <MetricCard label="Equity" value="—" subtitle={subtitleLine('USD', '—', asOf)} state="loading" />
        <MetricCard label="Net P&L" value="—" subtitle={subtitleLine('USD', '—', asOf)} state="loading" />
        <MetricCard label="Win Rate" value="—" subtitle={subtitleLine('%', '—', asOf)} state="loading" />
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
          <MetricCard
            label="Final Equity"
            value="—"
            subtitle={subtitleLine('USD', '—', asOf)}
            source="Backtest engine"
            state={backtestState === 'loading' ? 'loading' : 'empty'}
          />
          <MetricCard
            label="Total P&L"
            value={formatCurrency((kpi as BacktestKPIData).totalPnl)}
            subtitle={subtitleLine('USD', '—', asOf)}
            source="Backtest engine"
            state={backtestState}
            trend={(kpi as BacktestKPIData).totalPnl > 0 ? 'up' : (kpi as BacktestKPIData).totalPnl < 0 ? 'down' : 'neutral'}
            tooltip={backtestState === 'error' ? (backtestError ?? 'Error') : undefined}
          />
          <MetricCard
            label="Total Trades"
            value={formatInteger(backtestKpi?.totalTrades)}
            subtitle={subtitleLine('count', '—', asOf)}
            source="Backtest engine"
            state={backtestState}
            tooltip={backtestState === 'error' ? (backtestError ?? 'Error') : undefined}
          />
          <MetricCard
            label="Max Drawdown"
            value={formatPercent(backtestKpi?.maxDrawdown ? -Math.abs(backtestKpi.maxDrawdown) : null)}
            subtitle={subtitleLine('%', '—', asOf)}
            source="Backtest engine"
            state={backtestState}
            trend="down"
            tooltip={backtestState === 'error' ? (backtestError ?? 'Error') : undefined}
          />
          <MetricCard
            label="Win Rate"
            value={formatPercent((kpi as BacktestKPIData).winrate)}
            subtitle={subtitleLine('%', '—', asOf)}
            source="Backtest engine"
            state={backtestState}
            tooltip={backtestState === 'error' ? (backtestError ?? 'Error') : undefined}
          />
          <MetricCard
            label="Profit Factor"
            value={formatNumber(backtestKpi?.profitFactor, 2)}
            subtitle={subtitleLine('—', '—', asOf)}
            source="Backtest engine"
            state={backtestState}
            trend={Number(backtestKpi?.profitFactor) >= 1 ? 'up' : 'down'}
            tooltip={backtestState === 'error' ? (backtestError ?? 'Error') : undefined}
          />
          <MetricCard
            label="Sharpe Ratio"
            value="—"
            subtitle={subtitleLine('—', '—', asOf)}
            source="Backtest engine (risk-free rate: 0%)"
            state={backtestState === 'loading' ? 'loading' : 'empty'}
          />
        </>
      ) : (
        <>
          <MetricCard
            label={mode === 'TEST' ? 'Equity (sim)' : 'Equity'}
            value={formatCurrency(balance, { showSign: false })}
            subtitle={subtitleLine('USD', mode === 'TEST' ? 'simulated' : '—', asOf)}
            source={mode === 'TEST' ? 'Internal' : 'Bybit balance API'}
            state={balance == null ? 'empty' : 'ok'}
          />
          <MetricCard
            label={mode === 'TEST' ? 'Net P&L (sim)' : 'Net P&L'}
            value={formatCurrency((kpi as KPIData).totalPnl)}
            subtitle={subtitleLine('USD', mode === 'TEST' ? 'simulated' : 'today', asOf)}
            source={mode === 'TEST' ? 'Internal' : 'Calculated'}
            state="ok"
            trend={(kpi as KPIData).totalPnl > 0 ? 'up' : (kpi as KPIData).totalPnl < 0 ? 'down' : 'neutral'}
          />
          <MetricCard
            label="Open Positions"
            value={formatInteger((kpi as KPIData).activePositions)}
            subtitle={subtitleLine('count', mode === 'TEST' ? 'simulated' : '—', asOf)}
            source={mode === 'TEST' ? 'Internal' : 'Bybit positions API'}
            state="ok"
          />
          <MetricCard
            label="Max Drawdown"
            value="—"
            subtitle={subtitleLine('%', 'session', asOf)}
            source={mode === 'TEST' ? 'Internal' : 'Calculated'}
            state="empty"
            trend="down"
          />
          <MetricCard
            label="Win Rate"
            value={formatPercent((kpi as KPIData).winrate)}
            subtitle={subtitleLine('%', mode === 'TEST' ? 'sim trades' : 'last 20', asOf)}
            source={mode === 'TEST' ? 'Internal' : 'Calculated'}
            state="ok"
          />
          {mode === 'LIVE' && (
            <MetricCard
              label="Risk Level"
              value={(kpi as KPIData).riskLevel || '—'}
              subtitle={subtitleLine('—', '—', asOf)}
              source="Risk engine"
              state={(kpi as KPIData).riskLevel ? 'ok' : 'empty'}
            />
          )}
        </>
      )}
    </div>
  );
}

