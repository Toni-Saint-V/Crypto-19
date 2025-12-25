// CryptoBot Pro Dashboard State Management

const listeners = new Set();

export const dashboardState = {
  // Mode: "live" | "backtest"
  mode: "live",
  
  // Live environment: "real" | "test" (only relevant when mode === "live")
  liveEnv: "test",
  
  // Trading parameters
  symbol: "BTCUSDT",
  exchange: "bybit",
  timeframe: "15m",
  
  // WebSocket status
  wsConnected: false,
  
  // Live mode metrics
  balance: null,
  dailyPnlPct: null,
  totalProfit: null,
  winratePct: null,
  activePositions: null,
  riskLevelPct: null,
  
  // Chart data
  candles: [],
  
  // AI data
  aiSignals: [],
  aiForecast: null,
  aiSignalStrength: null,
  aiSentiment: null,
  
  // Trades for ticker
  trades: [],
  
  // Backtest data
  backtestResults: null,
  backtestEquityCurve: [],
  backtestTrades: [],
  
  // Update methods
  setMode(newMode) {
    if (newMode === "live" || newMode === "backtest") {
      this.mode = newMode;
      this.notify();
      this.dispatchEvent("mode_changed", { mode: newMode });
    }
  },
  
  setLiveEnv(newEnv) {
    if (newEnv === "real" || newEnv === "test") {
      this.liveEnv = newEnv;
      this.notify();
      this.dispatchEvent("liveenv_changed", { liveEnv: newEnv });
    }
  },
  
  setSnapshot(snapshot) {
    if (!snapshot) return;
    
    if (snapshot.symbol) this.symbol = snapshot.symbol;
    if (snapshot.timeframe) this.timeframe = snapshot.timeframe;
    if (snapshot.balance !== undefined) this.balance = snapshot.balance;
    if (snapshot.daily_pnl_pct !== undefined) this.dailyPnlPct = snapshot.daily_pnl_pct;
    if (snapshot.total_profit !== undefined) this.totalProfit = snapshot.total_profit;
    if (snapshot.winrate_pct !== undefined) this.winratePct = snapshot.winrate_pct;
    if (snapshot.active_positions !== undefined) this.activePositions = snapshot.active_positions;
    if (snapshot.risk_level_pct !== undefined) this.riskLevelPct = snapshot.risk_level_pct;
    if (Array.isArray(snapshot.candles)) this.candles = snapshot.candles;
    if (Array.isArray(snapshot.ai_signals)) this.aiSignals = snapshot.ai_signals;
    if (Array.isArray(snapshot.trades)) this.trades = snapshot.trades;
    
    this.notify();
    this.dispatchEvent("dashboard_update", { snapshot });
  },
  
  setWsStatus(connected) {
    this.wsConnected = connected;
    this.notify();
    this.dispatchEvent("ws_status_changed", { connected });
  },
  
  setBacktestResults(results) {
    this.backtestResults = results;
    if (results?.equity_curve) {
      this.backtestEquityCurve = results.equity_curve;
    }
    if (results?.trades) {
      this.backtestTrades = results.trades;
    }
    this.notify();
    this.dispatchEvent("backtest_results", { results });
  },
  
  // Internal notification system
  notify() {
    listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (err) {
        console.error("[Dashboard State] Subscriber error:", err);
      }
    });
  },
  
  dispatchEvent(eventName, detail) {
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent(`dashboard:${eventName}`, { detail })
        );
      } catch (err) {
        console.error("[Dashboard State] Event dispatch error:", err);
      }
    }
  }
};

// Subscribe to state changes
export function subscribeToState(listener) {
  listeners.add(listener);
  // Call immediately with current state
  listener(dashboardState);
  // Return unsubscribe function
  return () => listeners.delete(listener);
}

// Update state helper
export function updateDashboardState(patch) {
  if (patch.mode !== undefined) {
    dashboardState.setMode(patch.mode);
    delete patch.mode;
  }
  if (patch.liveEnv !== undefined) {
    dashboardState.setLiveEnv(patch.liveEnv);
    delete patch.liveEnv;
  }
  Object.assign(dashboardState, patch);
  dashboardState.notify();
}





