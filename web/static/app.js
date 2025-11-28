(function () {
  let chart;
  let candleSeries;
  let ws;

  function $(id) {
    return document.getElementById(id);
  }

  function initChart() {
    const root = $("chart-root");
    if (!root) {
      console.error("chart-root not found");
      return;
    }
    if (!window.LightweightCharts) {
      console.error("LightweightCharts is not available");
      return;
    }

    chart = LightweightCharts.createChart(root, {
      layout: {
        background: { type: "solid", color: "rgba(0,0,0,0)" },
        textColor: "#c3cee5",
        fontSize: 12
      },
      grid: {
        vertLines: { color: "#1b2740" },
        horzLines: { color: "#1b2740" }
      },
      rightPriceScale: {
        borderColor: "#1b2740"
      },
      timeScale: {
        borderColor: "#1b2740",
        timeVisible: true,
        secondsVisible: false
      }
    });

    candleSeries = chart.addCandlestickSeries({
      upColor: "#2bb988",
      downColor: "#ff6b6b",
      borderVisible: false,
      wickUpColor: "#2bb988",
      wickDownColor: "#ff6b6b"
    });

    const resizeObserver = new ResizeObserver(function () {
      chart.applyOptions({
        width: root.clientWidth,
        height: root.clientHeight
      });
    });
    resizeObserver.observe(root);
    chart.applyOptions({
      width: root.clientWidth,
      height: root.clientHeight
    });
  }

  async function loadStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) return;
      const data = await res.json();
      const backend = $("st-backend");
      const uptime = $("st-uptime");
      if (backend && data.status) backend.textContent = data.status;
      if (uptime && data.uptime) uptime.textContent = data.uptime;
    } catch (e) {
      console.error("status error", e);
    }
  }

  async function loadCandles() {
    if (!candleSeries) return;
    try {
      const res = await fetch("/api/candles");
      if (!res.ok) return;
      const payload = await res.json();
      const candles = payload.candles || [];
      if (!Array.isArray(candles) || candles.length === 0) return;
      const prepared = candles.map(function (c) {
        return {
          time: c.time,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close)
        };
      });
      candleSeries.setData(prepared);
      const feedDot = $("feed-dot");
      if (feedDot) feedDot.classList.add("online");
    } catch (e) {
      console.error("candles error", e);
    }
  }

  async function runBacktest() {
    const btn = $("btn-backtest");
    const statusEl = $("backtest-status");
    const dot = $("bt-dot");
    const meta = $("backtest-meta");
    const retEl = $("bt-return");
    const tradesEl = $("bt-trades");
    const logEl = $("bt-log");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Считаем...";
    }
    if (statusEl) statusEl.textContent = "running";
    if (dot) {
      dot.classList.remove("idle");
      dot.classList.add("online");
    }
    if (meta) meta.textContent = "Бэктест в процессе...";

    try {
      await fetch("/api/backtest/run", { method: "POST" });
      const res = await fetch("/api/backtest/summary");
      if (res.ok) {
        const data = await res.json();
        const ret = data.return_pct;
        const trades = data.trades;

        if (retEl) {
          if (typeof ret === "number") {
            retEl.textContent = ret.toFixed(1) + " %";
          } else {
            retEl.textContent = "—";
          }
        }
        if (tradesEl) {
          tradesEl.textContent = trades != null ? String(trades) : "—";
        }
        if (meta) meta.textContent = "Последний прогон завершён.";
        if (logEl) {
          var retText = typeof ret === "number" ? ret.toFixed(1) + "%" : "—";
          var trText = trades != null ? String(trades) : "—";
          logEl.textContent =
            "Бэктест завершён. Сделок: " + trText + ", доходность: " + retText + ".";
        }
        if (statusEl) statusEl.textContent = "done";
      }
    } catch (e) {
      console.error("backtest error", e);
      if (meta) meta.textContent = "Не удалось выполнить бэктест.";
      if (statusEl) statusEl.textContent = "error";
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Запустить бэктест";
      }
      if (dot) {
        dot.classList.remove("online");
        dot.classList.add("idle");
      }
    }
  }

  function connectWs() {
    try {
      const url =
        (location.protocol === "https:" ? "wss://" : "ws://") +
        location.host +
        "/ws";
      ws = new WebSocket(url);
    } catch (e) {
      console.error("ws open error", e);
      return;
    }

    const wsStatus = $("st-ws");

    ws.onopen = function () {
      if (wsStatus) wsStatus.textContent = "online";
      const feedDot = $("feed-dot");
      if (feedDot) feedDot.classList.add("online");
    };

    ws.onmessage = function (event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "candle" && candleSeries) {
          const c = msg.data;
          candleSeries.update({
            time: c.time,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
          });
        }
      } catch (e) {
        console.error("ws message error", e);
      }
    };

    ws.onclose = function () {
      if (wsStatus) wsStatus.textContent = "offline";
      setTimeout(connectWs, 3000);
    };

    ws.onerror = function () {
      if (wsStatus) wsStatus.textContent = "error";
      try {
        ws.close();
      } catch (e) {}
    };
  }

  function setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          t.classList.remove("active");
        });
        panels.forEach(function (p) {
          p.classList.remove("active");
        });
        tab.classList.add("active");
        const panel = document.getElementById("tab-" + target);
        if (panel) panel.classList.add("active");
      });
    });
  }

  function setupToolbar() {
    const chips = document.querySelectorAll(".chip");
    const symbolSelect = $("symbol-select");
    const subtitle = $("chart-subtitle");

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) {
          c.classList.remove("chip-active");
        });
        chip.classList.add("chip-active");
        const tf = chip.getAttribute("data-tf") || "1m";
        const symbol = symbolSelect ? symbolSelect.value : "BTCUSDT";
        if (subtitle) subtitle.textContent = symbol + " · " + tf;
      });
    });

    if (symbolSelect) {
      symbolSelect.addEventListener("change", function () {
        const activeChip = document.querySelector(".chip.chip-active");
        const tf = activeChip ? activeChip.getAttribute("data-tf") || "1m" : "1m";
        const symbol = symbolSelect.value;
        if (subtitle) subtitle.textContent = symbol + " · " + tf;
      });
    }

    const btBtn = $("btn-backtest");
    if (btBtn) btBtn.addEventListener("click", runBacktest);
  }

  async function init() {
    initChart();
    setupToolbar();
    setupTabs();
    await loadStatus();
    await loadCandles();
    connectWs();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
