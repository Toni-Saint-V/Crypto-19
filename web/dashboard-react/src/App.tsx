import { useState, useEffect, useRef, useCallback } from 'react';
import TopBar from './components/TopBar';
import StatsTicker from './components/StatsTicker';
import ChartArea from './components/ChartArea';
import Sidebar from './components/Sidebar';
import { Mode, KPIData, BacktestKPIData, normalizeMode } from './types';
import type { BacktestResult, Metrics } from './types/backtest';

type BacktestKpi = {
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
};

function num(v: unknown, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// Removed: fetchBacktestKpi - now using job-only API

const liveKPI: KPIData = {
  totalPnl: 1247.5,
  winrate: 68.5,
  activePositions: 3,
  riskLevel: 'Moderate',
};

function App() {
  const [mode, setMode] = useState<Mode>('LIVE');
  const [symbol] = useState('ETHUSDT');
  const [exchange] = useState('Bybit');
  const [timeframe, setTimeframe] = useState('15m');
  const [strategy] = useState('Mean Reversion v2');
  const [balance] = useState(10000);
  
  // Mode isolation: separate state per mode
  // Backtest job-only state
  const [backtestJobId, setBacktestJobId] = useState<string | null>(null);
  const [backtestJobStatus, setBacktestJobStatus] = useState<'idle' | 'queued' | 'running' | 'done' | 'error'>('idle');
  const [backtestJobProgress, setBacktestJobProgress] = useState<number>(0);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const [backtestKpi, setBacktestKpi] = useState<BacktestKpi>({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
  
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

  // Mode change handler with isolation
  const handleModeChange = useCallback((newModeInput: string | Mode) => {
    // Normalize mode input to UPPER
    const newMode = normalizeMode(newModeInput);
    
    // Abort ALL in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (runAbortControllerRef.current) {
      runAbortControllerRef.current.abort();
      runAbortControllerRef.current = null;
    }
    
    // Stop ALL timers
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Increment mode version (race guard)
    modeVersionRef.current += 1;
    
    // Reset mode-scoped state (only for modes that are NOT the new mode)
    if (newMode !== 'BACKTEST') {
      setBacktestJobId(null);
      setBacktestJobStatus('idle');
      setBacktestJobProgress(0);
      setBacktestKpi({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
      setBacktestResult(null);
      setBacktestError(null);
    }
    if (newMode !== 'LIVE') {
      // Preserve liveRunning state
    }
    if (newMode !== 'TEST') {
      setTestRunning(false);
      setTestPaused(false);
      setTestKpi({ totalPnl: 0, winrate: 0, activePositions: 0, riskLevel: 'Low' });
    }
    
    setMode(newMode);
    
    const modeLabels: Record<Mode, string> = {
      LIVE: 'Live',
      TEST: 'Test',
      BACKTEST: 'Backtest',
    };
    console.log(`Switched to ${modeLabels[newMode]} mode`);
  }, []);

  // Removed backtest:updated event listener - using direct setState only

  // Backtest job status polling (job-only wiring)
  useEffect(() => {
    if (mode !== 'BACKTEST' || !backtestJobId || backtestJobStatus === 'idle' || backtestJobStatus === 'done' || backtestJobStatus === 'error') {
      return;
    }

    const version = modeVersionRef.current;
    let cancelled = false;
    let backoffMs = 2000;
    const maxBackoffMs = 30000;
    const backoffMultiplier = 1.5;
    let timeoutId: number | null = null;

    const pollStatus = async () => {
      if (cancelled || modeVersionRef.current !== version || !backtestJobId) return;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        const base = String(apiBase || '').replace(/\/$/, '');
        const res = await fetch(`${base}/api/backtest/status/${backtestJobId}`, { signal: controller.signal });
        
        if (cancelled || modeVersionRef.current !== version) return;
        
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          let errorData: any = {};
          try {
            errorData = JSON.parse(txt);
          } catch {
            errorData = { message: txt || "Status check failed" };
          }
          const errorMsg = errorData.error || errorData.message || "Не удалось проверить статус";
          const requestId = errorData.request_id || errorData.requestId || "";
          setBacktestError(requestId ? `${errorMsg} (request: ${requestId})` : errorMsg);
          setBacktestJobStatus('error');
          return;
        }
        
        const statusData = await res.json().catch(() => ({}));
        const jobStatus = statusData.status || 'queued';
        const progress = statusData.progress || 0;
        
        if (cancelled || modeVersionRef.current !== version) return;
        
        setBacktestJobStatus(jobStatus);
        setBacktestJobProgress(progress);
        
        if (jobStatus === 'done') {
          // Fetch result
          const resultRes = await fetch(`${base}/api/backtest/result/${backtestJobId}`, { signal: controller.signal });
          if (resultRes.ok) {
            const result = (await resultRes.json().catch(() => ({}))) as BacktestResult;
            setBacktestResult(result);
            const stat: Metrics = (result.statistics ?? result.summary ?? result.metrics ?? result.kpi ?? result) as Metrics;
            setBacktestKpi({
              totalTrades: num(stat.total_trades ?? stat.totalTrades, 0),
              profitFactor: num(stat.profit_factor ?? stat.profitFactor, 0),
              maxDrawdown: num(stat.max_drawdown ?? stat.maxDrawdown, 0),
            });
            setBacktestError(null);
          }
        } else if (jobStatus === 'error') {
          setBacktestError(statusData.error || "Backtest failed");
        } else {
          // Continue polling
          backoffMs = 2000;
          timeoutId = window.setTimeout(pollStatus, backoffMs);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError' && !cancelled && modeVersionRef.current === version) {
          backoffMs = Math.min(backoffMs * backoffMultiplier, maxBackoffMs);
          timeoutId = window.setTimeout(pollStatus, backoffMs);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [mode, apiBase, backtestJobId, backtestJobStatus]);

  // Backtest handlers (job-only)
  const handleBacktestRun = useCallback(async () => {
    if (backtestJobStatus === 'running' || backtestJobStatus === 'queued') return;
    
    if (runAbortControllerRef.current) {
      runAbortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    runAbortControllerRef.current = controller;
    
    runVersionRef.current += 1;
    const currentRunVersion = runVersionRef.current;
    
    setBacktestJobStatus('queued');
    setBacktestJobProgress(0);
    setBacktestError(null);
    setBacktestResult(null);

    try {
      const payload: Record<string, unknown> = {
        strategy: strategy,
        symbol: symbol,
        timeframe: timeframe,
        initial_balance: balance,
      };

      const base = String(apiBase || '').replace(/\/$/, '');
      const res = await fetch(`${base}/api/backtest/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (controller.signal.aborted || runVersionRef.current !== currentRunVersion) {
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = JSON.parse(txt);
        } catch {
          errorData = { message: txt || "Request failed" };
        }
        const errorMsg = errorData.error || errorData.message || "Не удалось запустить backtest";
        const requestId = errorData.request_id || errorData.requestId || "";
        throw new Error(requestId ? `${errorMsg} (request: ${requestId})` : errorMsg);
      }

      const result = await res.json().catch(() => ({}));
      
      if (controller.signal.aborted || runVersionRef.current !== currentRunVersion) {
        return;
      }
      
      // Job-only: extract job_id
      const jobId = result.job_id;
      if (!jobId) {
        throw new Error("Не получен job_id от сервера");
      }
      
      setBacktestJobId(jobId);
      setBacktestJobStatus(result.status || 'queued');
    } catch (e: any) {
      if (e.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      
      if (runVersionRef.current !== currentRunVersion) {
        return;
      }
      
      const msg = e instanceof Error ? e.message : String(e);
      setBacktestError(msg);
      setBacktestJobStatus('error');
    } finally {
      if (runAbortControllerRef.current === controller) {
        runAbortControllerRef.current = null;
      }
    }
  }, [apiBase, backtestJobStatus, symbol, timeframe, strategy, balance]);

  const handleBacktestCancel = useCallback(() => {
    if (backtestJobStatus === 'running' || backtestJobStatus === 'queued') {
      if (runAbortControllerRef.current) {
        runAbortControllerRef.current.abort();
        runAbortControllerRef.current = null;
      }
      runVersionRef.current += 1;
      setBacktestJobId(null);
      setBacktestJobStatus('idle');
      setBacktestJobProgress(0);
      setBacktestError(null);
      setBacktestResult(null);
      setBacktestKpi({ totalTrades: 0, profitFactor: 0, maxDrawdown: 0 });
    }
  }, [backtestJobStatus]);
  
  const handleBacktestRetry = useCallback(() => {
    setBacktestError(null);
    handleBacktestRun();
  }, [handleBacktestRun]);

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

  const handleTestStop = useCallback(() => {
    setTestRunning(false);
    setTestPaused(false);
    console.log('Test stopped');
  }, []);

  // Compute CTA based on mode
  const getPrimaryCta = useCallback(() => {
    switch (mode) {
      case 'BACKTEST':
        if (backtestJobStatus === 'running' || backtestJobStatus === 'queued') {
          return { label: 'Cancel', action: handleBacktestCancel, disabled: false };
        } else if (backtestJobStatus === 'done') {
          return { label: 'Re-run', action: handleBacktestRun, disabled: false };
        } else {
          return { label: 'Run Backtest', action: handleBacktestRun, disabled: false };
        }
      case 'LIVE':
        if (liveRunning) {
          return { label: 'Stop Bot', action: handleLiveStop, disabled: false };
        } else {
          return { label: 'Start Bot', action: handleLiveStart, disabled: false };
        }
      case 'TEST':
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
  }, [mode, backtestJobStatus, liveRunning, testRunning, testPaused, handleBacktestRun, handleBacktestCancel, handleLiveStart, handleLiveStop, handleTestStart, handleTestPause, handleTestResume]);

  const primaryCta = getPrimaryCta();
  const secondaryCta =
    mode === 'TEST' && testRunning
      ? { label: 'Stop', action: handleTestStop, disabled: false }
      : null;

  const isBacktest = mode === 'BACKTEST';
  const isTest = mode === 'TEST';
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

  // Sync data-mode to document root (lowercase for CSS selectors)
  const modeLower = mode.toLowerCase();
  
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', modeLower);
    return () => {
      document.documentElement.removeAttribute('data-mode');
    };
  }, [modeLower]);

  return (
    <div 
      className="h-screen w-full overflow-hidden relative" 
      style={{ background: 'var(--bg)' }}
      data-mode={modeLower}
    >
      {/* Subtle gradient overlay based on mode */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none opacity-20"
        style={{
          background: mode === 'BACKTEST' 
            ? 'var(--gradient-backtest)'
            : mode === 'LIVE'
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
          secondaryCtaLabel={secondaryCta?.label}
          onSecondaryCta={secondaryCta?.action}
          secondaryCtaDisabled={secondaryCta?.disabled}
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
              onBacktestRetry={handleBacktestRetry}
              backtestJobStatus={backtestJobStatus}
              backtestJobProgress={backtestJobProgress}
              backtestRunError={backtestError || undefined}
            />
          </div>

          <Sidebar mode={mode} />
        </div>
      </div>
    </div>
  );
}

export default App;
