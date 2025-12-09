// CryptoBot Pro — минимальный стабильный график (Lightweight Charts)
"use strict";

import { dashboardState } from "./cbp_state.js";

let chart = null;
let candleSeries = null;

/**
 * Инициализация основного графика.
 * containerElement — div, куда рисуем график.
 */
export function initMainChart(containerElement) {
  console.log("[CBP Charts] initMainChart, container =", containerElement);

  if (!containerElement) {
    console.error("[CBP Charts] containerElement is null/undefined");
    return;
  }

  const LW = window.LightweightCharts;
  if (!LW || typeof LW.createChart !== "function") {
    console.error(
      "[CBP Charts] LightweightCharts.createChart is not available",
      window.LightweightCharts
    );
    containerElement.innerText = "Ошибка: библиотека графика не загрузилась";
    return;
  }

  // Очищаем контейнер на всякий случай
  containerElement.innerHTML = "";

  // Создаём график
  const rect = containerElement.getBoundingClientRect();
  chart = LW.createChart(containerElement, {
    width: rect.width || 900,
    height: rect.height || 400,
    layout: {
      background: { type: "solid", color: "#050816" },
      textColor: "#d1d5db",
    },
    grid: {
      vertLines: { color: "rgba(255,255,255,0.04)" },
      horzLines: { color: "rgba(255,255,255,0.04)" },
    },
    rightPriceScale: {
      borderColor: "rgba(197,203,206,0.4)",
    },
    timeScale: {
      borderColor: "rgba(197,203,206,0.4)",
    },
    crosshair: {
      mode: LW.CrosshairMode.Normal,
    },
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: "#25C26E",
    downColor: "#FF5B5B",
    borderUpColor: "#25C26E",
    borderDownColor: "#FF5B5B",
    wickUpColor: "#25C26E",
    wickDownColor: "#FF5B5B",
  });

  // ВРЕМЕННО: демо-данные, чтобы убедиться, что график вообще работает
  const demoData = generateDemoCandles();
  candleSeries.setData(demoData);

  // Ресайз при изменении окна
  window.addEventListener("resize", () => {
    const r = containerElement.getBoundingClientRect();
    chart.applyOptions({
      width: r.width,
      height: r.height,
    });
  });

  console.log("[CBP Charts] chart initialized OK");
}

/**
 * Генерация демо-свечей (50 штук) чтобы график не был пустым.
 */
function generateDemoCandles() {
  const result = [];
  const now = Math.floor(Date.now() / 1000);
  let price = 40000;

  for (let i = 0; i < 50; i++) {
    const open = price;
    const delta = (Math.random() - 0.5) * 500;
    const close = open + delta;
    const high = Math.max(open, close) + Math.random() * 200;
    const low = Math.min(open, close) - Math.random() * 200;

    result.push({
      time: now - (50 - i) * 60, // шаг 1 мин
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
    });

    price = close;
  }

  return result;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}
