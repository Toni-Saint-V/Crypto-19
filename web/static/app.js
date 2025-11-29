"use strict";

function log(msg) {
  console.log("[CBP]", msg);
}

const state = {
  symbol: "BTCUSDT",
  tf: "1m",
  chart: null,
  candleSeries: null,
  socket: null,
};

// ---------- CHART ----------

function initChart() {
  const root = document.getElementById("chart-root");
  if (!root) {
    console.warn("chart-root not found");
    return;
  }
  const { width } = root.getBoundingClientRect();
  const height = 360;

  const chart = LightweightCharts.createChart(root, {
    width: width || 900,
    height,
    layout: {
      background: { color: "#0b1321" },
      textColor: "#c3cee5",
    },
    grid: {
      vertLines: { color: "#1b2740" },
      horzLines: { color: "#1b2740" },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: {
      borderColor: "rgba(197, 203, 206, 0.4)",
    },
    timeScale: {
      borderColor: "rgba(197, 203, 206, 0.4)",
    },
  });

  const series = chart.addCandlestickSeries({
    upColor: "#2bb988",
    downColor: "#ff6b6b",
    borderUpColor: "#2bb988",
    borderDownColor: "#ff6b6b",
    wickUpColor: "#2bb988",
    wickDownColor: "#ff6b6b",
  });

  state.chart = chart;
  state.candleSeries = series;

  window.addEventListener("resize", () => {
    const { width: w } = root.getBoundingClientRect();
    chart.applyOptions({ width: w || 900 });
  });

  log("Chart initialized");
}

async function loadCandles() {
  const url = `/api/candles?symbol=${encodeURIComponent(
    state.symbol
  )}&tf=${encodeURIComponent(state.tf)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const candles = Array.isArray(data) ? data : data.candles || [];

    if (!state.candleSeries) {
      console.warn("candleSeries not ready");
      return;
    }

    const items = candles.map((c) => ({
      time: Math.floor((c.time || c.t) / 1000) || c.time || c.t,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }));

    state.candleSeries.setData(items);
    log(`Loaded ${items.length} candles for ${state.symbol} ${state.tf}`);
  } catch (e) {
    console.error("loadCandles error", e);
  }
}

// ---------- WS LIVE FEED ----------

function connectWs() {
  try {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      log("WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "candle" && msg.data && state.candleSeries) {
          const c = msg.data;
          const bar = {
            time: Math.floor((c.time || c.t) / 1000) || c.time || c.t,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
          };
          state.candleSeries.update(bar);
        }
      } catch (err) {
        console.error("WS message error", err);
      }
    };

    ws.onclose = () => {
      log("WS closed");
      // простой реконнект
      setTimeout(connectWs, 3000);
    };

    state.socket = ws;
  } catch (e) {
    console.error("WS connect error", e);
  }
}

// ---------- CONTROLS (symbol / tf) ----------

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

  log("Controls initialized");
}

// ---------- BACKTEST PANEL + API ----------

function ensureBacktestPanel() {
  let panel = document.getElementById("cbp-backtest-panel");
  if (panel) return panel;

  const grid = document.querySelector(".grid") || document.body;

  panel = document.createElement("div");
  panel.id = "cbp-backtest-panel";
  panel.className = "card";

  panel.innerHTML = `
    <div class="card-header">
      <div>
        <h3>Backtest</h3>
        <p class="muted">Simple test strategy on latest candles</p>
      </div>
      <button id="cbp-backtest-run" class="btn primary">Run backtest</button>
    </div>
    <div class="card-body">
      <div class="stats small">
        <div class="stat">
          <div class="stat-label">Status</div>
          <div class="stat-value" id="cbp-backtest-status">idle</div>
        </div>
        <div class="stat">
          <div class="stat-label">Trades</div>
          <div class="stat-value" id="cbp-backtest-trades">0</div>
        </div>
        <div class="stat">
          <div class="stat-label">Return</div>
          <div class="stat-value" id="cbp-backtest-return">0.00%</div>
        </div>
      </div>
    </div>
  `;

  grid.appendChild(panel);
  return panel;
}

function updateBacktestUI(payload) {
  ensureBacktestPanel();
  const data = payload || {};
  const stats = data.stats || data;

  const statusEl = document.getElementById("cbp-backtest-status");
  const tradesEl = document.getElementById("cbp-backtest-trades");
  const retEl = document.getElementById("cbp-backtest-return");

  if (statusEl) statusEl.textContent = stats.status || "ok";
  if (tradesEl) tradesEl.textContent = stats.trades != null ? stats.trades : "0";

  if (retEl) {
    const rp = stats.return_pct != null ? Number(stats.return_pct) : 0;
    retEl.textContent = `${rp.toFixed(2)}%`;
  }
}

async function runBacktest() {
  ensureBacktestPanel();
  const btn = document.getElementById("cbp-backtest-run");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Running...";
  }

  try {
    log("Backtest run started");
    await fetch("/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: state.symbol,
        tf: state.tf,
        initial_balance: 1000,
      }),
    });

    const res = await fetch("/api/backtest/summary");
    if (!res.ok) {
      throw new Error(`summary HTTP ${res.status}`);
    }
    const data = await res.json();
    updateBacktestUI(data);
    log("Backtest finished");
  } catch (e) {
    console.error("runBacktest error", e);
    updateBacktestUI({ stats: { status: "error", trades: 0, return_pct: 0 } });
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Run backtest";
    }
  }
}

function initBacktestControls() {
  const panel = ensureBacktestPanel();
  const btn = panel.querySelector("#cbp-backtest-run");
  if (btn) {
    btn.addEventListener("click", runBacktest);
  }

  fetch("/api/backtest/summary")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data) updateBacktestUI(data);
    })
    .catch(() => {});

  window.cbpRunBacktest = runBacktest;

  log("Backtest controls initialized");
}

// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", async () => {
  log("Dashboard init...");
  initChart();
  await loadCandles();
  connectWs();
  initControls();
  initBacktestControls();
});

// ============================
// ENHANCED BACKTEST UI + MARKERS
// ============================

function cbpRenderTradesTable(trades) {
  const tbody = document.getElementById("trades-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!trades || !trades.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No trades yet";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  trades.forEach((t, idx) => {
    const tr = document.createElement("tr");

    const cols = [
      idx + 1,
      t.side,
      t.entry_price,
      t.exit_price,
      (t.pnl_pct > 0 ? "+" : "") + t.pnl_pct + "%",
    ];

    cols.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function cbpRenderVirtualPosition(data) {
  const trades = (data && data.trades) || [];
  const last = trades[trades.length - 1];

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  if (!last) {
    setText("pos-symbol", data && data.symbol ? data.symbol : "—");
    setText("pos-side", "—");
    setText("pos-entry", "—");
    setText("pos-pnl", "—");
    return;
  }

  setText("pos-symbol", data.symbol || "—");
  setText("pos-side", last.side || "—");
  setText("pos-entry", last.entry_price != null ? last.entry_price : "—");
  setText(
    "pos-pnl",
    last.pnl_pct != null
      ? ((last.pnl_pct > 0 ? "+" : "") + last.pnl_pct + "%")
      : "—"
  );
}

function cbpApplyMarkersFromBacktest(data) {
  if (!window.candleSeries) {
    // график ещё не инициализирован
    return;
  }
  const candles = (data && data.candles) || [];
  const trades = (data && data.trades) || [];
  if (!candles.length || !trades.length) {
    // просто сбрасываем маркеры, если нечего ставить
    try {
      window.candleSeries.setMarkers([]);
    } catch (e) {}
    return;
  }

  // Обновим свечи на графике теми же, по которым считали бэктест
  try {
    window.candleSeries.setData(candles);
  } catch (e) {
    console.warn("setData error", e);
  }

  const markers = [];

  trades.forEach((t) => {
    const entry = candles[t.entry_index];
    const exit = candles[t.exit_index];
    if (!entry || !exit) return;

    const isLong = t.side === "LONG";

    // маркер входа
    markers.push({
      time: entry.time,
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#1ebe6b" : "#ff4d4f",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: t.side + " " + t.entry_price,
    });

    // маркер выхода
    markers.push({
      time: exit.time,
      position: isLong ? "aboveBar" : "belowBar",
      color: isLong ? "#1ebe6b" : "#ff4d4f",
      shape: isLong ? "arrowDown" : "arrowUp",
      text: "x " + t.exit_price,
    });
  });

  try {
    window.candleSeries.setMarkers(markers);
  } catch (e) {
    console.warn("setMarkers error", e);
  }
}

// Переопределяем updateBacktestUI (если была раньше) на более умную версию
window.updateBacktestUI = function updateBacktestUI(data) {
  try {
    cbpRenderTradesTable((data && data.trades) || []);
    cbpRenderVirtualPosition(data);
    cbpApplyMarkersFromBacktest(data);

    // если есть summary-блоки, тоже обновим (опционально)
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    if (data) {
      setText("bt-status", data.status || "—");
      setText("bt-symbol", data.symbol || "—");
      setText("bt-tf", data.tf || "—");
      setText(
        "bt-pnl",
        data.total_pnl_pct != null
          ? ((data.total_pnl_pct > 0 ? "+" : "") + data.total_pnl_pct + "%")
          : "—"
      );
      setText("bt-trades-count", data.trades_count || 0);
    }
  } catch (e) {
    console.error("updateBacktestUI error", e);
  }
};
