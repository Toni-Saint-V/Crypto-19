import { Mode, Trade } from '../types';

interface LiveTradesTickerProps {
  mode: Mode;
}

const liveTrades: Trade[] = [
  {
    id: '1',
    direction: 'BUY',
    symbol: 'ETHUSDT',
    price: 2510.4,
    pnl: 54.3,
    pnlPercent: 0.32,
    timestamp: Date.now(),
  },
  {
    id: '2',
    direction: 'SELL',
    symbol: 'BTCUSDT',
    price: 43250.0,
    pnl: -23.1,
    pnlPercent: -0.12,
    timestamp: Date.now(),
  },
  {
    id: '3',
    direction: 'BUY',
    symbol: 'SOLUSDT',
    price: 98.2,
    pnl: 12.8,
    pnlPercent: 0.54,
    timestamp: Date.now(),
  },
];

const testEvents: string[] = [
  'Test #34 - ETH 15m - Mean Reversion v2',
  'Test #35 - BTC 5m - Trend Following',
  'Test #36 - SOL 1h - Breakout Strategy',
];

const backtestEvents: string[] = [
  'Backtest 2023 Q1 - BTCUSDT - Sharpe 1.8 - DD 12%',
  'Portfolio 2022 - ETH/SOL basket - Winrate 63%',
];

export default function LiveTradesTicker({ mode }: LiveTradesTickerProps) {
  let content: JSX.Element[] = [];

  if (mode === 'live') {
    content = liveTrades.map((trade) => {
      const positive = trade.pnl >= 0;
      return (
        <div key={trade.id} className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">{trade.direction}</span>
          <span className="text-gray-200">{trade.symbol}</span>
          <span className="text-gray-500">${trade.price.toFixed(2)}</span>
          <span
            className={`font-medium ${
              positive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {positive ? '+' : ''}
            {trade.pnl.toFixed(1)} ({trade.pnlPercent.toFixed(2)}%)
          </span>
        </div>
      );
    });
  } else if (mode === 'test') {
    content = testEvents.map((e, idx) => (
      <div key={idx} className="text-xs text-gray-300">
        {e}
      </div>
    ));
  } else {
    content = backtestEvents.map((e, idx) => (
      <div key={idx} className="text-xs text-gray-300">
        {e}
      </div>
    ));
  }

  return (
    <div className="h-9 min-h-[36px] flex items-center border-b border-[#1A1C22] bg-[#05070A] px-6 text-xs flex-shrink-0">
      <span className="text-gray-400 mr-4">Recent trades</span>
      <div className="flex-1 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-6 whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
}
