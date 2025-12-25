// CryptoBot Pro — unified charts module (LightweightCharts, stable)

"use strict";

import { dashboardState } from "./cbp_state.js";

const COLOR_UP = "#25C26E";
const COLOR_DOWN = "#FF5B5B";
const COLOR_UP_T = "rgba(37, 194, 110, 0.3)";
const COLOR_DOWN_T = "rgba(255, 91, 91, 0.3)";

let chart = null;
let candleSeries = null;
let volumeSeries = null;

// === helpers ===

function getLW() {
  const LW = window.LightweightCharts;
  if (!LW || typeof LW.createChart !== "function") {
    console.error(
      "[CBP Charts] LightweightCharts.createChart is not available",
      window.LightweightCharts
    );
    return null;
  }
  return LW;
}

function getContainer() {
  const el =
    document.querySelector("[data-cbp='chart']") ||
    document.getElementById("cbp-main-chart") ||
    document.getElementById("chart") ||
    document.querySelector(".tv-chart-container") ||
    document.querySelector(".main-chart") ||
    document.querySelector(".chart-container");

  if (!el) {
    console.error("[CBP Charts] Chart container not found");
  }
  return el;
}

function normalizeCandle(raw) {
  if (!raw) return null;

  // Формат массива: [time, open, high, low, close, volume]
  if (Array.isArray(raw) && raw.length >= 5) {
    const [t, o, h, l, c, v] = raw;
    return {
      time: typeof t === "number" && t > 10_000_000_000 ? Math.floor(t / 1000) : t,
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(c),
      volume: v != null ? Number(v) : 0
    };
  }

  // Объектный формат
  const t = raw.ts ?? raw.t ?? raw.time ?? raw.timestamp ?? raw.date ?? null;
  const o = raw.o ?? raw.open;
  const h = raw.h ?? raw.high;
  const l = raw.l ?? raw.low;
  const c = raw.c ?? raw.close;
  const v = raw.v ?? raw.volume ?? 0;

  if (t == null || o == null || h == null || l == null || c == null) {
    return null;
  }

  let time = t;
  if (typeof time === "string") {
    const parsed = Date.parse(time);
    if (!Number.isNaN(parsed)) {
      time = Math.floor(parsed / 1000);
    }
  }
  if (typeof time === "number" && time > 10_000_000_000) {
    time = Math.floor(time / 1000);
  }

  return {
    time,
    open: Number(o),
    high: Number(h),
    low: Number(l),
    close: Number(c),
    volume: Number(v)
  };
}

function setCandlesFromArray(candlesRaw) {
  if (!chart || !candleSeries) {
    console.warn("[CBP Charts] setCandles: chart not ready");
    return;
  }
  if (!Array.isArray(candlesRaw) || candlesRaw.length === 0) {
    console.warn("[CBP Charts] setCandles: empty candles");
    return;
  }

  const candles = [];
  const volumes = [];

  for (const raw of candlesRaw) {
    const c = normalizeCandle(raw);
    if (!c) continue;
    candles.push({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    });
    volumes.push({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? COLOR_UP_T : COLOR_DOWN_T
    });
  }

  if (candles.length === 0) {
    console.warn("[CBP Charts] No valid candles after normalization");
    return;
  }

  candleSeries.setData(candles);
  if (volumeSeries) {
    volumeSeries.setData(volumes);
  }

  chart.timeScale().fitContent();
  console.log("[CBP Charts] Applied", candles.length, "candles");
}

function createInternalChart(container) {
  const LW = getLW();
  if (!LW) return null;

  const chartOptions = {
    layout: {
      background: { color: "#050816" },
      textColor: "rgba(255,255,255,0.7)"
    },
    grid: {
      vertLines: { color: "rgba(255,255,255,0.04)" },
      horzLines: { color: "rgba(255,255,255,0.04)" }
    },
    rightPriceScale: { borderVisible: false },
    timeScale: {
      borderVisible: false,
      timeVisible: true,
      secondsVisible: false
    },
    crosshair: { mode: LW.CrosshairMode.Normal }
  };

  const ch = LW.createChart(container, chartOptions);

  const candles = ch.addCandlestickSeries({
    upColor: COLOR_UP,
    downColor: COLOR_DOWN,
    borderUpColor: COLOR_UP,
    borderDownColor: COLOR_DOWN,
    wickUpColor: COLOR_UP,
    wickDownColor: COLOR_DOWN
  });

  const volumes = ch.addHistogramSeries({
    priceScaleId: "volume",
    priceFormat: { type: "volume" },
    overlay: true
  });

  ch.priceScale("volume").applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 }
  });

  return { chart: ch, candleSeries: candles, volumeSeries: volumes };
}

// === public API ===

export function initChart(snapshot) {
  console.log("[CBP Charts] initChart called");

  const container = getContainer();
  if (!container) return;

  const created = createInternalChart(container);
  if (!created) return;

  chart = created.chart;
  candleSeries = created.candleSeries;
  volumeSeries = created.volumeSeries;

  let candlesRaw = null;

  if (snapshot) {
    if (Array.isArray(snapshot)) {
      candlesRaw = snapshot;
    } else if (Array.isArray(snapshot.candles)) {
      candlesRaw = snapshot.candles;
    } else if (Array.isArray(snapshot.ohlcv)) {
      candlesRaw = snapshot.ohlcv;
    }
  }

  if (!candlesRaw && dashboardState && Array.isArray(dashboardState.candles)) {
    candlesRaw = dashboardState.candles;
  }

  if (candlesRaw) {
    setCandlesFromArray(candlesRaw);
  } else {
    console.warn(
      "[CBP Charts] No candles found in snapshot/dashboardState — пустой график, но без ошибок."
    );
  }

  // глобальный объект для отладки
  window.cbpCharts = {
    initChart,
    updateChart,
    setCandlesFromArray,
    get chart() {
      return chart;
    },
    get candleSeries() {
      return candleSeries;
    }
  };
}

// То, чего ждёт cbp_dashboard_main.js
export function updateChart(candlesRaw) {
  setCandlesFromArray(candlesRaw);
}

// Для старого кода, который может вызывать createChart(...)
export function createChart(snapshot) {
  return initChart(snapshot);
}

// export по умолчанию — тоже пригодится
export default {
  initChart,
  updateChart,
  createChart
};
