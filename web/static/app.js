"use strict";

const state = {
  symbol: "BTCUSDT",
  tf: "1m",
  candles: [],
  ws: null,
};

// --------- LOG HELPERS (опционально) ---------
function log(msg) {
  const el = document.getElementById("log-terminal");
  const ts = new Date().toLocaleTimeString();
  if (el) {
    const line = document.createElement("div");
    line.textContent = `[${ts}] ${msg}`;
    el.prepend(line);
    const max = 200;
    while (el.childNodes.length > max) {
      el.removeChild(el.lastChild);
    }
  }
  console.log("[CBP]", msg);
}

// --------- CHART ---------
let chart = null;
let candleSeries = null;

function mapCandle(raw) {
  if (!raw) return null;
  let t = raw.time;
  if (!t) return null;
  // поддержка и секунд, и миллисекунд
  if (t > 1e12) t = Math.floor(t / 1000);

  return {
    time: t,
    open: Number(raw.open),
    high: Number(raw.high),
    low: Number(raw.low),
    close: Number(raw.close),
  };
}

function initChart() {
  const root = document.getElementById("chart-root");
  if (!root || !window.LightweightCharts) {
    console.error("chart-root or LightweightCharts missing");
    return;
  }

  // очищаем контейнер (на случай hot-reload)
  root.innerHTML = "";

  chart = LightweightCharts.createChart(root, {
    layout: {
      background: { color: "#050914" },
      textColor: "#cbd5f5",
    },
    grid: {
      vertLines: { color: "#111827" },
      horzLines: { color: "#111827" },
    },
    timeScale: {
      rightOffset: 5,
      borderColor: "#1f2937",
    },
    rightPriceScale: {
      borderColor: "#1f2937",
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: "#22c55e",
    downColor: "#ef4444",
    borderUpColor: "#22c55e",
    borderDownColor: "#ef4444",
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
  });

  if (state.candles.length) {
    candleSeries.setData(state.candles);
  }

  log("Chart initialized");
}

async function loadCandles() {
  const url = `/api/candles?symbol=${encodeURIComponent(
    state.symbol
  )}&tf=${encodeURIComponent(state.tf)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const raw = json.candles || json.data || [];
    const mapped = raw
      .map(mapCandle)
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    state.candles = mapped;

    if (candleSeries) {
      candleSeries.setData(mapped);
      chart.timeScale().fitContent();
    }

    const labelPair = document.getElementById("pair-label");
    if (labelPair) {
      labelPair.textContent = state.symbol;
    }

    log(
      `Loaded ${mapped.length} candles for ${state.symbol} @ ${state.tf} (Bybit testnet)`
    );
  } catch (e) {
    console.error(e);
    log(`Failed to load candles: ${e.message}`);
  }
}

// --------- WEBSOCKET ---------
function connectWs() {
  // закрываем старый
  if (state.ws) {
    try {
      state.ws.close();
    } catch (_) {}
    state.ws = null;
  }

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${proto}://${window.location.host}/ws`;

  try {
    const ws = new WebSocket(wsUrl);
    state.ws = ws;

    ws.onopen = () => {
      log("WebSocket connected");
      const statusEl = document.getElementById("ws-status");
      if (statusEl) statusEl.textContent = "online";
    };

    ws.onclose = () => {
      log("WebSocket closed");
      const statusEl = document.getElementById("ws-status");
      if (statusEl) statusEl.textContent = "offline";
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
      log("WebSocket error");
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (_) {
        return;
      }

      // поддержка разных форматов: {type:"candle", data:{...}} или сразу {...}
      const payload = msg.data || msg.candle || msg;
      const mapped = mapCandle(payload);
      if (!mapped || !candleSeries) return;

      candleSeries.update(mapped);
      state.candles.push(mapped);
    };
  } catch (e) {
    console.error(e);
    log("Failed to init WebSocket");
  }
}

// --------- CONTROLS ---------
function initControls() {
  const symbolSelect = document.getElementById("symbol-select");
  const tfSelect = document.getElementById("tf-select");

  if (symbolSelect) {
    symbolSelect.value = state.symbol;
    symbolSelect.addEventListener("change", async () => {
      state.symbol = symbolSelect.value;
      log(`Symbol changed to ${state.symbol}`);
      await loadCandles();
    });
  }

  if (tfSelect) {
    tfSelect.value = state.tf;
    tfSelect.addEventListener("change", async () => {
      state.tf = tfSelect.value;
      log(`Timeframe changed to ${state.tf}`);
      await loadCandles();
    });
  }

  // Кнопки с data-tf / data-symbol (если появятся в дизайне)
  document.querySelectorAll("[data-tf]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const v = btn.getAttribute("data-tf");
      if (!v) return;
      state.tf = v;
      if (tfSelect) tfSelect.value = v;
      log(`Timeframe changed to ${state.tf} (button)`);
      await loadCandles();
    });
  });

  document.querySelectorAll("[data-symbol]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const v = btn.getAttribute("data-symbol");
      if (!v) return;
      state.symbol = v;
      if (symbolSelect) symbolSelect.value = v;
      log(`Symbol changed to ${state.symbol} (button)`);
      await loadCandles();
    });
  });
}

// --------- INIT ---------
document.addEventListener("DOMContentLoaded", async () => {
  log("Dashboard init...");
  initChart();
  await loadCandles();
  connectWs();
  initControls();
});
