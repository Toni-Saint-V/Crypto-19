export interface EquityPoint {
  time?: string | number;
  timestamp?: string | number;
  equity?: number;
  value?: number;
  balance?: number;
  [key: string]: unknown;
}

export interface Trade {
  time?: string;
  timestamp?: string | number;
  entry_time?: string;
  side?: string;
  direction?: string;
  size?: number;
  qty?: number;
  quantity?: number;
  price?: number;
  entry_price?: number;
  pnl?: number;
  profit?: number;
  [key: string]: unknown;
}

export interface Metrics {
  totalTrades?: number;
  total_trades?: number;
  trades?: number;

  profitFactor?: number;
  profit_factor?: number;
  pf?: number;

  maxDrawdown?: number;
  max_drawdown?: number;
  dd?: number;

  totalPnl?: number;
  total_pnl?: number;
  total_pnl_usd?: number;
  pnl?: number;
  profit?: number;

  [key: string]: unknown;
}

export interface BacktestResult {
  kpi?: Metrics;
  summary?: Metrics;
  metrics?: Metrics;
  statistics?: Metrics;

  equity?: EquityPoint[];
  trades?: Trade[];
  logs?: Array<string | Record<string, unknown>>;

  [key: string]: unknown;
}


