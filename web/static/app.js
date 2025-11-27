(function () {
  const $ = (id) => document.getElementById(id);

  let chart, candleSeries;
  let equityChart, equitySeries;
  let ws;

  async function fetchJSON(url, options) {
    const res = await fetch(url, options || {});
    if (!res.ok) {
      const text = await res.text();
      throw new Error("HTTP " + res.status + " — " + text);
    }
    return res.json();
  }

  function initChart() {
    const el = $("chart");
    if (!el || !window.LightweightCharts) {
      console.warn("нет контейнера графика или LightweightCharts");
      return;
    }

    chart = LightweightCharts.createChart(el, {
      width: el.clientWidth,
      height: 420,
      layout: {
        background: { color: "#0b1321" },
        textColor: "#c3cee5",
      },
      grid: {
        vertLines: { color: "#1b2740" },
        horzLines: { color: "#1b2740" },
      },
      rightPriceScale: {
        borderColor: "#1b2740",
      },
      timeScale: {
        borderColor: "#1b2740",
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
    });

    candleSeries = chart.addCandlestickSeries();

    window.addEventListener("resize", () => {
      if (!chart) return;
      chart.applyOptions({ width: el.clientWidth });
    });
  }

  async function loadCandles() {
    if (!candleSeries) return;
    const symbolSel = $("symbol-select");
    const tfSel = $("tf-select");
    const statusTag = $("status-tag");

    const symbol = symbolSel ? symbolSel.value : "BTCUSDT";
    const tf = tfSel ? tfSel.value : "1m";

    try {
      if (statusTag) {
        statusTag.textContent = "loading…";
        statusTag.className = "chip chip-gray";
      }
      const data = await fetchJSON(
        `/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}`
      );

      const candles = (data.candles || []).map((c) => ({
        time: c.time,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }));

      candleSeries.setData(candles);

      if (statusTag) {
        statusTag.textContent = "online";
        statusTag.className = "chip chip-green";
      }
    } catch (e) {
      console.error("candles error", e);
      if (statusTag) {
        statusTag.textContent = "error";
        statusTag.className = "chip chip-red";
      }
    }
  }

  async function loadStatus() {
    try {
      const s = await fetchJSON("/api/status");
      if ($("mode-label")) $("mode-label").textContent = s.mode || "—";
      if ($("network-label"))
        $("network-label").textContent = s.network || "—";
      if ($("equity-value"))
        $("equity-value").textContent =
          s.equity != null && s.currency
            ? `${s.equity} ${s.currency}`
            : "—";
      if ($("pnl-value"))
        $("pnl-value").textContent =
          s.pnl_pct != null ? `${s.pnl_pct} %` : "—";
      if ($("open-trades"))
        $("open-trades").textContent =
          s.open_trades != null ? String(s.open_trades) : "—";
      if ($("strategy-name"))
        $("strategy-name").textContent = s.strategy || "—";
    } catch (e) {
      console.error("status error", e);
    }
  }

  async function loadEquity() {
    try {
      const data = await fetchJSON("/api/equity");
      const series = Array.isArray(data.series) ? data.series : [];

      const el = $("equity-chart");
      if (!el || !window.LightweightCharts) return;

      if (!equityChart) {
        equityChart = LightweightCharts.createChart(el, {
          width: el.clientWidth,
          height: 160,
          layout: {
            background: { color: "#0b1321" },
            textColor: "#c3cee5",
          },
          rightPriceScale: { borderColor: "#1b2740" },
          timeScale: { borderColor: "#1b2740" },
        });
        equitySeries = equityChart.addLineSeries();
        window.addEventListener("resize", () => {
          if (!equityChart) return;
          equityChart.applyOptions({ width: el.clientWidth });
        });
      }

      const lineData = series.map((v, idx) => ({
        time: idx + 1,
        value: Number(v),
      }));
      equitySeries.setData(lineData);
    } catch (e) {
      console.error("equity error", e);
    }
  }

  async function runBacktest() {
    const btn = $("btn-backtest");
    const tag = $("bt-status-tag");
    const meta = $("bt-meta");
    const tradesEl = $("bt-trades");
    const retEl = $("bt-ret");
    const tfSel = $("tf-select");
    const symbolSel = $("symbol-select");

    const payload = {
      symbol: symbolSel ? symbolSel.value : "BTCUSDT",
      tf: tfSel ? tfSel.value : "1m",
    };

    try {
      if (btn) btn.disabled = true;
      if (tag) {
        tag.textContent = "running";
        tag.className = "chip chip-blue";
      }
      if (meta) meta.textContent = "бэктест запускается…";

      await fetchJSON("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const s = await fetchJSON("/api/backtest/summary");
      const trades = s.trades != null ? s.trades : "—";
      const ret = s.return_pct != null ? s.return_pct : "—";

      if (tradesEl) tradesEl.textContent = trades;
      if (retEl)
        retEl.textContent =
          typeof ret === "number" ? ret.toFixed(2) + " %" : ret;

      if (tag) {
        tag.textContent = "completed";
        tag.className = "chip chip-green";
      }
      if (meta) {
        meta.textContent =
          typeof ret === "number"
            ? `ret: ${ret.toFixed(2)}% · trades: ${trades}`
            : "бэктест завершён";
      }
    } catch (e) {
      console.error("backtest error", e);
      if (tag) {
        tag.textContent = "error";
        tag.className = "chip chip-red";
      }
      if (meta) meta.textContent = "ошибка бэктеста, см. логи сервера";
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function connectWs() {
    if (!window.WebSocket) {
      console.warn("WebSocket не поддерживается");
      return;
    }
    try {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const url = `${proto}://${location.host}/ws`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("ws connected");
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "candle" && candleSeries) {
            const c = msg.data;
            const bar = {
              time: c.time,
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
            };
            candleSeries.update(bar);
          }
        } catch (e) {
          console.error("ws msg error", e);
        }
      };

      ws.onclose = () => {
        console.log("ws closed");
      };

      ws.onerror = (e) => {
        console.error("ws error", e);
      };
    } catch (e) {
      console.error("ws connect error", e);
    }
  }

  function wireControls() {
    const symbolSel = $("symbol-select");
    const tfSel = $("tf-select");
    const btBtn = $("btn-backtest");

    if (symbolSel) symbolSel.addEventListener("change", loadCandles);
    if (tfSel) tfSel.addEventListener("change", loadCandles);
    if (btBtn) btBtn.addEventListener("click", runBacktest);
  }

  async function init() {
    initChart();
    wireControls();
    await loadStatus();
    await loadCandles();
    await loadEquity();
    connectWs();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
