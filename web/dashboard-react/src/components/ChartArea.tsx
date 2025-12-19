import { useState, useEffect } from 'react';
import { Mode } from '../types';
import TradingChart from './TradingChart';
import ChartParametersRow from './ChartParametersRow';
import ChartHUD from "./ChartHUD";
import { MLScoreWidget } from "./MLScoreWidget";
import BacktestResultsPanel from "./BacktestResultsPanel";
import LiveResultsDrawer from "./LiveResultsDrawer";
import TestResultsDrawer from "./TestResultsDrawer";

// Minimal typed ML context (UI only, no contract changes)
interface MLContext {
  mode: Mode;
  symbol: string;
  timeframe: string;
}

interface ChartAreaProps {
  backtestResult?: any;
  mode: Mode;
  symbol: string;
  exchange: string;
  timeframe: string;
  strategy: string;
  onTimeframeChange?: (timeframe: string) => void;
  apiBase?: string;
  onBacktestRun?: () => void;
  onBacktestCancel?: () => void;
  backtestRunStatus?: 'idle' | 'running' | 'done' | 'error';
  backtestRunError?: string;
}

export default function ChartArea({
  mode,
  symbol,
  exchange,
  timeframe,
  strategy,
  onTimeframeChange,
  apiBase,
  onBacktestRun,
  onBacktestCancel,
  backtestRunStatus,
  backtestRunError,
}: ChartAreaProps) {
  const [riskFilter, setRiskFilter] = useState('All');
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  
  // Reset drawer expanded state on mode change
  useEffect(() => {
    setDrawerExpanded(false);
  }, [mode]);

  const handleTimeframeChange = (tf: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  const mlContext: MLContext = {
    mode,
    symbol,
    timeframe,
  };
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
      style={{
        background: 'var(--surface-1)',
        borderTop: '1px solid var(--stroke)',
      }}
    >
      {/* Chart topbar (HUD + ML Score) */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--stroke)' }}>
        <div className="flex items-center gap-2">
          <ChartHUD />
        </div>
        <div className="flex items-center gap-2">
          <MLScoreWidget context={mlContext} />
        </div>
      </div>

      {/* Chart parameters */}
      <ChartParametersRow
        symbol={symbol}
        exchange={exchange}
        timeframe={timeframe}
        strategy={strategy}
        riskFilter={riskFilter}
        onTimeframeChange={handleTimeframeChange}
        onRiskFilterChange={setRiskFilter}
      />

      {/* Main chart + optional backtest bottom drawer */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Chart always visible, takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TradingChart />
        </div>

        {/* Shared bottom drawer wrapper (always overlay-mounted) */}
        <div
          className="flex flex-col z-10"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: drawerExpanded ? '40vh' : '48px',
            maxHeight: '40vh',
            transition: 'height 200ms ease-out',
            background: 'var(--surface-1)',
            borderTop: '1px solid var(--stroke)',
            boxShadow: 'var(--shadow-e2)',
            overflow: 'hidden',
          }}
        >
          {mode === 'backtest' && (
            <BacktestResultsPanel 
              apiBase={apiBase}
              onRun={onBacktestRun}
              onCancel={onBacktestCancel}
              runStatus={backtestRunStatus}
              runError={backtestRunError}
              onExpandedChange={setDrawerExpanded}
            />
          )}
          {mode === 'live' && (
            <LiveResultsDrawer onExpandedChange={setDrawerExpanded} />
          )}
          {mode === 'test' && (
            <TestResultsDrawer onExpandedChange={setDrawerExpanded} />
          )}
        </div>
      </div>
    </div>
  );
}
