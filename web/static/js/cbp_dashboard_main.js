// CryptoBot Pro — минимальный вход для дашборда с реальным графиком Bybit
"use strict";

import { dashboardState } from "./cbp_state.js";
import { initMainChart, loadCandles } from "./cbp_charts.js";

function bootstrap() {
  console.log("[CBP Main] bootstrap start");

  const container = document.getElementById("cbp-main-chart");
  if (!container) {
    console.error("[CBP Main] #cbp-main-chart not found in DOM");
    return;
  }

  const symbolSelect = document.getElementById("cbp-symbol-select");
  const tfSelect = document.getElementById("cbp-timeframe-select");

  dashboardState.symbol = symbolSelect?.value || "BTCUSDT";
  dashboardState.timeframe = tfSelect?.value || "1m";

  const chart = initMainChart(container);
  if (!chart) {
    console.error("[CBP Main] initMainChart failed");
    return;
  }

  function reload() {
    loadCandles(dashboardState.symbol, dashboardState.timeframe);
  }

  reload();

  if (symbolSelect) {
    symbolSelect.addEventListener("change", () => {
      dashboardState.symbol = symbolSelect.value;
      reload();
    });
  }

  if (tfSelect) {
    tfSelect.addEventListener("change", () => {
      dashboardState.timeframe = tfSelect.value;
      reload();
    });
  }

  console.log("[CBP Main] bootstrap end");
}

document.addEventListener("DOMContentLoaded", bootstrap);
