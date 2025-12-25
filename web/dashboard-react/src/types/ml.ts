export type Mode = "LIVE" | "TEST" | "BACKTEST";

export type MLContext = {
  mode: Mode;
  symbol?: string;
  timeframe?: string;
  metrics?: Record<string, any>;
  positions?: Array<Record<string, any>>;
  recentTrades?: Array<Record<string, any>>;
  backtestResult?: Record<string, any>;
};

export type FeatureVector = { features: Record<string, number> };

export type ScoreOutput = {
  signalQuality: number;
  riskScore: number;
  confidence: number;
  tags: string[];
  explain: string[];
};

export type MLScoreRequest = { context: MLContext; market?: Record<string, any> };

export type MLScoreResponse = { output: ScoreOutput; featureVector: FeatureVector };
