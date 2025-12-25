import { AIPredictor } from '../types';

const mockPredictor: AIPredictor = {
  bias: 'Bullish',
  strength: 78,
  explanation:
    'Market shows strong upward momentum with increasing volume. Key resistance levels have been broken, and buyers continue to dominate the order book. Short-term pullbacks are possible, but the overall structure remains bullish for the next 24 hours.',
};

export default function AIPredictorPanel() {
  return (
    <div className="h-full p-6 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">AI Predictor</h3>
        <p className="text-xs text-gray-400">24h price outlook</p>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-[#0D0F12] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#21D4B4] transition-all"
            style={{ width: `${mockPredictor.strength}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
          <span>Bias: {mockPredictor.bias}</span>
          <span>{mockPredictor.strength}% confidence</span>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs text-gray-400">Market bias</div>
        <div className="text-sm font-medium text-[#21D4B4]">
          {mockPredictor.bias}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scrollbar mt-2">
        <p className="text-xs text-gray-300 leading-relaxed">
          {mockPredictor.explanation}
        </p>
      </div>
    </div>
  );
}
