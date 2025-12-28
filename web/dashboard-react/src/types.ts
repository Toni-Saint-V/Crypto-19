// Mode truth: only UPPER case in state
export type Mode = 'LIVE' | 'TEST' | 'BACKTEST';

// Normalize mode input (accepts any case, returns UPPER)
export function normalizeMode(mode: string | Mode): Mode {
  if (!mode) return 'LIVE';
  const upper = mode.toUpperCase().trim();
  if (upper === 'LIVE' || upper === 'TEST' || upper === 'BACKTEST') {
    return upper as Mode;
  }
  // Fallback mappings
  if (upper === 'L' || upper === 'LIVE_MODE') return 'LIVE';
  if (upper === 'T' || upper === 'TEST_MODE') return 'TEST';
  if (upper === 'B' || upper === 'BT' || upper === 'BACKTEST_MODE') return 'BACKTEST';
  return 'LIVE'; // default
}

export interface Trade {
  id: string;
  direction: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

export interface KPIData {
  totalPnl: number;
  winrate: number;
  activePositions: number;
  riskLevel: string;
}

export interface BacktestKPIData {
  totalPnl: number;
  winrate: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
}

export type MetricState = 'loading' | 'empty' | 'error' | 'stale' | 'ok';

export interface Indicator {
  name: string;
  active: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface AIPredictor {
  bias: 'Bullish' | 'Neutral' | 'Bearish';
  strength: number;
  explanation: string;
}
