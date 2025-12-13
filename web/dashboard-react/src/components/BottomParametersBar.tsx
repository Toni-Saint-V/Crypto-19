import { ChangeEvent } from 'react';

interface BottomParametersBarProps {
  symbol: string;
  exchange: string;
  timeframe: string;
  strategy: string;
  riskAmount: number;
  balance: number;
  onSymbolChange: (value: string) => void;
  onExchangeChange: (value: string) => void;
  onTimeframeChange: (value: string) => void;
  onStrategyChange: (value: string) => void;
  onRiskAmountChange: (value: number) => void;
}

const SYMBOLS = ['ETHUSDT', 'BTCUSDT', 'SOLUSDT'];
const EXCHANGES = ['Bybit', 'Binance', 'OKX'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const STRATEGIES = ['Mean Reversion v2', 'Trend Following', 'Breakout'];

export default function BottomParametersBar({
  symbol,
  exchange,
  timeframe,
  strategy,
  riskAmount,
  balance,
  onSymbolChange,
  onExchangeChange,
  onTimeframeChange,
  onStrategyChange,
  onRiskAmountChange,
}: BottomParametersBarProps) {
  const handleRiskChange = (event: ChangeEvent<HTMLInputElement>) => {
    onRiskAmountChange(event.target.valueAsNumber);
  };

  return (
    <div className="h-[80px] border-t border-[#1A1C22] bg-[#05070A] px-6 flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[11px] text-gray-400 mb-1">Pair</div>
          <select
            value={symbol}
            onChange={(event) => onSymbolChange(event.target.value)}
            className="bg-[#0C0F15] border border-[#1A1C22] rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] text-gray-400 mb-1">Exchange</div>
          <select
            value={exchange}
            onChange={(event) => onExchangeChange(event.target.value)}
            className="bg-[#0C0F15] border border-[#1A1C22] rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
          >
            {EXCHANGES.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] text-gray-400 mb-1">Timeframe</div>
          <select
            value={timeframe}
            onChange={(event) => onTimeframeChange(event.target.value)}
            className="bg-[#0C0F15] border border-[#1A1C22] rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[220px]">
          <div className="text-[11px] text-gray-400 mb-1">Strategy</div>
          <select
            value={strategy}
            onChange={(event) => onStrategyChange(event.target.value)}
            className="w-full bg-[#0C0F15] border border-[#1A1C22] rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
          >
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="min-w-[220px]">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-400">Risk per trade</span>
            <span className="text-[11px] text-gray-300">
              ${riskAmount.toFixed(0)} ({((riskAmount / balance) * 100).toFixed(1)}% of balance)
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={riskAmount}
            onChange={handleRiskChange}
            className="w-full"
          />
        </div>
        <button className="px-4 py-2 text-xs font-medium rounded-lg bg-[#21D4B4] text-black hover:bg-[#1bb89a] transition-colors">
          Arm strategy
        </button>
      </div>
    </div>
  );
}
