import MetricChip from './MetricChip';

export default function BacktestKPIPanel() {
  const totalPnl = 34210;
  const winrate = 61.2;
  const totalTrades = 486;
  const profitFactor = 1.9;
  const maxDrawdown = 14.3;

  return (
    <div className="h-full p-6 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Backtest Results</h3>
        <p className="text-xs text-gray-400">Mean Reversion v2 portfolio</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricChip
          label="Total PnL"
          value={`$${totalPnl.toLocaleString()}`}
          valueColor="positive"
        />
        <MetricChip label="Winrate" value={`${winrate.toFixed(1)}%`} />
        <MetricChip label="Total Trades" value={totalTrades} />
        <MetricChip label="Profit Factor" value={profitFactor.toFixed(2)} />
      </div>

      <div className="mt-3">
        <MetricChip
          label="Max Drawdown"
          value={`-${maxDrawdown.toFixed(1)}%`}
          valueColor="negative"
        />
      </div>
    </div>
  );
}
