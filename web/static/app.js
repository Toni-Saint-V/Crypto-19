"use strict";

// ============================
// HELPERS: лог и нормализация свечей
// ============================

function cbpLog(msg, extra) {
  if (extra !== undefined) {
    console.log("[CBP]", msg, extra);
  } else {
    console.log("[CBP]", msg);
  }
}

function cbpSanitizeCandles(raw) {
  if (!Array.isArray(raw)) return [];

  const safe = raw
    .filter((c) => {
      if (!c) return false;
      const { time, open, high, low, close } = c;
      return (
        time !== null &&
        time !== undefined &&
        open !== null &&
        open !== undefined &&
        high !== null &&
        high !== undefined &&
        low !== null &&
        low !== undefined &&
        close !== null &&
        close !== undefined
      );
    })
    .map((c) => {
      return {
        time: typeof c.time === "number" ? c.time : Math.floor(Number(c.time)),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      };
    });

  cbpLog("Sanitized candles", { before: raw.length, after: safe.length });
  return safe;
}

// ============================
// ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ============================

const CBP_STATE = {
  symbol: "BTCUSDT",
  tf: "1m",
  candles: [],
  backtest: null,
  chart: null,
  candleSeries: null,
  ws: null,
};

// ============================
// ИНИЦИАЛИЗАЦИЯ ЧАРТА
// ============================

function cbpInitChart() {
  const root = document.getElementById("chart-root");
  if (!root) {
    cbpLog("chart-root not found in DOM");
    return;
  }

  const chart = LightweightCharts.createChart(root, {
    layout: {
      background: { color: "#0b1321" },
      textColor: "#c3cee5",
    },
    grid: {
      vertLines: { color: "#1b2740" },
      horzLines: { color: "#1b2740" },
    },
    timeScale: {
      borderColor: "#1b2740",
    },
    rightPriceScale: {
      borderColor: "#1b2740",
    },
  });

  const candleSeries = chart.addCandlestickSeries();

  // оборачиваем setData, чтобы всегда чистить вход
  const origSetData = candleSeries.setData.bind(candleSeries);
  candleSeries.setData = (raw) => {
    const safe = cbpSanitizeCandles(raw || []);
    try {
      origSetData(safe);
    } catch (e) {
      console.error("setData error after sanitize", e);
    }
  };

  CBP_STATE.chart = chart;
  CBP_STATE.candleSeries = candleSeries;
  window.chart = chart;
  window.candleSeries = candleSeries;

  cbpLog("Chart initialized");
}

// ============================
// ЗАГРУЗКА СВЕЧЕЙ С БЭКА
// ============================

async function cbpLoadCandles(symbol, tf) {
  CBP_STATE.symbol = symbol;
  CBP_STATE.tf = tf;

  try {
    const res = await fetch(
      `/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}`
    );
    if (!res.ok) {
      cbpLog("Failed to load candles", res.status);
      return;
    }
    const data = await res.json();
    const candles = Array.isArray(data.candles) ? data.candles : [];
    const safe = cbpSanitizeCandles(candles);

    CBP_STATE.candles = safe;

    if (CBP_STATE.candleSeries) {
      CBP_STATE.candleSeries.setData(safe);
    }

    cbpLog(`Loaded ${safe.length} candles for ${symbol} ${tf}`);
  } catch (e) {
    console.error("Error loading candles", e);
  }
}

// ============================
// WEBSOCKET (mock или real-time)
// ============================

function cbpInitWS() {
  try {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      cbpLog("WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "candle" && msg.data && CBP_STATE.candleSeries) {
          const raw = msg.data;
          const safeArr = cbpSanitizeCandles([raw]);
          if (!safeArr.length) return;
          const safe = safeArr[0];

          CBP_STATE.candles.push(safe);
          CBP_STATE.candles = CBP_STATE.candles.slice(-500);

          CBP_STATE.candleSeries.setData(CBP_STATE.candles);
        }
      } catch (e) {
        console.warn("WS message parse error", e);
      }
    };

    ws.onclose = () => {
      cbpLog("WS closed");
    };

    CBP_STATE.ws = ws;
  } catch (e) {
    console.error("WS init error", e);
  }
}

// ============================
// КОНТРОЛЫ: символы, таймфреймы
// ============================

function cbpInitControls() {
  // селект символа
  const sel =
    document.getElementById("symbol-select") ||
    document.querySelector("[data-cbp-symbol-select]");
  if (sel) {
    sel.addEventListener("change", () => {
      const symbol = sel.value || "BTCUSDT";
      cbpLog("Symbol changed", symbol);
      cbpLoadCandles(symbol, CBP_STATE.tf);
    });
  }

  // кнопки таймфрейма (по data-атрибуту, чтобы не зависеть от конкретных id)
  const tfButtons = document.querySelectorAll("[data-tf]");
  tfButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tf = btn.getAttribute("data-tf");
      if (!tf) return;
      cbpLog(`Timeframe changed to ${tf} (button)`);
      cbpLoadCandles(CBP_STATE.symbol, tf);
      tfButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  cbpLog("Controls initialized");
}

// ============================
// BACKTEST: отрисовка UI и маркеров
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
    setText("pos-symbol", (data && data.symbol) || "—");
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
      ? (last.pnl_pct > 0 ? "+" : "") + last.pnl_pct + "%"
      : "—"
  );
}

function cbpApplyMarkersFromBacktest(data) {
  const series = CBP_STATE.candleSeries;
  if (!series) return;

  const candles = (data && data.candles) || [];
  const trades = (data && data.trades) || [];

  if (!candles.length) {
    // нет свечей — ничего не делаем
    return;
  }

  // обновим свечи на графике теми же, по которым считали бэктест
  series.setData(candles);

  if (!trades.length) {
    try {
      series.setMarkers([]);
    } catch (e) {
      console.warn("setMarkers([]) error", e);
    }
    return;
  }

  const markers = [];

  trades.forEach((t) => {
    const entry = candles[t.entry_index];
    const exit = candles[t.exit_index];
    if (!entry || !exit) return;

    const isLong = t.side === "LONG";

    markers.push({
      time: entry.time,
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#1ebe6b" : "#ff4d4f",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: t.side + " " + t.entry_price,
    });

    markers.push({
      time: exit.time,
      position: isLong ? "aboveBar" : "belowBar",
      color: isLong ? "#1ebe6b" : "#ff4d4f",
      shape: isLong ? "arrowDown" : "arrowUp",
      text: "x " + t.exit_price,
    });
  });

  try {
    series.setMarkers(markers);
  } catch (e) {
    console.warn("setMarkers error", e);
  }
}

// Переопределяем/задаём updateBacktestUI глобально
window.updateBacktestUI = function updateBacktestUI(data) {
  try {
    cbpRenderTradesTable((data && data.trades) || []);
    cbpRenderVirtualPosition(data);
    cbpApplyMarkersFromBacktest(data);

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
          ? (data.total_pnl_pct > 0 ? "+" : "") + data.total_pnl_pct + "%"
          : "—"
      );
      setText("bt-trades-count", data.trades_count || 0);
    }
  } catch (e) {
    console.error("updateBacktestUI error", e);
  }
};

// ============================
// BACKTEST: запросы к API
// ============================

async function cbpLoadBacktestSummary() {
  try {
    const res = await fetch("/api/backtest/summary");
    if (!res.ok) {
      cbpLog("Backtest summary failed", res.status);
      return;
    }
    const data = await res.json();
    CBP_STATE.backtest = data;
    window.updateBacktestUI(data);
  } catch (e) {
    console.error("Error loading backtest summary", e);
  }
}

async function cbpRunBacktest() {
  const payload = {
    symbol: CBP_STATE.symbol,
    tf: CBP_STATE.tf,
  };

  try {
    cbpLog("Run backtest", payload);
    await fetch("/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await cbpLoadBacktestSummary();
  } catch (e) {
    console.error("Error running backtest", e);
  }
}

function cbpInitBacktestControls() {
  const btn =
    document.getElementById("bt-run") ||
    document.getElementById("backtest-run-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      cbpRunBacktest();
    });
  }

  cbpLog("Backtest controls initialized");
}

// ============================
// MAIN INIT
// ============================

function cbpInitDashboard() {
  cbpLog("Dashboard init...");

  cbpInitChart();
  cbpInitControls();
  cbpInitBacktestControls();
  cbpInitWS();

  // первая загрузка
  cbpLoadCandles(CBP_STATE.symbol, CBP_STATE.tf);
  cbpLoadBacktestSummary();
}

document.addEventListener("DOMContentLoaded", cbpInitDashboard);
