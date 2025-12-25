// CryptoBot Pro Dashboard Charts Module (Lightweight Charts)

"use strict";

let priceChart = null;
let priceCandleSeries = null;
let priceVolumeSeries = null;

let equityChart = null;
let equitySeries = null;

// Color constants
const COLOR_UP = "#26A69A";
const COLOR_DOWN = "#EF5350";
const COLOR_UP_T = "rgba(37, 194, 110, 0.3)";
const COLOR_DOWN_T = "rgba(255, 91, 91, 0.3)";

// === Helpers ===

function getLightweightCharts() {
  const LW = window.LightweightCharts;
  if (!LW || typeof LW.createChart !== "function") {
    console.error("[Dashboard Charts] LightweightCharts not available", window.LightweightCharts);
    return null;
  }
  return LW;
}

function normalizeCandle(raw) {
  if (!raw) return null;

  // Array format: [time, open, high, low, close, volume]
  if (Array.isArray(raw) && raw.length >= 5) {
    const [t, o, h, l, c, v] = raw;
    
    // Normalize time consistently (handle string timestamps like object format)
    let time = t;
    if (typeof time === "string") {
      const parsed = Date.parse(time);
      if (!Number.isNaN(parsed)) {
        time = Math.floor(parsed / 1000);
      } else {
        return null; // Invalid timestamp
      }
    } else if (typeof time === "number") {
      // Convert milliseconds to seconds if needed
      if (time > 10_000_000_000) {
        time = Math.floor(time / 1000);
      }
    } else {
      return null; // Invalid time type
    }
    
    return {
      time,
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(c),
      volume: v != null ? Number(v) : 0
    };
  }

  // Object format
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
    } else {
      // Invalid time string - return null to prevent invalid data
      return null;
    }
  } else if (typeof time === "number") {
    // Convert milliseconds to seconds if needed
    if (time > 10_000_000_000) {
      time = Math.floor(time / 1000);
    }
  } else {
    // Invalid time type - return null
    return null;
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

// === Price Chart ===

export function initPriceChart(containerId = "price-chart-container") {
  const LW = getLightweightCharts();
  if (!LW) {
    console.warn("[Dashboard Charts] LightweightCharts not available, showing placeholder");
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #8B949E;">Chart unavailable</div>';
    }
    return null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error("[Dashboard Charts] Price chart container not found:", containerId);
    return null;
  }

  // Clear container
  container.innerHTML = "";

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

  priceChart = ch;
  priceCandleSeries = candles;
  priceVolumeSeries = volumes;

  console.log("[Dashboard Charts] Price chart initialized");
  return { chart: ch, candleSeries: candles, volumeSeries: volumes };
}

export function updatePriceChart(candlesRaw) {
  if (!priceChart || !priceCandleSeries) {
    console.warn("[Dashboard Charts] Price chart not initialized");
    return;
  }

  if (!Array.isArray(candlesRaw) || candlesRaw.length === 0) {
    console.warn("[Dashboard Charts] No candles to update");
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
    console.warn("[Dashboard Charts] No valid candles after normalization");
    return;
  }

  priceCandleSeries.setData(candles);
  if (priceVolumeSeries) {
    priceVolumeSeries.setData(volumes);
  }

  priceChart.timeScale().fitContent();
  console.log("[Dashboard Charts] Updated price chart with", candles.length, "candles");
}

// === Equity Chart ===

export function initEquityChart(containerId = "equity-chart-container") {
  const LW = getLightweightCharts();
  if (!LW) {
    console.warn("[Dashboard Charts] LightweightCharts not available for equity chart");
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #8B949E;">Chart unavailable</div>';
    }
    return null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error("[Dashboard Charts] Equity chart container not found:", containerId);
    return null;
  }

  // Clear container
  container.innerHTML = "";

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

  const series = ch.addLineSeries({
    color: "#3FB6FF",
    lineWidth: 2
  });

  equityChart = ch;
  equitySeries = series;

  console.log("[Dashboard Charts] Equity chart initialized");
  return { chart: ch, series };
}

export function updateEquityChart(equityData, options = {}) {
  if (!equityChart || !equitySeries) {
    console.warn("[Dashboard Charts] Equity chart not initialized");
    return;
  }

  if (!Array.isArray(equityData) || equityData.length === 0) {
    console.warn("[Dashboard Charts] No equity data to update");
    return;
  }

  // Get date range from options or try to get from dashboardState
  const dateFrom = options.dateFrom || options.date_from;
  const dateTo = options.dateTo || options.date_to;
  
  // Calculate time range if dates are provided
  let startTime = null;
  let timeRange = null;
  if (dateFrom && dateTo) {
    const fromDate = typeof dateFrom === "string" ? new Date(dateFrom) : dateFrom;
    const toDate = typeof dateTo === "string" ? new Date(dateTo) : dateTo;
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      startTime = Math.floor(fromDate.getTime() / 1000);
      const endTime = Math.floor(toDate.getTime() / 1000);
      timeRange = endTime - startTime;
    }
  }

  const points = [];
  for (let i = 0; i < equityData.length; i++) {
    const item = equityData[i];
    
    // Handle both array of numbers and array of objects {time, value}
    let value, time;
    if (typeof item === "number") {
      value = item;
      time = null; // Will calculate from index and backtest period
    } else if (item && typeof item === "object") {
      value = item.value ?? item.equity ?? item.pnl ?? null;
      time = item.time ?? item.timestamp ?? item.t ?? null;
    } else {
      continue; // Skip invalid items
    }
    
    if (value === null || value === undefined) {
      continue;
    }
    
    // If time is not provided, calculate from backtest period or use default
    if (time === null || time === undefined) {
      if (startTime !== null && timeRange !== null && equityData.length > 1) {
        // Distribute points evenly across the backtest period
        // Handle edge case where dateFrom === dateTo (timeRange === 0)
        const secondsPerPoint = timeRange > 0 
          ? timeRange / (equityData.length - 1)
          : 86400; // Default to 1 day per point if same date
        time = startTime + Math.floor(i * secondsPerPoint);
      } else {
        // Fallback: Use a fixed date range (doesn't change on each call)
        // This is better than Date.now() which ties to current time
        const defaultStartTime = Math.floor(new Date("2020-01-01").getTime() / 1000);
        const secondsPerPoint = 86400; // 1 day per point
        time = defaultStartTime + (i * secondsPerPoint);
      }
    } else {
      // Normalize timestamp if provided
      if (typeof time === "string") {
        const parsed = Date.parse(time);
        if (!Number.isNaN(parsed)) {
          time = Math.floor(parsed / 1000);
        } else {
          continue; // Invalid time
        }
      } else if (typeof time === "number") {
        // Convert milliseconds to seconds if needed
        if (time > 10_000_000_000) {
          time = Math.floor(time / 1000);
        }
      }
    }
    
    points.push({
      time,
      value: Number(value)
    });
  }

  if (points.length === 0) {
    console.warn("[Dashboard Charts] No valid equity points");
    return;
  }

  equitySeries.setData(points);
  equityChart.timeScale().fitContent();
  console.log("[Dashboard Charts] Updated equity chart with", points.length, "points");
}

// Cleanup
export function destroyCharts() {
  if (priceChart) {
    priceChart.remove();
    priceChart = null;
    priceCandleSeries = null;
    priceVolumeSeries = null;
  }
  if (equityChart) {
    equityChart.remove();
    equityChart = null;
    equitySeries = null;
  }
}

