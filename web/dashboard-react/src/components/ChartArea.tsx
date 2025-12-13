import { useState } from 'react';
import { Mode } from '../types';
import TradingChart from './TradingChart';
import ChartParametersRow from './ChartParametersRow';
import BacktestConfigPanel from './BacktestConfigPanel';
import BacktestResultsPanel from "./BacktestResultsPanel";

interface ChartAreaProps {
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

  return (
    <div className="flex-1 flex flex-col border-t border-[#1A1C22] bg-[#05070A] min-h-0 overflow-hidden">
      {mode === 'backtest' && (<><BacktestConfigPanel /><BacktestResultsPanel /></>)}
      <ChartParametersRow
        symbol={symbol}
        exchange={exchange}
        timeframe={timeframe}
        strategy={strategy}
        riskFilter={riskFilter}
        onTimeframeChange={handleTimeframeChange}
        onRiskFilterChange={setRiskFilter}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TradingChart />
      </div>
    </div>
  );
}
