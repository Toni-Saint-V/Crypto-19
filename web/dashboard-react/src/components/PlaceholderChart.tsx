import { Mode } from '../types';

interface PlaceholderChartProps {
  mode: Mode;
}

export default function PlaceholderChart({ mode }: PlaceholderChartProps) {
  const modeLabel =
    mode === 'LIVE' ? 'Live synthetic data' : mode === 'TEST' ? 'Test playback' : 'Backtest curve';

  return (
    <div className="w-full h-full bg-[#05070A] flex flex-col">
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A] via-[#05070A] to-[#05070A]" />
        <div className="absolute inset-[24px] rounded-xl bg-[#05070A] border border-[#1A1C22] overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_0_0,#21D4B4,transparent_60%),radial-gradient(circle_at_100%_100%,#4B5563,transparent_55%)]" />
          <div className="absolute inset-4 flex items-end gap-[6px]">
            {Array.from({ length: 80 }).map((_, index) => {
              const heightBase = Math.sin(index / 6) * 0.35 + 0.6;
              const height = Math.max(0.1, Math.min(0.95, heightBase));
              return (
                <div
                  key={index}
                  className="w-[4px] rounded-t-full bg-[#30E0B8]"
                  style={{ height: `${height * 100}%`, opacity: 0.7 }}
                />
              );
            })}
          </div>
          <div className="absolute left-0 right-0 top-1/3 border-t border-dashed border-[#1F2933]" />
          <div className="absolute left-0 right-0 top-2/3 border-t border-dashed border-[#1F2933]" />
        </div>
      </div>
      <div className="h-10 flex items-center justify-between px-6 text-[11px] text-gray-500 border-t border-[#1A1C22]">
        <span>Mock chart - layout ready for real data feed</span>
        <span>{modeLabel}</span>
      </div>
    </div>
  );
}
