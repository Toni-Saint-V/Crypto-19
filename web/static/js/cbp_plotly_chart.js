"use strict";

import { dashboardState } from "./cbp_state.js";

export function initPriceChart() {
  const rootId = "cbp-price-chart-root";
  const rootEl = document.getElementById(rootId);
  if (!rootEl) {
    console.error("[CBP Plotly] Chart root element not found:", rootId);
    return;
  }

  const layout = {
    margin: { t: 10, r: 10, b: 20, l: 40 },
    xaxis: {
      type: "date",
      rangeslider: { visible: false },
    },
    yaxis: {
      side: "right",
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    showlegend: false,
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  function buildTrace(candles) {
    if (!candles || candles.length === 0) {
      return {
        x: [],
        open: [],
        high: [],
        low: [],
        close: [],
        type: "candlestick",
        name: dashboardState.symbol || "BTCUSDT",
      };
    }

    // Handle time conversion: can be unix timestamp (seconds or ms) or ISO string
    const x = candles.map(c => {
      if (typeof c.time === "string") {
        return new Date(c.time);
      } else if (typeof c.time === "number") {
        // If timestamp > 1e12, it's in milliseconds, otherwise seconds
        return new Date(c.time > 1e12 ? c.time : c.time * 1000);
      }
      return new Date(c.time);
    });
    const open = candles.map(c => c.open);
    const high = candles.map(c => c.high);
    const low = candles.map(c => c.low);
    const close = candles.map(c => c.close);

    return {
      x,
      open,
      high,
      low,
      close,
      type: "candlestick",
      name: dashboardState.symbol || "BTCUSDT",
      increasing: { line: { color: "#25C26E" } },
      decreasing: { line: { color: "#FF5B5B" } },
    };
  }

  function initialRender() {
    const trace = buildTrace(dashboardState.candles);
    Plotly.newPlot(rootId, [trace], layout, config);
  }

  function updateChart() {
    const trace = buildTrace(dashboardState.candles);
    Plotly.react(rootId, [trace], layout, config);
  }

  window.addEventListener("cbp:dashboard_update", updateChart);
  window.addEventListener("resize", () => {
    Plotly.Plots.resize(rootEl);
  });

  initialRender();
}

