export type Mode = "LIVE" | "TEST" | "BACKTEST";
export type Role = "system" | "user" | "assistant" | "tool";

export type ChatMessage = { role: Role; content: string; name?: string };

export type TradingContext = {
  mode: Mode;
  symbol?: string;
  timeframe?: string;
  risk?: Record<string, any>;
  positions?: Array<Record<string, any>>;
  recentTrades?: Array<Record<string, any>>;
  metrics?: Record<string, any>;
  backtestResult?: Record<string, any>;
};

export type AssistantAction = { type: string; label: string; payload: Record<string, any> };

export type AssistantRequest = { messages: ChatMessage[]; context: TradingContext };

export type AssistantResponse = { answer: string; actions: AssistantAction[] };
