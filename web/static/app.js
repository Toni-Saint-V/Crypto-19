(function () {
  const $ = (id) => document.getElementById(id);

  let chart;
  let mainSeries;
  let equityChart;
  let equitySeries;
  let ws;

  // trades-by-time для тултипов
  const tradeByTime = new Map();
  let tradeTooltipEl = null;

  // ==============================
  //  HELPERS
  // ==============================

  function createTradeTooltip(container) {
    if (tradeTooltipEl) return tradeTooltipEl;
    const el = document.createElement("div");
    el.className = "trade-tooltip";
    el.style.position = "absolute";
    el.style.zIndex = "20";
    el.style.pointerEvents = "none";
    el.style.padding = "8px 10px";
    el.style.borderRadius = "8px";
    el.style.fontSize = "11px";
    el.style.lineHeight = "1.4";
    el.style.background = "rgba(5, 10, 20, 0.96)";
    el.style.color = "#e7edf7";
    el.style.border = "1px solid rgba(255,255,255,0.08)";
    el.style.boxShadow = "0 8px 18px rgba(0,0,0,0.45)";
    el.style.whiteSpace = "pre";
    el.style.display = "none";
    container.style.position = container.style.position || "relative";
    container.appendChild(el);
    tradeTooltipEl = el;
    return el;
  }

  function hideTradeTooltip() {
    if (tradeTooltipEl) {
      tradeTooltipEl.style.display = "none";
    }
  }

  function showTradeTooltip(trade, point, container) {
    const el = createTradeTooltip(container);
    const sideLabel = trade.side || "LONG";
    const pnlStr = trade.pnl != null ? trade.pnl.toFixed(1) + "%" : "+0.0%";
    const tpMark = trade.tp_hit ? "✅" : "❌";
    const slMark = trade.sl_hit ? "✅" : "❌";

    el.textContent =
      "#" + (trade.id || 145) + " - " + sideLabel + "\n" +
      "Entry: " + (trade.entry || 49200) + "\n" +
      "TP: " + (trade.tp || 49900) + " " + tpMark + "\n" +
      "SL: " + (trade.sl || 48900) + " " + slMark + "\n" +
      "Exit: " + (trade.exit || 49860) + "\n" +
      "PnL: " + pnlStr;

    const rect = container.getBoundingClientRect();
    const x = point && typeof point.x === "number" ? point.x : rect.width / 2;
    const y = point && typeof point.y === "number" ? point.y : rect.height / 2;

    el.style.left = Math.round(x + 12) + "px";
    el.style.top = Math.round(y + 12) + "px";
    el.style.display = "block";
  }

  function buildMockCandles() {
    const now = Math.floor(Date.now() / 1000);
    const res = [];
    let price = 50000;
    for (let i = 60; i >= 0; i--) {
      const t = now - i * 60;
      const open = price;
      const high = open + Math.random() * 80;
      const low = open - Math.random() * 80;
      const close = low + Math.random() * (high - low);
      price = close;
      res.push({
        time: t,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
      });
    }
    return res;
  }

  function buildMockEquity() {
    const res = [];
    let v = 100;
    for (let i = 0; i < 60; i++) {
      v += (Math.random() - 0.4) * 1.5;
      res.push({ time: Math.floor(Date.now() / 1000) - (60 - i) * 60, value: v });
    }
    return res;
  }

  function buildMockTrades(candles) {
    if (!candles || candles.length < 10) return [];
    const n = candles.length;
    const baseIdx = Math.max(3, n - 15);
    const picks = [
      { idx: baseIdx, side: "LONG" },
      { idx: baseIdx + 4, side: "SHORT" },
      { idx: baseIdx + 8, side: "LONG" },
    ];
    return picks.map((p, i) => {
      const c = candles[p.idx];
      const entry = c.open;
      const exit = c.close;
      const dir = p.side === "LONG" ? 1 : -1;
      const pnl = ((exit - entry) / entry) * 100 * dir;
      const tp = p.side === "LONG" ? entry + (entry * 0.015) : entry - (entry * 0.015);
      const sl = p.side === "LONG" ? entry - (entry * 0.007) : entry + (entry * 0.007);

      return {
        id: 145 + i,
        side: p.side,
        time: c.time,
        entry: Math.round(entry),
        exit: Math.round(exit),
        tp: Math.round(tp),
        sl: Math.round(sl),
        tp_hit: pnl > 1.0,
        sl_hit: pnl < -0.5,
        pnl,
      };
    });
  }

  // ==============================
  //  CHARTS
  // ==============================

  function initCharts() {
    const chartRoot = $("chart-root");
    const equityRoot = $("equity-root");

    if (!chartRoot || !window.LightweightCharts) {
      console.warn("chart-root or LightweightCharts not found");
      return;
    }

    // MAIN CHART
    chart = LightweightCharts.createChart(chartRoot, {
      layout: {
        background: { color: "transparent" },
        textColor: "#c2cee4",
      },
      grid: {
        vertLines: { color: "rgba(68, 82, 110, 0.25)" },
        horzLines: { color: "rgba(68, 82, 110, 0.25)" },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(134, 150, 180, 0.4)",
      },
      timeScale: {
        borderColor: "rgba(134, 150, 180, 0.4)",
      },
    });

    mainSeries = chart.addCandlestickSeries({
      upColor: "rgba(46, 189, 133, 1)",
      downColor: "rgba(255, 107, 107, 1)",
      wickUpColor: "rgba(46, 189, 133, 1)",
      wickDownColor: "rgba(255, 107, 107, 1)",
      borderVisible: false,
    });

    const ema20 = chart.addLineSeries({
      color: "rgba(79, 171, 247, 1)",
      lineWidth: 2,
    });

    const ema50 = chart.addLineSeries({
      color: "rgba(220, 192, 108, 1)",
      lineWidth: 1,
    });

    // EQUITY CHART (справа)
    if (equityRoot && window.LightweightCharts) {
      equityChart = LightweightCharts.createChart(equityRoot, {
        layout: {
          background: { color: "transparent" },
          textColor: "#c2cee4",
        },
        grid: {
          vertLines: { color: "rgba(68, 82, 110, 0.18)" },
          horzLines: { color: "rgba(68, 82, 110, 0.18)" },
        },
        rightPriceScale: {
          borderColor: "rgba(134, 150, 180, 0.32)",
        },
        timeScale: {
          borderColor: "rgba(134, 150, 180, 0.32)",
        },
      });

      equitySeries = equityChart.addLineSeries({
        color: "rgba(79, 171, 247, 1)",
        lineWidth: 2,
      });

      // mock equity сразу
      const eqMock = buildMockEquity();
      equitySeries.setData(eqMock);
    }

    // crosshair для трейд-тултипов
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time) {
        hideTradeTooltip();
        return;
      }
      const trade = tradeByTime.get(param.time);
      const container = $("chart-root");
      if (!trade || !container) {
        hideTradeTooltip();
        return;
      }
      showTradeTooltip(trade, param.point || null, container);
    });

    // mock EMA, если нужно — потом заменим бэкендом
    function calcEma(data, period) {
      if (!data || data.length === 0) return [];
      const k = 2 / (period + 1);
      const res = [];
      let emaPrev = data[0].close;
      res.push({ time: data[0].time, value: emaPrev });
      for (let i = 1; i < data.length; i++) {
        const price = data[i].close;
        emaPrev = price * k + emaPrev * (1 - k);
        res.push({ time: data[i].time, value: emaPrev });
      }
      return res;
    }

    // загрузка свечей
    async function loadCandles() {
      let candles = [];
      try {
        const resp = await fetch("/api/candles");
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.candles) && data.candles.length) {
            candles = data.candles;
          }
        }
      } catch (e) {
        console.warn("candles fetch failed, using mock", e);
      }
      if (!candles.length) {
        candles = buildMockCandles();
      }

      mainSeries.setData(candles);

      const ema20Data = calcEma(candles, 20);
      const ema50Data = calcEma(candles, 50);
      ema20.setData(ema20Data);
      ema50.setData(ema50Data);

      // TRADES → MARKERS (TRIANGLES)
      const trades = buildMockTrades(candles);
      tradeByTime.clear();
      const markers = trades.map((t) => {
        tradeByTime.set(t.time, t);
        const isLong = t.side === "LONG";
        return {
          time: t.time,
          position: isLong ? "belowBar" : "aboveBar",
          color: isLong ? "rgba(46, 189, 133, 1)" : "rgba(255, 107, 107, 1)",
          shape: isLong ? "triangleUp" : "triangleDown",
        };
      });
      if (markers.length) {
        mainSeries.setMarkers(markers);
      }

      chart.timeScale().fitContent();
    }

    // стартовая загрузка
    loadCandles().catch(console.error);

    // WS live feed
    connectWs(candlesUpdater(mainSeries, chart));
  }

  function candlesUpdater(series, chartInstance) {
    return function (candle) {
      if (!series || !candle) return;
      series.update({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });
      if (chartInstance) {
        chartInstance.timeScale().scrollToRealTime();
      }
    };
  }

  function connectWs(onCandle) {
    try {
      if (ws) {
        ws.close();
      }
      ws = new WebSocket("ws://" + window.location.host + "/ws");
      ws.onopen = function () {
        console.log("WS connected");
      };
      ws.onmessage = function (event) {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.type === "candle" && msg.data && onCandle) {
            onCandle(msg.data);
          }
        } catch (e) {
          console.warn("WS message parse error", e);
        }
      };
      ws.onclose = function () {
        console.log("WS closed");
      };
      ws.onerror = function (e) {
        console.warn("WS error", e);
      };
    } catch (e) {
      console.warn("WS connect failed", e);
    }
  }

  // ==============================
  //  PANELS / UI
  // ==============================

  async function loadStatus() {
    const el = $("status-label");
    try {
      const resp = await fetch("/api/status");
      if (!resp.ok) throw new Error("bad status");
      const data = await resp.json();
      if (el && data && data.status) {
        el.textContent = data.status.toUpperCase();
      }
    } catch (e) {
      if (el) el.textContent = "MOCK";
    }
  }

  async function loadEquity() {
    if (!equitySeries) return;
    try {
      const resp = await fetch("/api/equity");
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.series) && data.series.length) {
          const eq = data.series.map((v, idx) => ({
            time: Math.floor(Date.now() / 1000) - (data.series.length - idx) * 60,
            value: v,
          }));
          equitySeries.setData(eq);
          return;
        }
      }
    } catch (e) {
      console.warn("equity fetch failed, keep mock", e);
    }
  }

  async function runBacktest() {
    const btn = $("btn-backtest");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Running…";
    }
    try {
      await fetch("/api/backtest/run", { method: "POST" });
      const resp = await fetch("/api/backtest/summary");
      if (resp.ok) {
        const data = await resp.json();
        const elTrades = $("bt-trades");
        const elRet = $("bt-return");
        if (elTrades && typeof data.trades !== "undefined") {
          elTrades.textContent = String(data.trades);
        }
        if (elRet && typeof data.return_pct !== "undefined") {
          elRet.textContent = data.return_pct.toFixed
            ? data.return_pct.toFixed(2) + "%"
            : data.return_pct + "%";
        }
      }
      await loadEquity();
    } catch (e) {
      console.warn("backtest failed", e);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Run backtest";
      }
    }
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

  function setupTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll("[data-panel]");
    if (!tabs.length || !panels.length) return;

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
        const panel = document.querySelector('[data-panel="' + target + '"]');
        if (panel) panel.classList.add("active");
      });
    });
  }

  async function init() {
    initCharts();
    setupToolbar();
    setupTabs();
    await loadStatus();
    await loadEquity();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
