import { Mode, KPIData, BacktestKPIData } from '../types';
import MetricCard from './MetricCard';
import { useEffect, useState } from "react";

type BacktestKpi = {
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
};

function num(v: any, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

async function fetchBacktestKpi(apiBase: string): Promise<BacktestKpi> {
  try {
    const r = await fetch(`${apiBase}/api/backtest`);
    const data = await r.json().catch(() => ({}));
    const src = (data && (data.kpi || data.summary || data)) || {};
    return {
      totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
      profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
      maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
    };
  } catch {
    return { totalTrades: 0, profitFactor: 0, maxDrawdown: 0 };
  }
}


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

const backtestKPI: BacktestKpi = { totalTrades: 0, profitFactor: 0, maxDrawdown: 0 };

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
  const apiBase = (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000";
  const [backtestKpiLive, setBacktestKpiLive] = useState<BacktestKpi>({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });

  useEffect(() => {
    fetchBacktestKpi(apiBase).then(setBacktestKpiLive);
  }, [apiBase]);

  
  useEffect(() => {
    const handler = (e: any) => {
      const data = e?.detail || {};
      const src = (data && (data.kpi || data.summary || data)) || {};
      setBacktestKpiLive({
        totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
        profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
        maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
      });
    };

    window.addEventListener("backtest:updated", handler as any);
    return () => window.removeEventListener("backtest:updated", handler as any);
  }, []);
const isBacktest = mode === 'backtest';
  const isTest = mode === 'test';
  const kpi = isBacktest ? backtestKpiLive : liveKPI;

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
