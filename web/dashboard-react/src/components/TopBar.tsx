import { Mode, KPIData, BacktestKPIData } from '../types';
import MetricCard from './MetricCard';

interface TopBarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  symbol: string;
  exchange: string;
  balance: number;
}

const liveKPI: KPIData = {
  totalPnl: 1247.5,
  winrate: 68.5,
  activePositions: 3,
  riskLevel: 'Moderate',
};

const backtestKPI: BacktestKPIData = {
  totalPnl: 34210.0,
  winrate: 61.2,
  totalTrades: 486,
  profitFactor: 1.9,
  maxDrawdown: 14.3,
};

function ModeButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const { label, active, onClick } = props;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
        active
          ? 'bg-[#21D4B4] text-black'
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function TopBar({
  mode,
  onModeChange,
  exchange,
  balance,
}: TopBarProps) {
  const isBacktest = mode === 'backtest';
  const isTest = mode === 'test';
  const kpi = isBacktest ? backtestKPI : liveKPI;

  return (
    <div className="h-[80px] min-h-[80px] flex items-center justify-between px-6 border-b border-[#1A1C22] bg-[#05070A] flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="text-lg font-semibold">
          <span className="text-white">Crypto</span>
          <span className="text-[#21D4B4]">Bot Pro</span>
        </div>
        {isTest && (
          <div className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
            TESTNET
          </div>
        )}
        <div className="text-xs text-gray-400">
          {exchange} • Balance: <span className="text-white">${balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <MetricCard
          label="Total PnL"
          value={`$${kpi.totalPnl.toFixed(2)}`}
          valueColor={kpi.totalPnl >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard label="Winrate" value={`${kpi.winrate.toFixed(1)}%`} />
        {isBacktest ? (
          <>
            <MetricCard label="Total Trades" value={backtestKPI.totalTrades} />
            <MetricCard
              label="Profit Factor"
              value={backtestKPI.profitFactor.toFixed(2)}
            />
            <MetricCard
              label="Max Drawdown"
              value={`-${backtestKPI.maxDrawdown.toFixed(1)}%`}
              valueColor="negative"
            />
          </>
        ) : (
          <>
            <MetricCard label="Active Positions" value={liveKPI.activePositions} />
            <MetricCard label="Risk Level" value={liveKPI.riskLevel} />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>Connected</span>
        </div>
        <div className="flex items-center gap-1 bg-[#090B10] border border-[#1A1C22] rounded-full px-1 py-0.5">
          <ModeButton
            label="LIVE"
            active={mode === 'live'}
            onClick={() => onModeChange('live')}
          />
          <ModeButton
            label="TEST"
            active={mode === 'test'}
            onClick={() => onModeChange('test')}
          />
          <ModeButton
            label="BACKTEST"
            active={mode === 'backtest'}
            onClick={() => onModeChange('backtest')}
          />
        </div>
      </div>
    </div>
  );
}
