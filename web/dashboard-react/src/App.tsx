import { useState, useEffect, useRef, useCallback } from 'react';
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

async function fetchBacktestKpi(apiBase: string, signal?: AbortSignal): Promise<BacktestKpi> {
  try {
    const r = await fetch(`${apiBase}/api/backtest`, { signal });
    const data = await r.json().catch(() => ({}));
    const src = (data && (data.kpi || data.summary || data)) || {};
    return {
      totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
      profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
      maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
    };
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;
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
  
  // Mode isolation: separate state per mode
  const [backtestKpi, setBacktestKpi] = useState<BacktestKpi>({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const [backtestRunStatus, setBacktestRunStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [historyPreset, setHistoryPreset] = useState<'1Y' | '3Y' | 'custom'>('1Y');
  const [historyStart, setHistoryStart] = useState<number>(() => Math.floor((Date.now() - 365 * 24 * 3600 * 1000) / 1000));
  const [historyEnd, setHistoryEnd] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [historyJobId, setHistoryJobId] = useState<string | null>(null);
  void historyJobId;
  const [historyStatus, setHistoryStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [historyPath, setHistoryPath] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const historyPollRef = useRef<number | null>(null);
  
  // Live mode state
  const [liveRunning, setLiveRunning] = useState(false);
  
  // Test mode state
  const [testRunning, setTestRunning] = useState(false);
  const [testPaused, setTestPaused] = useState(false);
  const [testKpi, setTestKpi] = useState<KPIData>({
    totalPnl: 0,
    winrate: 0,
    activePositions: 0,
    riskLevel: 'Low',
  });
  
  // Race guards
  const modeVersionRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Separate AbortController for RUN request
  const runAbortControllerRef = useRef<AbortController | null>(null);
  const runVersionRef = useRef(0);

  const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000';
  const historyBase = apiBase.replace(/\/$/, '');

  const applyPreset = useCallback((preset: '1Y' | '3Y' | 'custom') => {
    const now = Date.now();
    if (preset === '1Y') {
      setHistoryStart(Math.floor((now - 365 * 24 * 3600 * 1000) / 1000));
      setHistoryEnd(Math.floor(now / 1000));
    } else if (preset === '3Y') {
      setHistoryStart(Math.floor((now - 3 * 365 * 24 * 3600 * 1000) / 1000));
      setHistoryEnd(Math.floor(now / 1000));
    }
    setHistoryPreset(preset);
  }, []);

  useEffect(() => {
    return () => {
      if (historyPollRef.current) {
        window.clearInterval(historyPollRef.current);
      }
    };
  }, []);

  const handleHistoryDownload = useCallback(async () => {
    // clear previous poll
    if (historyPollRef.current) {
      window.clearInterval(historyPollRef.current);
      historyPollRef.current = null;
    }
    setHistoryStatus('pending');
    setHistoryError(null);
    setHistoryCount(0);
    setHistoryPath(null);
    setHistoryJobId(null);
    try {
      const res = await fetch(`${historyBase}/api/history/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange,
          symbol,
          timeframe,
          start: historyStart,
          end: historyEnd,
          category: 'linear',
        }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok || body.status === 'error') {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const jobId = body.job_id || body.jobId;
      if (!jobId) {
        throw new Error('job_id missing');
      }
      setHistoryJobId(jobId);
      const poll = async () => {
        const statusRes = await fetch(`${historyBase}/api/history/status?job_id=${encodeURIComponent(jobId)}`);
        const statusBody = await statusRes.json().catch(() => ({}));
        const s = statusBody.status || statusBody.state;
        if (s === 'done') {
          setHistoryStatus('done');
          setHistoryCount(Number(statusBody.count || 0));
          setHistoryPath(statusBody.path || null);
          if (historyPollRef.current) {
            window.clearInterval(historyPollRef.current);
            historyPollRef.current = null;
          }
        } else if (s === 'error') {
          setHistoryStatus('error');
          setHistoryError(String(statusBody.error || 'unknown error'));
          if (historyPollRef.current) {
            window.clearInterval(historyPollRef.current);
            historyPollRef.current = null;
          }
        }
      };
      await poll();
      historyPollRef.current = window.setInterval(poll, 2000);
    } catch (e: any) {
      setHistoryStatus('error');
      setHistoryError(e?.message ? String(e.message) : 'history download failed');
    }
  }, [historyBase, exchange, symbol, timeframe, historyStart, historyEnd]);

  // Mode change handler with isolation (strengthened for 10 rapid switches)
  const handleModeChange = useCallback((newMode: Mode) => {
    // Cancel all in-flight requests immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Cancel RUN request if any
    if (runAbortControllerRef.current) {
      runAbortControllerRef.current.abort();
      runAbortControllerRef.current = null;
    }
    
    // Clear intervals
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Increment mode version (race guard) - critical for rapid switches
    const currentVersion = modeVersionRef.current + 1;
    modeVersionRef.current = currentVersion;
    
    // Reset ALL mode-specific state immediately (no conditional checks)
    // This ensures no state leaks after rapid switches
    setBacktestKpi({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
    setBacktestResult(null);
    setBacktestError(null);
    setBacktestRunStatus('idle');
    
    setTestRunning(false);
    setTestPaused(false);
    setTestKpi({ totalPnl: 0, winrate: 0, activePositions: 0, riskLevel: 'Low' });
    
    // Only preserve liveRunning if switching TO live mode
    if (newMode !== 'live') {
      setLiveRunning(false);
    }
    
    // Set mode last to ensure all state is reset first
    setMode(newMode);
    
    // Double-check version after async state updates (defense in depth)
    setTimeout(() => {
      if (modeVersionRef.current !== currentVersion) {
        // Mode changed again, ignore this update
        return;
      }
    }, 0);
  }, []);

  // Removed backtest:updated event listener - using direct setState only

  // Backtest polling (only in backtest mode, with race guards)
  useEffect(() => {
    if (mode !== 'backtest') return;

    const version = modeVersionRef.current;
    let cancelled = false;

    const tick = async () => {
      // Check if mode changed
      if (cancelled || modeVersionRef.current !== version) return;
      
      // Abort previous controller before creating new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        const data = await fetchBacktestKpi(apiBase, controller.signal);
        
        // Double-check after async
        if (cancelled || modeVersionRef.current !== version) return;
        
        setBacktestKpi(data);
      } catch (e: any) {
        if (e.name !== 'AbortError' && !cancelled && modeVersionRef.current === version) {
          // Silent fail for network errors
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 2000);
    intervalRef.current = id;

    return () => {
      cancelled = true;
      window.clearInterval(id);
      intervalRef.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [mode, apiBase]);

  // Backtest handlers
  const handleBacktestRun = useCallback(async () => {
    if (backtestRunStatus === 'running') return;
    
    // Abort previous RUN request if any
    if (runAbortControllerRef.current) {
      runAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this RUN request
    const controller = new AbortController();
    runAbortControllerRef.current = controller;
    
    // Increment run version for race guard
    runVersionRef.current += 1;
    const currentRunVersion = runVersionRef.current;
    
    setBacktestRunStatus('running');
    setBacktestError(null);

    try {
      // Use current UI state for payload
      const payload: Record<string, unknown> = {
        strategy: strategy,
        symbol: symbol,
        timeframe: timeframe, // send human-readable timeframe
        interval: timeframe.replace(/[^0-9]/g, '') || "60", // keep interval for legacy compatibility
        exchange: exchange,
        mode,
        initial_balance: balance,
      };

      // Only request history mode if a dataset was downloaded successfully
      if (historyStatus === 'done' && historyCount > 0) {
        payload.source = "history";
        payload.start = historyStart;
        payload.end = historyEnd;
      }

      const base = String(apiBase || '').replace(/\/$/, '');
      const url = `${base}/api/backtest/run`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Check if aborted before processing response
      if (controller.signal.aborted || runVersionRef.current !== currentRunVersion) {
        return;
      }

      let result: any = {};

      if (!res.ok) {
        // Try to capture backend error message
        try {
          result = await res.json();
        } catch {
          const txt = await res.text().catch(() => "");
          result = { error: txt || res.statusText || `HTTP ${res.status}` };
        }
        const msg = (result && (result.error || result.message || result.detail)) 
          ? String(result.error || result.message || result.detail) 
          : `HTTP ${res.status} ${res.statusText}`.trim();
        throw new Error(msg || `HTTP ${res.status}`);
      } else {
        result = (await res.json().catch(() => ({}))) as any;
      }
      
      // Double-check after async operations
      if (controller.signal.aborted || runVersionRef.current !== currentRunVersion) {
        return;
      }
      
      // Extract KPI from result
      const stat = result.statistics || result.summary || result;
      const kpi = {
        totalTrades: num(stat.total_trades ?? stat.totalTrades, 0),
        profitFactor: num(stat.profit_factor ?? stat.profitFactor, 0),
        maxDrawdown: num(stat.max_drawdown ?? stat.maxDrawdown, 0),
      };

      // Final check before updating state
      if (controller.signal.aborted || runVersionRef.current !== currentRunVersion) {
        return;
      }

      setBacktestKpi(kpi);
      setBacktestResult(result);
      setBacktestRunStatus('done');
    } catch (e: any) {
      // Ignore AbortError - request was cancelled
      if (e.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      
      // Check if this run was superseded
      if (runVersionRef.current !== currentRunVersion) {
        return;
      }
      
      const msg = e instanceof Error ? e.message : String(e);
      setBacktestError(msg);
      setBacktestRunStatus('error');
    } finally {
      // Clean up controller if it's still the current one
      if (runAbortControllerRef.current === controller) {
        runAbortControllerRef.current = null;
      }
    }
  }, [apiBase, backtestRunStatus, symbol, timeframe, strategy, balance]);

  const handleBacktestCancel = useCallback(() => {
    if (backtestRunStatus === 'running') {
      // Abort the RUN request specifically
      if (runAbortControllerRef.current) {
        runAbortControllerRef.current.abort();
        runAbortControllerRef.current = null;
      }
      // Increment version to invalidate any pending responses
      runVersionRef.current += 1;
      setBacktestRunStatus('idle');
      setBacktestError(null);
      // Clear results/KPIs on cancel
      setBacktestResult(null);
      setBacktestKpi({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
    }
  }, [backtestRunStatus]);

  // Live handlers
  const handleLiveStart = useCallback(() => {
    setLiveRunning(true);
    console.log('Live bot started');
  }, []);

  const handleLiveStop = useCallback(() => {
    setLiveRunning(false);
    console.log('Live bot stopped');
  }, []);

  // Test handlers
  const handleTestStart = useCallback(() => {
    setTestRunning(true);
    setTestPaused(false);
    console.log('Test started');
  }, []);

  const handleTestPause = useCallback(() => {
    if (testRunning) {
      setTestPaused(true);
      console.log('Test paused');
    }
  }, [testRunning]);

  const handleTestResume = useCallback(() => {
    if (testRunning && testPaused) {
      setTestPaused(false);
      console.log('Test resumed');
    }
  }, [testRunning, testPaused]);


  // Compute CTA based on mode
  const getPrimaryCta = useCallback(() => {
    switch (mode) {
      case 'backtest':
        if (backtestRunStatus === 'running') {
          return { label: 'Cancel', action: handleBacktestCancel, disabled: false };
        } else if (backtestRunStatus === 'done') {
          return { label: 'Re-run', action: handleBacktestRun, disabled: false };
        } else {
          return { label: 'Run Backtest', action: handleBacktestRun, disabled: false };
        }
      case 'live':
        if (liveRunning) {
          return { label: 'Stop Bot', action: handleLiveStop, disabled: false };
        } else {
          return { label: 'Start Bot', action: handleLiveStart, disabled: false };
        }
      case 'test':
        if (testRunning) {
          if (testPaused) {
            return { label: 'Resume', action: handleTestResume, disabled: false };
          } else {
            return { label: 'Pause', action: handleTestPause, disabled: false };
          }
        } else {
          return { label: 'Start Test', action: handleTestStart, disabled: false };
        }
    }
  }, [mode, backtestRunStatus, liveRunning, testRunning, testPaused, handleBacktestRun, handleBacktestCancel, handleLiveStart, handleLiveStop, handleTestStart, handleTestPause, handleTestResume]);

  const primaryCta = getPrimaryCta();

  const isBacktest = mode === 'backtest';
  const isTest = mode === 'test';
  const kpi: KPIData | BacktestKPIData | null = isBacktest
    ? {
        totalPnl: 0, // Will be calculated from backtest results if available
        winrate: 0,
        totalTrades: backtestKpi.totalTrades,
        profitFactor: backtestKpi.profitFactor,
        maxDrawdown: backtestKpi.maxDrawdown,
      }
    : isTest
    ? testKpi
    : liveKPI;

  // Ensure data-mode is always lowercase to match CSS selectors
  const modeLower = mode.toLowerCase() as Mode;
  
  // Sync data-mode to document root as backup (ensures CSS selectors work)
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', modeLower);
    return () => {
      document.documentElement.removeAttribute('data-mode');
    };
  }, [modeLower]);

  return (
    <div 
      className="h-screen w-screen overflow-hidden relative" 
      style={{ 
        background: 'var(--bg)',
        height: '100vh',
        width: '100vw',
      }}
      data-mode={modeLower}
    >
      {/* Subtle gradient overlay based on mode */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-20"
        style={{
          background: mode === 'backtest' 
            ? 'var(--gradient-backtest)'
            : mode === 'live'
            ? 'var(--gradient-live)'
            : 'var(--gradient-test)',
        }}
      />

      <div className="w-full h-full flex flex-col relative z-10">
        <TopBar
          mode={mode}
          onModeChange={handleModeChange}
          symbol={symbol}
          exchange={exchange}
          balance={balance}
          primaryCtaLabel={primaryCta.label}
          onPrimaryCta={primaryCta.action}
          primaryCtaDisabled={primaryCta.disabled}
          apiBase={apiBase}
        />

        <StatsTicker mode={mode} kpi={kpi} backtestKpi={isBacktest ? backtestKpi : undefined} />

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex flex-col flex-1 overflow-hidden min-w-0 min-h-0">
            <ChartArea 
              mode={mode} 
              symbol={symbol} 
              exchange={exchange} 
              timeframe={timeframe} 
              strategy={strategy} 
              onTimeframeChange={setTimeframe} 
              backtestResult={backtestResult}
              apiBase={apiBase}
              onBacktestRun={handleBacktestRun}
              onBacktestCancel={handleBacktestCancel}
              backtestRunStatus={backtestRunStatus}
              backtestRunError={backtestError || undefined}
            historyPreset={historyPreset}
            historyStart={historyStart}
            historyEnd={historyEnd}
            historyStatus={historyStatus}
            historyCount={historyCount}
            historyPath={historyPath || undefined}
            historyError={historyError || undefined}
            onHistoryPresetChange={applyPreset}
            onHistoryDateChange={(which, value) => {
              if (which === 'start') setHistoryStart(value);
              else setHistoryEnd(value);
              setHistoryPreset('custom');
            }}
            onHistoryDownload={handleHistoryDownload}
            />
          </div>

          <Sidebar mode={mode} />
        </div>
      </div>
    </div>
  );
}

export default App;
