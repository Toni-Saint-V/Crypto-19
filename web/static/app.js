;(function () {
  const $ = (id) => document.getElementById(id);

  let chart = null;
  let candleSeries = null;

  // ---------------- CHART ----------------
  function initChart() {
    const container = $("chart-root");
    if (!container) {
      console.error("chart-root not found");
      return;
    }

    if (!window.LightweightCharts || !LightweightCharts.createChart) {
      console.error("LightweightCharts not loaded", window.LightweightCharts);
      return;
    }

    chart = LightweightCharts.createChart(container, {
      height: container.clientHeight || 480,
      layout: {
        background: { color: "#0b1321" },
        textColor: "#c3cee5",
      },
      grid: {
        vertLines: { color: "#1b2740" },
        horzLines: { color: "#1b2740" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: "#1b2740",
      },
    });

    candleSeries = chart.addCandlestickSeries({
      upColor: "#2bb988",
      downColor: "#ff6b6b",
      wickUpColor: "#2bb988",
      wickDownColor: "#ff6b6b",
      borderVisible: false,
    });
  }

  // ---------------- STATUS ----------------
  async function loadStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();

      const mode = $("badge-mode");
      const net = $("badge-net");
      const eqVal = $("equity-value");
      const pnlVal = $("pnl-value");
      const openTrades = $("open-trades");
      const stratName = $("strategy-name");

      if (mode && data.mode) mode.textContent = data.mode;
      if (net && data.network) net.textContent = data.network;
      if (eqVal && data.equity != null && data.currency) {
        eqVal.textContent = `${data.equity.toLocaleString("ru-RU")} ${data.currency}`;
      }
      if (pnlVal && data.pnl_pct != null) {
        const sign = data.pnl_pct >= 0 ? "+" : "";
        pnlVal.textContent = `${sign}${data.pnl_pct}%`;
        pnlVal.classList.toggle("good", data.pnl_pct >= 0);
        pnlVal.classList.toggle("bad", data.pnl_pct < 0);
      }
      if (openTrades && data.open_trades != null) {
        openTrades.textContent = data.open_trades;
      }
      if (stratName && data.strategy) {
        stratName.textContent = data.strategy;
      }
    } catch (e) {
      console.error("status error", e);
    }
  }

  // ---------------- CANDLES (REST) ----------------
  async function loadCandles() {
    if (!candleSeries) return;

    try {
      const res = await fetch("/api/candles");
      if (!res.ok) throw new Error("status " + res.status);
      const payload = await res.json();
      const raw = payload.candles || payload.data || [];

      const candles = raw.map((c) => ({
        time: c.time,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }));

      candleSeries.setData(candles);
    } catch (e) {
      console.error("candles error", e);
    }
  }

  // ---------------- BACKTEST ----------------
  async function runBacktest() {
    const btn = $("btn-backtest");
    const tag = $("backtest-status");
    const meta = $("backtest-meta");

    if (btn) btn.disabled = true;
    if (tag) tag.textContent = "running...";
    if (meta) meta.textContent = "";

    try {
      const res = await fetch("/api/backtest/run", { method: "POST" });
      if (!res.ok) throw new Error("status " + res.status);
      await res.json();

      const sumRes = await fetch("/api/backtest/summary");
      const summary = await sumRes.json();

      if (tag) tag.textContent = "done";
      if (meta && summary) {
        const ret = summary.return_pct ?? summary.ret ?? 0;
        const trades = summary.trades ?? 0;
        meta.textContent = `Доходность: ${ret}% • Сделок: ${trades}`;
      }
    } catch (e) {
      console.error("backtest error", e);
      if (tag) tag.textContent = "error";
      if (meta) meta.textContent = "см. логи сервера";
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ---------------- WS LIVE FEED ----------------
  function connectWs() {
    const statusDot = $("ws-status");
    function setWsBadge(text, cls) {
      if (!statusDot) return;
      statusDot.textContent = text;
      statusDot.classList.remove("online", "offline");
      if (cls) statusDot.classList.add(cls);
    }

    const proto = window.location.protocol === "https:" ? "wss://" : "ws://";
    const url = proto + window.location.host + "/ws";

    let ws = new WebSocket(url);

    ws.onopen = () => setWsBadge("online", "online");

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "candle" && candleSeries) {
          const c = msg.data;
          candleSeries.update({
            time: c.time,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
          });
        }
      } catch (e) {
        console.error("ws message error", e);
      }
    };

    ws.onclose = () => {
      setWsBadge("offline", "offline");
      setTimeout(connectWs, 3000);
    };

    ws.onerror = (e) => {
      console.error("ws error", e);
      ws.close();
    };
  }

  // ---------------- CONTROLS ----------------
  function wireControls() {
    const btBtn = $("btn-backtest");
    if (btBtn) btBtn.addEventListener("click", runBacktest);
  }

  // ---------------- INIT ----------------
  async function init() {
    initChart();
    wireControls();
    await loadStatus();
    await loadCandles();
    connectWs();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
