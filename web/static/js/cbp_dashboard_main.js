import {
  dashboardState,
  subscribeToState,
  updateDashboardState,
  updateMetrics
} from "./cbp_state.js";
import {
  initMainChart,
  loadCandles,
  applyLiveCandleUpdate,
  plotTradeMarker
} from "./cbp_charts.js";
import { initWebSockets } from "./cbp_ws.js";
import { initUI } from "./cbp_ui.js";

let socketsCleanup = null;
let metricsTimer = null;
let lastSymbol = dashboardState.symbol;
let lastTimeframe = dashboardState.timeframe;
let lastMode = dashboardState.mode;
let lastExchange = dashboardState.exchange;

const METRICS_REFRESH_MS = 15000;

function logMain(message, ...args) {
  console.log(`[CBP Main] ${message}`, ...args);
}

async function refreshCandles() {
  logMain(`Refreshing candles: ${dashboardState.symbol} ${dashboardState.timeframe} (${dashboardState.mode})`);
  try {
    await loadCandles(dashboardState.symbol, dashboardState.timeframe, {
      exchange: dashboardState.exchange || "bybit",
      mode: dashboardState.mode || "test",
      limit: 200
    });
  } catch (err) {
    logMain("refreshCandles error", err);
  }
}

async function fetchDashboardMetrics() {
  try {
    const response = await fetch("/api/dashboard");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    updateMetrics({
      equity: payload.equity ?? dashboardState.metrics.equity,
      pnlPercent: payload.pnl ?? dashboardState.metrics.pnlPercent,
      riskLevel: payload.risk ?? dashboardState.metrics.riskLevel,
      confidence: payload.confidence ?? dashboardState.metrics.confidence
    });
  } catch (err) {
    logMain("fetchDashboardMetrics failed", err);
  }
}

function handleStateChange(state) {
  const shouldReload =
    state.symbol !== lastSymbol ||
    state.timeframe !== lastTimeframe ||
    state.mode !== lastMode ||
    state.exchange !== lastExchange;

  if (shouldReload) {
    logMain(`State changed: symbol=${state.symbol}, timeframe=${state.timeframe}, mode=${state.mode}, exchange=${state.exchange}`);
    lastSymbol = state.symbol;
    lastTimeframe = state.timeframe;
    lastMode = state.mode;
    lastExchange = state.exchange;
    refreshCandles();
  }
}

function bindControls() {
  const symbolSelect =
    document.getElementById("cbp-symbol-select") ||
    document.getElementById("symbol-select");
  const timeframeSelect =
    document.getElementById("cbp-timeframe-select") ||
    document.getElementById("timeframe-select");

  if (symbolSelect && !symbolSelect.dataset.cbpBound) {
    symbolSelect.dataset.cbpBound = "true";
    symbolSelect.addEventListener("change", () => {
      updateDashboardState({ symbol: symbolSelect.value });
    });
  }
  if (timeframeSelect && !timeframeSelect.dataset.cbpBound) {
    timeframeSelect.dataset.cbpBound = "true";
    timeframeSelect.addEventListener("change", () => {
      updateDashboardState({ timeframe: timeframeSelect.value });
    });
  }
}

function initSockets() {
  socketsCleanup = initWebSockets({
    onTrade: handleTradeMessage,
    onSignal: (payload) => {
      if (payload?.message) {
        logMain(`Signal: ${payload.message}`);
      }
    },
    onSystem: (message) => logMain(`WS system: ${message}`),
    onLegacyMetrics: (payload) => {
      updateMetrics({
        pnlPercent: payload.pnl ?? dashboardState.metrics.pnlPercent,
        riskLevel: payload.risk ?? dashboardState.metrics.riskLevel,
        confidence: payload.confidence ?? dashboardState.metrics.confidence
      });
    }
  });
}

function handleTradeMessage(message) {
  if (!message) {
    logMain("handleTradeMessage: empty message");
    return;
  }

  // Only process trade messages in live mode
  if (dashboardState.mode === "live" || dashboardState.mode === "debug") {
    // Plot trade marker
    if (message.type === "trade" || message.side || message.direction) {
      plotTradeMarker(message);
    }

    // Apply live candle update if we have price data
    if (typeof message.price === "number" || typeof message.close === "number") {
      applyLiveCandleUpdate({
        time: message.timestamp || message.time || message.ts,
        price: message.price || message.close || message.last,
        volume: message.volume || message.size || 0,
        timeframe: dashboardState.timeframe
      });
    }
  } else {
    logMain(`handleTradeMessage: ignoring trade in ${dashboardState.mode} mode`);
  }
}

function startMetricsTimer() {
  metricsTimer = window.setInterval(fetchDashboardMetrics, METRICS_REFRESH_MS);
}

function setupBeforeUnload() {
  window.addEventListener("beforeunload", () => {
    socketsCleanup?.();
    if (metricsTimer) {
      clearInterval(metricsTimer);
    }
  });
}

function bootstrap() {
  logMain("bootstrap start");

  initUI();
  bindControls();

  const container = document.getElementById("cbp-main-chart");
  if (!container) {
    logMain("chart container #cbp-main-chart not found");
    return;
  }

  initMainChart(container);
  refreshCandles();
  fetchDashboardMetrics();

  subscribeToState(handleStateChange);
  initSockets();
  startMetricsTimer();
  setupBeforeUnload();

  logMain("bootstrap ready");
}

document.addEventListener("DOMContentLoaded", bootstrap);
