import { AIPredictor } from '../types';

interface AIPredictorStripProps {
  predictor?: AIPredictor;
}

const mockPredictor: AIPredictor = {
  bias: 'Bullish',
  strength: 78,
  explanation:
    'Strong upward momentum with increasing volume. Key resistance levels broken.',
};

export default function AIPredictorStrip({ predictor = mockPredictor }: AIPredictorStripProps) {
  const biasColor =
    predictor.bias === 'Bullish'
      ? 'text-emerald-400'
      : predictor.bias === 'Bearish'
        ? 'text-red-400'
        : 'text-gray-400';

  return (
    <div className="h-12 min-h-[48px] px-6 border-b border-[#1A1C22] bg-[#05070A] flex items-center gap-6 text-xs flex-shrink-0">
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-gray-500">AI Predictor:</span>
        <span className={`font-medium ${biasColor}`}>{predictor.bias}</span>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-[#0D0F12] rounded-full overflow-hidden">
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
        <div className="text-gray-400 min-w-[60px] text-right">
          {predictor.strength}% confidence
        </div>
      </div>

      <div className="text-gray-400 max-w-[300px] truncate">
        24h outlook: {predictor.explanation}
      </div>
    </div>
  );
}
