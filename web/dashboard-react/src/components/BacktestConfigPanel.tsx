import { useState } from 'react';

interface BacktestConfigPanelProps {
  onRunNameChange?: (name: string) => void;
  onCapitalChange?: (capital: number) => void;
  onPlaybackSpeedChange?: (speed: number) => void;
}

export default function BacktestConfigPanel({
  onRunNameChange,
  onCapitalChange,
  onPlaybackSpeedChange,
}: BacktestConfigPanelProps) {
  const [runName, setRunName] = useState('Backtest Run 1');
  const [virtualCapital, setVirtualCapital] = useState(10000);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const handleRunNameChange = (value: string) => {
    setRunName(value);
    onRunNameChange?.(value);
  };

  const handleCapitalChange = (value: number) => {
    setVirtualCapital(value);
    onCapitalChange?.(value);
  };

  const handleSpeedChange = (value: number) => {
    setPlaybackSpeed(value);
    onPlaybackSpeedChange?.(value);
  };

  return (
    <div className="h-20 px-6 border-b border-[#1A1C22] bg-[#05070A] flex items-center gap-4 text-xs">
      <div className="flex items-center gap-3 flex-1">
        <div className="min-w-[180px]">
          <div className="text-[11px] text-gray-400 mb-1">Run Name</div>
          <input
            type="text"
            value={runName}
            onChange={(e) => handleRunNameChange(e.target.value)}
            className="w-full bg-[#0C0F15] border border-[#1A1C22] rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-[#21D4B4]"
            placeholder="Backtest run name"
          />
        </div>

        <div className="min-w-[140px]">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-400">Virtual Capital</span>
            <span className="text-[11px] text-gray-300">${virtualCapital.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={100000}
            step={1000}
            value={virtualCapital}
            onChange={(e) => handleCapitalChange(e.target.valueAsNumber)}
            className="w-full"
          />
        </div>

        <div className="min-w-[140px]">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-400">Playback Speed</span>
            <span className="text-[11px] text-gray-300">{playbackSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(e.target.valueAsNumber)}
            className="w-full"
          />
        </div>
      </div>

      <button className="px-4 py-2 text-xs font-medium rounded-lg bg-[#21D4B4] text-black hover:bg-[#1bb89a] transition-colors whitespace-nowrap">
        Run Backtest
      </button>
    </div>
  );
}
