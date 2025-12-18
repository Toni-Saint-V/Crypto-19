import { useState } from 'react';
import { Mode } from '../types';
import TradingChart from './TradingChart';
import ChartParametersRow from './ChartParametersRow';
import ChartHUD from "./ChartHUD";
import { MLScoreWidget } from "./MLScoreWidget";
import BacktestResultsPanel from "./BacktestResultsPanel";

interface ChartAreaProps {
  backtestResult?: any;
  mode: Mode;
  symbol: string;
  exchange: string;
  timeframe: string;
  strategy: string;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function ChartArea({
  mode,
  symbol,
  exchange,
  timeframe,
  strategy,
  onTimeframeChange,
}: ChartAreaProps) {
  const [riskFilter, setRiskFilter] = useState('All');

  const handleTimeframeChange = (tf: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

    const mlContext = ({ mode: mode, symbol: symbol, timeframe: timeframe } as any);
return (
    <div className="flex-1 flex flex-col border-t border-[#1A1C22] bg-[#05070A]/50 backdrop-blur-sm min-h-0 overflow-hidden">
      <div className="chart-topbar">

        <div className="chart-topbar-left"><ChartHUD /></div>

        <div className="chart-topbar-right"><MLScoreWidget context={mlContext} /></div>

      </div>

      <ChartParametersRow
        symbol={symbol}
        exchange={exchange}
        timeframe={timeframe}
        strategy={strategy}
        riskFilter={riskFilter}
        onTimeframeChange={handleTimeframeChange}
        onRiskFilterChange={setRiskFilter}
      />

      {/* Main chart + optional backtest bottom drawer share the remaining vertical space */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <TradingChart />
        </div>

        {mode === 'backtest' && (
          // Backtest drawer lives at the bottom of the left column and manages its own internal scroll
          <BacktestResultsPanel />
        )}
      </div>
    </div>
  );
}
