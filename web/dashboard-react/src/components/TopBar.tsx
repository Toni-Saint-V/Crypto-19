import { Mode, AIPredictor } from '../types';
import { useState } from 'react';

interface TopBarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  symbol: string;
  exchange: string;
  balance: number;
}

const mockPredictor: AIPredictor = {
  bias: 'Bullish',
  strength: 78,
  explanation: 'Strong upward momentum with increasing volume. Key resistance levels broken.',
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
      className={`px-3 py-1 text-[10px] font-medium rounded-full transition-colors ${
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
  const [predictor] = useState<AIPredictor>(mockPredictor);
  const isTest = mode === 'test';

  const biasColor =
    predictor.bias === 'Bullish'
      ? 'text-emerald-400'
      : predictor.bias === 'Bearish'
        ? 'text-red-400'
        : 'text-gray-400';

  return (
    <div className="h-12 min-h-[48px] flex items-center justify-between px-6 border-b border-[#1A1C22] bg-[#05070A] flex-shrink-0">
      {/* Left: Brand + Exchange + Balance */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-base font-semibold">
          <span className="text-white">Crypto</span>
          <span className="text-[#21D4B4]">Bot Pro</span>
        </div>
        {isTest && (
          <div className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
            TESTNET
          </div>
        )}
        <div className="text-[10px] text-gray-400">
          {exchange} • <span className="text-gray-300">${balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Center: AI Predictor block */}
      <div className="flex items-center gap-4 flex-1 px-6 min-w-0">
        <div className="flex items-center gap-2 min-w-[100px] flex-shrink-0">
          <span className="text-[10px] text-gray-500">AI:</span>
          <span className={`text-[11px] font-medium ${biasColor}`}>{predictor.bias}</span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0 max-w-[200px]">
            <div className="h-1 bg-[#0D0F12] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  predictor.bias === 'Bullish'
                    ? 'bg-emerald-400'
                    : predictor.bias === 'Bearish'
                      ? 'bg-red-400'
                      : 'bg-gray-400'
                }`}
                style={{ width: `${predictor.strength}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-gray-400 min-w-[50px] flex-shrink-0">
            {predictor.strength}%
          </div>
        </div>

        <div className="text-[10px] text-gray-400 max-w-[250px] truncate flex-shrink-0">
          {predictor.explanation}
        </div>
      </div>

      {/* Right: Connection + Mode + Settings */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
        <button className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
