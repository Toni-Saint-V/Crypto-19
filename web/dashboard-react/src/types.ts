export type Mode = 'live' | 'test' | 'backtest';

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
