import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import StatsTicker from './components/StatsTicker';
import ChartArea from './components/ChartArea';
import Sidebar from './components/Sidebar';
import { Mode, KPIData, BacktestKPIData } from './types';

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

const liveKPI: KPIData = {
  totalPnl: 1247.5,
  winrate: 68.5,
  activePositions: 3,
  riskLevel: 'Moderate',
};

function App() {
  const [mode, setMode] = useState<Mode>('live');
  const [symbol] = useState('ETHUSDT');
  const [exchange] = useState('Bybit');
  const [timeframe, setTimeframe] = useState('15m');
  const [strategy] = useState('Mean Reversion v2');
  const [balance] = useState(10000);
  const [backtestKpi, setBacktestKpi] = useState<BacktestKpi>({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });

  
  const [backtestResult, setBacktestResult] = useState<any | null>(null);

  const [backtestParams, setBacktestParams] = useState<any>({
    dateRange: { from: '', to: '' },
    initialBalance: 1000,
    feesBps: 6,
    slippageBps: 2,
    limit: 600,
  });
  void setBacktestParams;
  const [backtestLoading, setBacktestLoading] = useState(false);
  
  void backtestLoading;
const [backtestError, setBacktestError] = useState<string | null>(null);

  void backtestError;
const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchBacktestKpi(apiBase).then(setBacktestKpi);
  }, [apiBase]);

  useEffect(() => {
    const handler = (e: any) => {
      const data = e?.detail || {};
      const src = (data && (data.kpi || data.summary || data)) || {};
      setBacktestKpi({
        totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
        profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
        maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
      });
    };

    window.addEventListener('backtest:updated', handler as any);

  const runBacktestSync = async () => {
    try {
      setBacktestLoading(true);
      setBacktestError(null);
      const base = String(apiBase || '').replace(/\/$/, '');
      const url = `${base}/api/backtest/run_sync`;
      const payload: any = {
        mode: 'test',
        exchange: 'bybit',
        symbol: 'BTCUSDT',
        timeframe: timeframe,
        limit: Number(backtestParams?.limit || 600),
        feesBps: Number(backtestParams?.feesBps || 6),
        slippageBps: Number(backtestParams?.slippageBps || 2),
        _port: 8000,
      };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      setBacktestResult(j);
      const summary = (j && j.summary) ? j.summary : {};
      const kpi = {
        totalTrades: Number(summary.totalTrades || 0),
        profitFactor: Number(summary.profitFactor || 0),
        maxDrawdown: Number(summary.maxDrawdown || 0),
      };
      try {
        setBacktestKpi(kpi as any);
        window.dispatchEvent(new CustomEvent('backtest:updated', { detail: kpi }));
      } catch (e) {
      }
    } catch (e: any) {
      setBacktestError(String(e?.message || e));
    } finally {
      setBacktestLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== 'backtest') return;
    if (backtestResult) return;
    runBacktestSync();
  }, [mode]);

  return() => window.removeEventListener('backtest:updated', handler as any);
  }, []);

  useEffect(() => {
    if (mode !== 'backtest') return;

    let cancelled = false;

    const tick = async () => {
      const data = await fetchBacktestKpi(apiBase).catch(() => ({
        totalTrades: 0,
        profitFactor: 0,
        maxDrawdown: 0,
      }));

      if (cancelled) return;

      setBacktestKpi(data);
      window.dispatchEvent(new CustomEvent('backtest:updated', { detail: data }));
    };

    tick();
    const id = window.setInterval(tick, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [mode, apiBase]);
const isBacktest = mode === 'backtest';
  const kpi: KPIData | BacktestKPIData | null = isBacktest
    ? {
        totalPnl: 0, // Will be calculated from backtest results if available
        winrate: 0,
        totalTrades: backtestKpi.totalTrades,
        profitFactor: backtestKpi.profitFactor,
        maxDrawdown: backtestKpi.maxDrawdown,
      }
    : liveKPI;

  return (
    <div className="h-screen w-screen bg-[#05070A] text-gray-100 overflow-hidden relative">
      {/* Background waves pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#21D4B4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#21D4B4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,200 Q400,100 800,200 T1600,200" stroke="url(#wave1)" strokeWidth="1" fill="none" />
          <path d="M0,400 Q600,300 1200,400 T2400,400" stroke="url(#wave2)" strokeWidth="1" fill="none" />
          <path d="M0,600 Q500,500 1000,600 T2000,600" stroke="url(#wave1)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <div className="w-full h-full flex flex-col relative z-10">
        <TopBar
          mode={mode}
          onModeChange={setMode}
          symbol={symbol}
          exchange={exchange}
          balance={balance}
        />

        <StatsTicker mode={mode} kpi={kpi} backtestKpi={isBacktest ? backtestKpi : undefined} />

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex flex-col flex-1 overflow-hidden min-w-0 min-h-0">
            <ChartArea mode={mode} symbol={symbol} exchange={exchange} timeframe={timeframe} strategy={strategy} onTimeframeChange={setTimeframe} backtestResult={backtestResult} />
          </div>

          <Sidebar mode={mode} />
        </div>
      </div>
    </div>
  );
}

export default App;
