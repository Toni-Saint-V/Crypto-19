"use strict";

let chart = null;
let candleSeries = null;
let volumeSeries = null;
let equitySeries = null;

// LightweightCharts из window
function getLW() {
  const LW = window.LightweightCharts;
  if (!LW || typeof LW.createChart !== "function") {
    console.error("[CBP Charts] LightweightCharts.createChart not available", LW);
    return null;
  }
  return LW;
}

// Нормализация времени
function normalizeTime(t) {
  if (typeof t === "number") {
    if (t > 1000000000000) {
      return Math.floor(t / 1000);
    }
    return t;
  }
  return t;
}

// Нормализация свечей
function mapCandles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(function (c) {
    const time =
      c.time !== undefined
        ? c.time
        : (c.timestamp !== undefined ? c.timestamp : c.t);

    const open = c.open !== undefined ? c.open : c.o;
    const high = c.high !== undefined ? c.high : c.h;
    const low = c.low !== undefined ? c.low : c.l;
    const close = c.close !== undefined ? c.close : c.c;
    const volume = c.volume !== undefined ? c.volume : c.v;

    return {
      time: normalizeTime(time),
      open: Number(open || 0),
      high: Number(high || 0),
      low: Number(low || 0),
      close: Number(close || 0),
      volume: Number(volume || 0)
    };
  });
}

// Внутреннее создание чарта
function createChart(container) {
  const LW = getLW();
  if (!LW || !container) return null;

  if (chart && typeof chart.remove === "function") {
    try { chart.remove(); } catch (e) { console.warn(e); }
  }

  chart = LW.createChart(container, {
    layout: {
      background: { color: "#020617" },
      textColor: "#e5e7eb"
    },
    grid: {
      vertLines: { color: "#0f172a" },
      horzLines: { color: "#0f172a" }
    },
    timeScale: {
      borderColor: "#1e293b",
      timeVisible: true
    },
    rightPriceScale: {
      borderColor: "#1e293b"
    }
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: "#22c55e",
    downColor: "#ef4444",
    borderUpColor: "#22c55e",
    borderDownColor: "#ef4444",
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444"
  });

  volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: "volume" },
    priceScaleId: "",
    overlay: true
  });

  equitySeries = chart.addLineSeries({
    color: "#38bdf8",
    lineWidth: 2,
    priceScaleId: "right"
  });

  console.log("[CBP Charts] createChart OK");
  return chart;
}

// Экспортируется для cbp_dashboard_main.js
export function initChart(container) {
  return createChart(container);
}

// На случай старых вызовов
export function initMainChart(container) {
  return createChart(container);
}

// Свечи + объёмы
export function setCandles(raw) {
  if (!candleSeries || !volumeSeries) {
    console.warn("[CBP Charts] setCandles: series not ready");
    return;
  }
  const data = mapCandles(raw || []);
  candleSeries.setData(data);

  const volData = data.map(function (d) {
    const up = d.close >= d.open;
    return {
      time: d.time,
      value: d.volume,
      color: up ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"
    };
  });
  volumeSeries.setData(volData);

  if (chart) {
    chart.timeScale().fitContent();
  }
}

// Кривая equity
export function setEquity(points) {
  if (!equitySeries) {
    console.warn("[CBP Charts] setEquity: series not ready");
    return;
  }
  if (!Array.isArray(points) || points.length === 0) {
    equitySeries.setData([]);
    return;
  }
  const data = points.map(function (p) {
    const time = normalizeTime(p.time !== undefined ? p.time : p.t);
    const value = Number(
      p.value !== undefined ? p.value : (p.equity !== undefined ? p.equity : 0)
    );
    return { time: time, value: value };
  });
  equitySeries.setData(data);
}

// Сделки как маркеры
export function setTrades(trades) {
  if (!candleSeries) {
    console.warn("[CBP Charts] setTrades: candleSeries not ready");
    return;
  }
  if (!Array.isArray(trades) || trades.length === 0) {
    candleSeries.setMarkers([]);
    return;
  }
  const markers = trades.map(function (tr) {
    const side = (tr.side || tr.direction || "").toLowerCase();
    const isSell = side === "sell" || side === "short";
    const time = normalizeTime(tr.time !== undefined ? tr.time : tr.t);
    return {
      time: time,
      position: isSell ? "aboveBar" : "belowBar",
      color: isSell ? "#f97316" : "#22c55e",
      shape: isSell ? "arrowDown" : "arrowUp",
      text: tr.side || tr.direction || ""
    };
  });
  candleSeries.setMarkers(markers);
}

// Универсальный апдейтер под updateChart(snapshot)
export function updateChart(payload) {
  if (!payload || typeof payload !== "object") {
    console.warn("[CBP Charts] updateChart: invalid payload", payload);
    return;
  }

  if (Array.isArray(payload.candles)) {
    setCandles(payload.candles);
  }
  const equity =
    (payload.stats && payload.stats.backtest && payload.stats.backtest.equity_curve) ||
    payload.equity_curve ||
    payload.equity ||
    null;
  if (equity && Array.isArray(equity)) {
    setEquity(equity);
  }
  if (Array.isArray(payload.trades)) {
    setTrades(payload.trades);
  }
}
