// Bridge-модуль: старый API initMainChart -> новый Plotly initPriceChart
"use strict";

import { initPriceChart } from "./cbp_plotly_chart.js";

export function initMainChart(_containerElement) { 
  console.log("[CBP Plotly] initMainChart -> delegating to initPriceChart()");
  initPriceChart();
}
