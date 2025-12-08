const listeners = new Set();

export const dashboardState = {
  mode: "live",
  exchange: "bybit",
  symbol: "BTCUSDT",
  timeframe: "1m",
  riskProfile: "normal",
  wsStatus: {
    trades: "disconnected",
    ai: "disconnected",
    legacy: "disconnected"
  },
  metrics: {
    equity: 10000,
    pnlPercent: 0,
    riskLevel: "--",
    confidence: null
  },
  chartContainer: null,
  chart: null,
  series: {
    candles: null,
    volume: null
  },
  tradeMarkers: [],
  aiData: {
    confidence: null,
    risk_level: "Unknown",
    summary: "Ожидание данных AI...",
    action: "",
    strategy_comment: "",
    lastUpdated: null
  }
};

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(dashboardState);
    } catch (err) {
      console.error("State subscriber error", err);
    }
  });
}

export function subscribeToState(listener) {
  listeners.add(listener);
  listener(dashboardState);
  return () => listeners.delete(listener);
}

export function updateDashboardState(patch) {
  Object.assign(dashboardState, patch);
  notify();
}

export function setExchange(newExchange) {
  dashboardState.exchange = newExchange;
  console.log("[CBP State] exchange ->", newExchange);
  notify();
}

export function setTimeframe(newTimeframe) {
  dashboardState.timeframe = newTimeframe;
  console.log("[CBP State] timeframe ->", newTimeframe);
  notify();
}

export function setRiskProfile(profile) {
  dashboardState.riskProfile = profile;
  console.log("[CBP State] riskProfile ->", profile);
  notify();
}

export function updateMetrics(patch) {
  dashboardState.metrics = { ...dashboardState.metrics, ...patch };
  notify();
}

export function updateAiData(patch) {
  dashboardState.aiData = {
    ...dashboardState.aiData,
    ...patch,
    lastUpdated: Date.now()
  };
  notify();
}

export function setWsStatus(channel, status) {
  dashboardState.wsStatus = {
    ...dashboardState.wsStatus,
    [channel]: status
  };
  notify();
}
