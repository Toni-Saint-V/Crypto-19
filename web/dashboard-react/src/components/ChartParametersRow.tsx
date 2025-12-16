import { useState } from 'react';

interface ChartParametersRowProps {
  symbol: string;
  exchange: string;
  timeframe: string;
  strategy: string;
  riskFilter: string;
  onTimeframeChange: (value: string) => void;
  onRiskFilterChange: (value: string) => void;
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const RISK_FILTERS = ['All', 'Low', 'Moderate', 'High'];

export default function ChartParametersRow({
  symbol,
  exchange,
  timeframe,
  strategy,
  riskFilter,
  onTimeframeChange,
  onRiskFilterChange,
}: ChartParametersRowProps) {
  const [showCustomTimeframe, setShowCustomTimeframe] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<'m' | 'h' | 'd'>('m');

  const handleCustomTimeframeSubmit = () => {
    if (customValue && customUnit) {
      const customTf = `${customValue}${customUnit}`;
      onTimeframeChange(customTf);
      setShowCustomTimeframe(false);
      setCustomValue('');
    }
  };

  return (
    <div className="h-12 min-h-[48px] flex items-center justify-between px-6 border-b border-[#1A1C22] bg-[#05070A] flex-shrink-0">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{symbol}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">{exchange}</span>
          <span className="text-gray-500 ml-4">TF:</span>
          <span className="text-gray-200">{timeframe}</span>
          <span className="text-gray-500 ml-4">Strategy:</span>
          <span className="text-gray-200">{strategy}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                timeframe === tf
                  ? 'bg-[#21D4B4] border-[#21D4B4] text-black font-medium'
                  : 'bg-transparent border-[#1A1C22] text-gray-400 hover:text-gray-200 hover:border-[#2A2C32]'
              }`}
            >
              {tf}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowCustomTimeframe(!showCustomTimeframe)}
              className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                showCustomTimeframe || !TIMEFRAMES.includes(timeframe)
                  ? 'bg-[#21D4B4] border-[#21D4B4] text-black font-medium'
                  : 'bg-transparent border-[#1A1C22] text-gray-400 hover:text-gray-200 hover:border-[#2A2C32]'
              }`}
            >
              Custom
            </button>
            {showCustomTimeframe && (
              <div className="absolute top-full right-0 mt-1 bg-[#090B10] border border-[#1A1C22] rounded-lg p-2 z-10 flex items-center gap-2">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Value"
                  className="w-16 bg-[#0C0F15] border border-[#1A1C22] rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
                  min="1"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as 'm' | 'h' | 'd')}
                  className="bg-[#0C0F15] border border-[#1A1C22] rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
                >
                  <option value="m">m</option>
                  <option value="h">h</option>
                  <option value="d">d</option>
                </select>
                <button
                  onClick={handleCustomTimeframeSubmit}
                  className="px-2 py-1 text-[11px] bg-[#21D4B4] text-black rounded hover:bg-[#1bb89a] transition-colors"
                >
                  Set
                </button>
                <button
                  onClick={() => {
                    setShowCustomTimeframe(false);
                    setCustomValue('');
                  }}
                  className="px-2 py-1 text-[11px] border border-[#1A1C22] text-gray-400 rounded hover:bg-[#11141B] transition-colors"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-[#1A1C22]" />

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-500 mr-1">Риск:</span>
          {RISK_FILTERS.map((risk) => (
            <button
              key={risk}
              onClick={() => onRiskFilterChange(risk)}
              className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                riskFilter === risk
                  ? 'bg-[#21D4B4] border-[#21D4B4] text-black font-medium'
                  : 'bg-transparent border-[#1A1C22] text-gray-400 hover:text-gray-200 hover:border-[#2A2C32]'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
