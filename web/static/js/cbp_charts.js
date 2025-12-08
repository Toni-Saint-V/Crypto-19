import { dashboardState } from "./cbp_state.js";

const LW_GLOBAL = "LightweightCharts";
const FALLBACK_LIMIT = 200;
const COLOR_UP = "#25C26E";
const COLOR_DOWN = "#FF5B5B";
const COLOR_UP_TRANSPARENT = "rgba(37, 194, 110, 0.3)";
const COLOR_DOWN_TRANSPARENT = "rgba(255, 91, 91, 0.3)";

// Timeframe mapping for proper interval calculation
const TIMEFRAME_MAP = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400
};

let chart = null;
let candleSeries = null;
let volumeSeries = null;
let resizeObserver = null;
let cachedCandles = [];
let tradeMarkers = [];

function logInfo(message, ...args) {
  console.log(`[CBP Charts] ${message}`, ...args);
}

function logWarn(message, ...args) {
  console.warn(`[CBP Charts] ${message}`, ...args);
}

function logError(message, ...args) {
  console.error(`[CBP Charts] ${message}`, ...args);
}

function getLW() {
  const LW = window[LW_GLOBAL];
  if (!LW || typeof LW.createChart !== "function") {
    logError("LightweightCharts library not available on window. Make sure the library is loaded before initializing charts.");
    return null;
  }
  return LW;
}

function timeframeToSeconds(tf = "1m") {
  if (!tf || typeof tf !== "string") return 60;
  const trimmed = tf.trim().toLowerCase();
  
  // Check predefined map first
  if (TIMEFRAME_MAP[trimmed]) {
    return TIMEFRAME_MAP[trimmed];
  }
  
  // Parse custom timeframes
  const unit = trimmed.slice(-1);
  const amount = parseInt(trimmed.slice(0, -1), 10);
  if (Number.isFinite(amount) && amount > 0) {
    if (unit === "s") return amount;
    if (unit === "h") return amount * 3600;
    if (unit === "d") return amount * 86400;
  }
  
  // Try parsing as minutes
  const minutes = parseInt(trimmed, 10);
  if (Number.isFinite(minutes) && minutes > 0) {
    return minutes * 60;
  }
  
  return 60; // Default to 1 minute
}

function createResizeObserver(container) {
  if (!window.ResizeObserver) {
    logWarn("ResizeObserver not available, chart will not auto-resize");
    return null;
  }
  return new ResizeObserver(() => {
    if (chart && container) {
      try {
        chart.applyOptions({
          width: container.clientWidth || 900,
          height: container.clientHeight || 400
        });
      } catch (err) {
        logWarn("ResizeObserver callback error", err);
      }
    }
  });
}

export function initMainChart(containerElement) {
  if (!containerElement) {
    logError("initMainChart: containerElement missing");
    return null;
  }

  const LW = getLW();
  if (!LW) {
    logError("Cannot initialize chart: LightweightCharts library not found");
    return null;
  }

  if (chart) {
    logInfo("Reusing existing chart instance");
    return chart;
  }

  try {
    chart = LW.createChart(containerElement, {
      width: containerElement.clientWidth || 900,
      height: containerElement.clientHeight || 420,
      layout: {
        background: { color: "#05060a" },
        textColor: "#d0d4e4",
        fontSize: 12,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)", visible: true },
        horzLines: { color: "rgba(255,255,255,0.04)", visible: true }
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1
        }
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        mode: LW.CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.15)",
          width: 1,
          style: 0
        },
        horzLine: {
          color: "rgba(255,255,255,0.15)",
          width: 1,
          style: 0
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true
      }
    });

    candleSeries = chart.addCandlestickSeries({
      upColor: COLOR_UP,
      downColor: COLOR_DOWN,
      wickUpColor: COLOR_UP,
      wickDownColor: COLOR_DOWN,
      borderVisible: false,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01
      }
    });

    volumeSeries = chart.addHistogramSeries({
      priceScaleId: "",
      priceFormat: { type: "volume" },
      scaleMargins: {
        top: 0.8,
        bottom: 0
      }
    });

    dashboardState.chartContainer = containerElement;
    dashboardState.chart = chart;
    dashboardState.series = {
      candles: candleSeries,
      volume: volumeSeries
    };

    resizeObserver = createResizeObserver(containerElement);
    if (resizeObserver) {
      resizeObserver.observe(containerElement);
    }

    // Handle window resize as fallback
    const handleWindowResize = () => {
      if (chart && containerElement) {
        try {
          chart.applyOptions({
            width: containerElement.clientWidth || 900,
            height: containerElement.clientHeight || 420
          });
        } catch (err) {
          logWarn("Window resize handler error", err);
        }
      }
    };
    window.addEventListener("resize", handleWindowResize);

    logInfo("Chart initialized successfully");
    return chart;
  } catch (err) {
    logError("Failed to initialize chart", err);
    return null;
  }
}

function mapApiCandles(rawCandles) {
  if (!Array.isArray(rawCandles)) {
    logWarn("mapApiCandles: expected array, got", typeof rawCandles);
    return [];
  }
  
  return rawCandles
    .map((candle) => {
      try {
        const time = Number(candle.time);
        const open = Number(candle.open);
        const high = Number(candle.high);
        const low = Number(candle.low);
        const close = Number(candle.close);
        const volume = Number(candle.volume ?? 0);

        // Validate required fields
        if (!Number.isFinite(time) || !Number.isFinite(open) || 
            !Number.isFinite(high) || !Number.isFinite(low) || 
            !Number.isFinite(close)) {
          logWarn("mapApiCandles: invalid candle data", candle);
          return null;
        }

        return {
          time,
          open,
          high: Math.max(high, open, close),
          low: Math.min(low, open, close),
          close,
          volume: Math.max(0, volume)
        };
      } catch (err) {
        logWarn("mapApiCandles: error mapping candle", err, candle);
        return null;
      }
    })
    .filter(Boolean);
}

function buildVolumeData(candles) {
  if (!Array.isArray(candles)) {
    return [];
  }
  
  return candles.map((candle) => ({
    time: candle.time,
    value: candle.volume ?? 0,
    color: candle.close >= candle.open ? COLOR_UP_TRANSPARENT : COLOR_DOWN_TRANSPARENT
  }));
}

function createSyntheticCandles(symbol, limit, timeframe) {
  logInfo("Creating synthetic candles fallback", { symbol, limit, timeframe });
  
  const now = Math.floor(Date.now() / 1000);
  const step = timeframeToSeconds(timeframe);
  const basePrice = symbol?.toUpperCase().startsWith("ETH") ? 2500 : 50000;
  const candles = [];

  for (let i = limit; i > 0; i -= 1) {
    const t = now - i * step;
    const offset = 300 * Math.sin(i / 10.0);
    const noise = 80 * Math.sin(i / 4.0);
    const open = basePrice + offset + noise;
    const delta = Math.sin(i / 5.0) * 150;
    const close = open + delta;
    const high = Math.max(open, close) + 40 + Math.abs(Math.sin(i / 7.0) * 30);
    const low = Math.min(open, close) - 40 - Math.abs(Math.sin(i / 8.0) * 30);
    const volume = 9000 + i * 12 + Math.random() * 500;

    candles.push({
      time: t,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(2))
    });
  }
  
  logInfo(`Generated ${candles.length} synthetic candles`);
  return candles;
}

function ensureSeries() {
  if (!chart || !candleSeries || !volumeSeries) {
    logWarn("ensureSeries: chart not ready, attempting to initialize");
    const container = dashboardState.chartContainer || document.getElementById("cbp-main-chart");
    if (!container) {
      logError("ensureSeries: container #cbp-main-chart not found in DOM");
      return false;
    }
    const result = initMainChart(container);
    if (!result) {
      logError("ensureSeries: failed to initialize chart");
      return false;
    }
  }
  return Boolean(chart && candleSeries && volumeSeries);
}

export async function loadCandles(symbolArg, timeframeArg, options = {}) {
  if (!ensureSeries()) {
    logWarn("loadCandles: chart not ready, skipping");
    return;
  }

  const exchange = options.exchange || dashboardState.exchange || "bybit";
  const mode = options.mode || dashboardState.mode || "test";
  const limit = options.limit || 200;
  const symbol = symbolArg || dashboardState.symbol || "BTCUSDT";
  const timeframe = timeframeArg || dashboardState.timeframe || "1m";

  logInfo(`Loading candles: ${symbol} ${timeframe} (${mode}, exchange: ${exchange}, limit: ${limit})`);

  const params = new URLSearchParams({
    exchange,
    symbol,
    timeframe,
    limit: String(limit)
  });

  // Add mode parameter if provided (for future live/backtest differentiation)
  if (mode && mode !== "test") {
    params.set("mode", mode);
  }

  let responseData = null;
  let useFallback = false;

  try {
    const url = `/api/candles?${params.toString()}`;
    logInfo(`Fetching candles from: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    responseData = await response.json();
    
    if (!responseData || typeof responseData !== "object") {
      throw new Error("Invalid response format: expected object");
    }

    if (!Array.isArray(responseData.candles)) {
      throw new Error("Invalid response: candles is not an array");
    }

    if (responseData.candles.length === 0) {
      logWarn("API returned empty candles array, using fallback");
      useFallback = true;
    }
  } catch (err) {
    logWarn(`loadCandles API request failed, using synthetic fallback:`, err.message);
    useFallback = true;
  }

  let mapped = [];
  if (!useFallback && Array.isArray(responseData?.candles) && responseData.candles.length > 0) {
    mapped = mapApiCandles(responseData.candles);
    if (mapped.length === 0) {
      logWarn("Mapped candles array is empty, using fallback");
      useFallback = true;
    }
  }

  if (useFallback || mapped.length === 0) {
    mapped = createSyntheticCandles(symbol, limit || FALLBACK_LIMIT, timeframe);
  }

  if (mapped.length === 0) {
    logError("Failed to generate any candles, chart will be empty");
    return;
  }

  try {
    // Sort candles by time to ensure correct order
    mapped.sort((a, b) => a.time - b.time);
    
    cachedCandles = mapped.slice();
    candleSeries.setData(mapped);
    volumeSeries.setData(buildVolumeData(mapped));
    chart.timeScale().fitContent();

    logInfo(`✓ Applied ${mapped.length} candles for ${symbol} ${timeframe} (${mode})`);
  } catch (err) {
    logError("Failed to apply candles to chart", err);
  }
}

export function applyLiveCandleUpdate(update = {}) {
  if (!ensureSeries()) {
    return;
  }

  // Extract price from various possible fields
  const price =
    typeof update.price === "number" && Number.isFinite(update.price)
      ? update.price
      : typeof update.close === "number" && Number.isFinite(update.close)
      ? update.close
      : typeof update.last === "number" && Number.isFinite(update.last)
      ? update.last
      : null;

  if (!price || price <= 0) {
    logWarn("applyLiveCandleUpdate: invalid or missing price", update);
    return;
  }

  const timeframe = update.timeframe || dashboardState.timeframe || "1m";
  const timeframeSeconds = timeframeToSeconds(timeframe);
  
  // Extract timestamp from various possible fields
  const timestamp = 
    typeof update.time === "number" && Number.isFinite(update.time)
      ? update.time
      : typeof update.timestamp === "number" && Number.isFinite(update.timestamp)
      ? update.timestamp
      : typeof update.ts === "number" && Number.isFinite(update.ts)
      ? update.ts
      : Math.floor(Date.now() / 1000);

  const bucketTime = Math.floor(timestamp / timeframeSeconds) * timeframeSeconds;
  const volume = typeof update.volume === "number" && Number.isFinite(update.volume)
    ? Math.max(0, update.volume)
    : typeof update.size === "number" && Number.isFinite(update.size)
    ? Math.max(0, update.size)
    : 0;

  if (cachedCandles.length === 0) {
    // No candles yet, create initial candle
    const initialCandle = {
      time: bucketTime,
      open: price,
      high: price,
      low: price,
      close: price,
      volume
    };
    cachedCandles.push(initialCandle);
    try {
      candleSeries.setData([initialCandle]);
      volumeSeries.setData([{
        time: bucketTime,
        value: volume,
        color: COLOR_UP_TRANSPARENT
      }]);
    } catch (err) {
      logError("applyLiveCandleUpdate: error setting initial data", err);
    }
    return;
  }

  let last = cachedCandles[cachedCandles.length - 1];
  
  if (bucketTime > last.time) {
    // New candle bucket - finalize previous and create new
    const newCandle = {
      time: bucketTime,
      open: last.close,
      high: Math.max(last.close, price),
      low: Math.min(last.close, price),
      close: price,
      volume
    };
    cachedCandles.push(newCandle);
    
    // Keep only last 1000 candles in cache to prevent memory issues
    if (cachedCandles.length > 1000) {
      cachedCandles.shift();
    }
    
    try {
      candleSeries.update(newCandle);
      volumeSeries.update({
        time: bucketTime,
        value: volume,
        color: newCandle.close >= newCandle.open ? COLOR_UP_TRANSPARENT : COLOR_DOWN_TRANSPARENT
      });
    } catch (err) {
      logError("applyLiveCandleUpdate: error updating new candle", err);
    }
  } else if (bucketTime === last.time) {
    // Update current candle
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);
    last.close = price;
    last.volume = (last.volume || 0) + volume;
    
    try {
      candleSeries.update(last);
      volumeSeries.update({
        time: last.time,
        value: last.volume || 0,
        color: last.close >= last.open ? COLOR_UP_TRANSPARENT : COLOR_DOWN_TRANSPARENT
      });
    } catch (err) {
      logError("applyLiveCandleUpdate: error updating current candle", err);
    }
  } else {
    // Outdated tick (timestamp < last candle time) - ignore silently
    // This is normal in high-frequency scenarios
  }
}

export function plotTradeMarker(trade = {}) {
  if (!candleSeries) {
    logWarn("plotTradeMarker: candleSeries not available");
    return;
  }

  if (!trade || typeof trade !== "object") {
    logWarn("plotTradeMarker: invalid trade object", trade);
    return;
  }

  // Extract side/direction from various possible fields
  const side = String(
    trade.side || 
    trade.direction || 
    trade.type || 
    ""
  ).toLowerCase().trim();
  
  const isBuy = side === "buy" || side === "long" || side === "b" || side === "l";
  const isSell = side === "sell" || side === "short" || side === "s";
  
  if (!isBuy && !isSell) {
    logWarn("plotTradeMarker: cannot determine trade side", trade);
    return;
  }

  // Extract timestamp from various possible fields
  const timestamp = 
    typeof trade.timestamp === "number" && Number.isFinite(trade.timestamp)
      ? trade.timestamp
      : typeof trade.time === "number" && Number.isFinite(trade.time)
      ? trade.time
      : typeof trade.ts === "number" && Number.isFinite(trade.ts)
      ? trade.ts
      : Math.floor(Date.now() / 1000);

  // Extract price for marker positioning
  const price = 
    typeof trade.price === "number" && Number.isFinite(trade.price)
      ? trade.price
      : typeof trade.entry_price === "number" && Number.isFinite(trade.entry_price)
      ? trade.entry_price
      : null;

  // Build marker text from symbol or side
  const markerText = trade.symbol 
    ? String(trade.symbol).toUpperCase().slice(0, 6)
    : isBuy ? "BUY" : "SELL";

  const marker = {
    time: Math.floor(timestamp),
    position: isBuy ? "belowBar" : "aboveBar",
    color: isBuy ? COLOR_UP : COLOR_DOWN,
    shape: isBuy ? "arrowUp" : "arrowDown",
    text: markerText,
    size: 1
  };

  // Add price to marker if available (for better positioning)
  if (price && price > 0) {
    // Note: Lightweight Charts doesn't support price in markers directly,
    // but we can use it for filtering/validation
  }

  tradeMarkers.push(marker);
  
  // Keep only last 100 markers to prevent performance issues
  if (tradeMarkers.length > 100) {
    tradeMarkers.shift();
  }

  try {
    candleSeries.setMarkers(tradeMarkers);
    dashboardState.tradeMarkers = tradeMarkers.slice();
    logInfo(`Trade marker added: ${markerText} at ${new Date(timestamp * 1000).toISOString()}`);
  } catch (err) {
    logError("plotTradeMarker: error setting markers", err);
  }
}
