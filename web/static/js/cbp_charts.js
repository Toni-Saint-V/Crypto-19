// CryptoBot Pro — unified charts module (Bybit kline + trades)
"use strict";

import { dashboardState } from "./cbp_state.js";

let chart = null;
let candleSeries = null;
let volumeSeries = null;
let tradeMarkers = [];

// Маппинг таймфреймов UI -> Bybit interval
const TF_TO_BYBIT = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "D"
};

function getLightweightCharts() {
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

function cleanupChart() {
  try {
    if (chart && typeof chart.remove === "function") {
      chart.remove();
    }
  } catch (err) {
    console.warn("[CBP Charts] error while removing previous chart:", err);
  }

  chart = null;
  candleSeries = null;
  volumeSeries = null;
  tradeMarkers = [];

  if (dashboardState) {
    if (dashboardState.chart) {
      delete dashboardState.chart;
    }
    if (dashboardState.series) {
      delete dashboardState.series.candles;
      delete dashboardState.series.volume;
    }
  }
}

/**
 * Инициализация основного графика.
 * @param {HTMLElement} containerElement - DOM-элемент для чарта.
 * @returns {object|null} ChartApi или null при ошибке.
 */
export function initMainChart(containerElement) {
  console.log("[CBP Charts] initMainChart, container =", containerElement);

  if (!containerElement) {
    console.error("[CBP Charts] containerElement is null/undefined");
    return null;
  }

  const LW = getLightweightCharts();
  if (!LW) {
    return null;
  }

  // Чистим предыдущий чарт, если был
  cleanupChart();

  const width = containerElement.clientWidth || 900;
  const height = containerElement.clientHeight || 400;

  const createdChart = LW.createChart(containerElement, {
    width,
    height,
    layout: {
      background: { color: "#05060a" },
      textColor: "#d0d4e4"
    },
    rightPriceScale: {
      borderColor: "#333846"
    },
    timeScale: {
      borderColor: "#333846"
    },
    grid: {
      vertLines: { color: "#151824" },
      horzLines: { color: "#151824" }
    }
  });

  if (!createdChart) {
    console.error("[CBP Charts] created chart is null/undefined");
    return null;
  }

  // Без паранойи: если метод есть — работаем, если нет — логируем и выходим
  if (typeof createdChart.addCandlestickSeries !== "function") {
    console.error(
      "[CBP Charts] created chart does not look like ChartApi",
      createdChart
    );
    return null;
  }

  chart = createdChart;
  console.log("[CBP Charts] chart instance created:", chart);

  candleSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderVisible: false,
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350"
  });

  volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: "volume" },
    priceScaleId: "",
    scaleMargins: {
      top: 0.8,
      bottom: 0.0
    }
  });

  // Сохраняем в глобальное состояние дашборда
  if (dashboardState) {
    dashboardState.chart = chart;
    dashboardState.series = dashboardState.series || {};
    dashboardState.series.candles = candleSeries;
    dashboardState.series.volume = volumeSeries;
  }

  // Адаптация под resize
  window.addEventListener("resize", () => {
    if (!chart || !containerElement) return;
    const newWidth = containerElement.clientWidth || width;
    const newHeight = containerElement.clientHeight || height;
    chart.applyOptions({
      width: newWidth,
      height: newHeight
    });
  });

  console.log("[CBP Charts] chart initialized");
  return chart;
}

/**
 * Загрузка свечей (Bybit /v5/market/kline) и отрисовка на графике.
 * @param {string} symbol - например, "BTCUSDT".
 * @param {string} timeframe - "1m", "5m", "15m", "1h", ...
 */
export async function loadCandles(symbol, timeframe) {
  if (!chart || !candleSeries) {
    console.warn("[CBP Charts] loadCandles called before chart is ready");
    return;
  }

  const tf = timeframe || "15m";
  const interval = TF_TO_BYBIT[tf] || TF_TO_BYBIT["15m"];

  const url =
    "https://api.bybit.com/v5/market/kline" +
    `?category=linear&symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&limit=200`;

  console.log("[CBP Charts] fetch", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const list = payload?.result?.list || [];

    if (!Array.isArray(list) || list.length === 0) {
      console.warn("[CBP Charts] empty candles from Bybit", payload);
      candleSeries.setData([]);
      if (volumeSeries) {
        volumeSeries.setData([]);
      }
      chart.timeScale().fitContent();
      return;
    }

    // Bybit /v5/market/kline:
    // [ startTime(ms), open, high, low, close, volume, turnover ]
    const candles = list
      .map((row) => {
        const [start, open, high, low, close] = row;
        const t = Math.floor(Number(start) / 1000);
        return {
          time: t,
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close)
        };
      })
      .reverse();

    candleSeries.setData(candles);

    if (volumeSeries) {
      const volumes = list
        .map((row) => {
          const [start, open, , , close, volume] = row;
          const t = Math.floor(Number(start) / 1000);
          const up = Number(close) >= Number(open);
          return {
            time: t,
            value: Number(volume),
            color: up ? "#26a69a" : "#ef5350"
          };
        })
        .reverse();
      volumeSeries.setData(volumes);
    }

    // Сброс маркеров сделок при перезагрузке свечей
    tradeMarkers = [];
    candleSeries.setMarkers(tradeMarkers);

    chart.timeScale().fitContent();

    console.log("[CBP Charts] candles applied:", candles.length);
  } catch (error) {
    console.error("[CBP Charts] failed to load candles", error);
  }
}

/**
 * Отрисовка маркера сделки на графике.
 * @param {object} message - объект с данными сделки:
 *   { side: "BUY"|"SELL", timestamp?: number, price?: number|string }
 */
export function plotTradeMarker(message) {
  if (!candleSeries) {
    console.warn("[CBP Charts] plotTradeMarker called before candleSeries exists");
    return;
  }

  const rawSide = (message?.side || "").toString().toUpperCase();
  const side = rawSide === "SELL" ? "SELL" : "BUY";
  const position = side === "SELL" ? "aboveBar" : "belowBar";
  const shape = side === "SELL" ? "arrowDown" : "arrowUp";

  let time;
  if (typeof message?.timestamp === "number") {
    time = Math.floor(message.timestamp);
  } else {
    time = Math.floor(Date.now() / 1000);
  }

  let price;
  if (typeof message?.price === "number") {
    price = message.price;
  } else if (typeof message?.price === "string") {
    const maybe = Number(message.price);
    if (!Number.isNaN(maybe)) price = maybe;
  }

  const marker = {
    time,
    position,
    color: side === "SELL" ? "#ef5350" : "#26a69a",
    shape,
    text: side
  };

  if (typeof price === "number") {
    marker.price = price;
  }

  tradeMarkers.push(marker);
  candleSeries.setMarkers(tradeMarkers);

  console.log("[CBP Charts] trade marker added:", marker);
}
