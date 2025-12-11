// CryptoBot Pro Dashboard Main Entry Point

"use strict";

import { dashboardState, subscribeToState, updateDashboardState } from "./dashboard_state.js";
import { initPriceChart, updatePriceChart, initEquityChart, updateEquityChart } from "./dashboard_charts.js";
import { LiveTicker } from "./dashboard_live_ticker.js";

// API helper
async function fetchDashboardSnapshot(symbol, timeframe) {
  try {
    const params = new URLSearchParams({
      symbol: symbol || "BTCUSDT",
      timeframe: timeframe || "15m"
    });
    const response = await fetch(`/api/dashboard/snapshot?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[Dashboard] Failed to fetch snapshot:", error);
    return null;
  }
}

// UI Update Functions

function updateHeaderInfo() {
  const infoEl = document.getElementById("header-info");
  if (infoEl) {
    const balance = dashboardState.balance !== null ? `$${dashboardState.balance.toFixed(2)}` : "$10,000";
    const risk = dashboardState.riskLevelPct !== null 
      ? (dashboardState.riskLevelPct < 40 ? "Low" : dashboardState.riskLevelPct < 70 ? "Moderate" : "High")
      : "Moderate";
    infoEl.textContent = `Bybit • Futures • Balance: ${balance} • Risk: ${risk}`;
  }
}

function updateKPICards() {
  const totalPnlEl = document.getElementById("kpi-total-pnl");
  const winrateEl = document.getElementById("kpi-winrate");
  const positionsEl = document.getElementById("kpi-positions");
  const riskEl = document.getElementById("kpi-risk");
  
  if (totalPnlEl) {
    const pnl = dashboardState.totalProfit !== null ? dashboardState.totalProfit : 0;
    totalPnlEl.textContent = `$${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`;
    totalPnlEl.className = pnl >= 0 ? "kpi-value text-success" : "kpi-value text-danger";
  }
  
  if (winrateEl) {
    winrateEl.textContent = dashboardState.winratePct !== null
      ? `${dashboardState.winratePct.toFixed(1)}%`
      : "--";
  }
  
  if (positionsEl) {
    positionsEl.textContent = dashboardState.activePositions !== null
      ? String(dashboardState.activePositions)
      : "0";
  }
  
  if (riskEl) {
    const risk = dashboardState.riskLevelPct !== null ? dashboardState.riskLevelPct : 0;
    riskEl.textContent = `${risk.toFixed(0)}%`;
    if (risk > 70) {
      riskEl.className = "kpi-value text-danger";
    } else if (risk > 40) {
      riskEl.className = "kpi-value text-warning";
    } else {
      riskEl.className = "kpi-value text-success";
    }
  }
}

function updateAIPredictor() {
  const forecastEl = document.getElementById("ai-forecast-price");
  const signalFillEl = document.getElementById("ai-signal-fill");
  const signalValueEl = document.getElementById("ai-signal-value");
  const sentimentFillEl = document.getElementById("ai-sentiment-fill");
  
  // Use AI data from state or generate placeholder
  if (forecastEl) {
    const lastPrice = dashboardState.candles && dashboardState.candles.length > 0
      ? dashboardState.candles[dashboardState.candles.length - 1].close
      : 50000;
    const forecast = dashboardState.aiForecast || (lastPrice * 1.02).toFixed(2);
    forecastEl.textContent = `$${forecast}`;
  }
  
  if (signalFillEl && signalValueEl) {
    const strength = dashboardState.aiSignalStrength || 72;
    signalFillEl.style.width = `${strength}%`;
    signalValueEl.textContent = `${strength}%`;
  }
  
  if (sentimentFillEl) {
    // Sentiment bar (asymmetric, shows bullish/bearish)
    // Sentiment: 0-100, where 50 is neutral
    const sentiment = dashboardState.aiSentiment || 60;
    const distanceFromNeutral = Math.abs(sentiment - 50);
    const width = distanceFromNeutral * 2; // 0-100% width based on distance from neutral
    
    // Position bar asymmetrically:
    // - Bullish (sentiment > 50): fill from center (50%) to right, so left = 50%
    // - Bearish (sentiment < 50): fill from left to center, so left = 50 - width
    const left = sentiment >= 50 ? 50 : (50 - width);
    
    sentimentFillEl.style.width = `${width}%`;
    sentimentFillEl.style.left = `${left}%`;
    sentimentFillEl.style.background = sentiment >= 50 ? "var(--success)" : "var(--danger)";
  }
}

function updateTicker() {
  const tickerContent = document.getElementById("ticker-content");
  if (!tickerContent) return;
  
  if (dashboardState.mode === "backtest") {
    // Backtest mode ticker
    const results = dashboardState.backtestResults;
    if (results) {
      const dateFrom = results.date_from || results.start_date || "--";
      const dateTo = results.date_to || results.end_date || "--";
      const tradesCount = results.trades_count || results.trades?.length || 0;
      const pnl = results.final_pnl || results.pnl || 0;
      tickerContent.textContent = 
        `Backtest period: ${dateFrom} → ${dateTo} | Trades: ${tradesCount} | PnL: $${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`;
    } else {
      tickerContent.textContent = "No backtest results";
    }
  } else {
    // Live/Test mode ticker
    if (liveTicker) {
      // Always sync LiveTicker's internal trades array from dashboardState
      // This ensures state is synchronized even when trades array is empty
      liveTicker.setTrades(dashboardState.trades || []);
      liveTicker.render(tickerContent);
    } else {
      const trades = dashboardState.trades || [];
      if (trades.length > 0) {
        const tradeStrings = trades.slice(-5).map(t => {
          const side = (t.side || "BUY").toUpperCase();
          const price = t.price ? `$${t.price.toFixed(2)}` : "--";
          const pnl = t.realized_pnl !== undefined 
            ? ` ${t.realized_pnl >= 0 ? "+" : ""}$${t.realized_pnl.toFixed(2)}`
            : "";
          return `${side} ${price}${pnl}`;
        });
        tickerContent.textContent = tradeStrings.join(" • ");
      } else {
        tickerContent.textContent = "No trades yet";
      }
    }
  }
}

function updateModeUI() {
  // Update mode buttons
  const modeButtons = document.querySelectorAll(".mode-btn");
  modeButtons.forEach(btn => {
    const mode = btn.dataset.mode;
    // For TEST button (data-mode="test"), check if mode is "live" AND liveEnv is "test"
    if (mode === "test") {
      if (dashboardState.mode === "live" && dashboardState.liveEnv === "test") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    } else if (mode === "live") {
      // LIVE button is active when mode is "live" AND liveEnv is "real"
      if (dashboardState.mode === "live" && dashboardState.liveEnv === "real") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    } else {
      // BACKTEST button
      if (mode === dashboardState.mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  });
  
  // Update ticker label
  const tickerLabel = document.querySelector(".ticker-label");
  if (tickerLabel) {
    if (dashboardState.mode === "backtest") {
      tickerLabel.textContent = "Backtest Summary";
    } else if (dashboardState.mode === "live" && dashboardState.liveEnv === "test") {
      tickerLabel.textContent = "Test Events";
    } else {
      tickerLabel.textContent = "Recent trades";
    }
  }
}

function updateWSStatus() {
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  
  if (statusDot) {
    if (dashboardState.wsConnected) {
      statusDot.classList.add("connected");
    } else {
      statusDot.classList.remove("connected");
    }
  }
  
  if (statusText) {
    statusText.textContent = dashboardState.wsConnected ? "Connected" : "Disconnected";
  }
}

function updateChartHeader() {
  const chartPairEl = document.getElementById("chart-pair");
  const strategyLabelEl = document.getElementById("strategy-label");
  
  if (chartPairEl) {
    chartPairEl.textContent = dashboardState.symbol || "ETHUSDT";
  }
  
  if (strategyLabelEl) {
    // Get strategy from bottom bar or default
    const strategySelect = document.getElementById("bottom-strategy");
    const strategy = strategySelect ? strategySelect.value : "trend";
    const strategyNames = {
      trend: "Trend Following",
      mean: "Mean Reversion",
      momentum: "Momentum"
    };
    strategyLabelEl.textContent = `Strategy: ${strategyNames[strategy] || "Trend Following"}`;
  }
}

function updateBottomBar() {
  const balanceEl = document.getElementById("bottom-balance");
  if (balanceEl) {
    const balance = dashboardState.balance !== null 
      ? `$${dashboardState.balance.toFixed(2)}` 
      : "$10,000";
    balanceEl.textContent = `Balance: ${balance}`;
  }
}

// Initialize UI bindings

function initModeSwitches() {
  const modeButtons = document.querySelectorAll(".mode-btn");
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      if (mode === "live" || mode === "test") {
        updateDashboardState({ mode: "live", liveEnv: mode === "test" ? "test" : "real" });
      } else if (mode === "backtest") {
        updateDashboardState({ mode: "backtest" });
      }
    });
  });
}

function initParameterControls() {
  // Bottom bar controls
  const symbolSelect = document.getElementById("bottom-symbol");
  const exchangeSelect = document.getElementById("bottom-exchange");
  const timeframeSegmented = document.querySelector(".timeframe-segmented");
  const strategySelect = document.getElementById("bottom-strategy");
  const riskInput = document.getElementById("bottom-risk");
  
  if (symbolSelect) {
    symbolSelect.value = dashboardState.symbol || "ETHUSDT";
    symbolSelect.addEventListener("change", (e) => {
      updateDashboardState({ symbol: e.target.value });
      loadLiveData();
    });
  }
  
  if (exchangeSelect) {
    exchangeSelect.value = dashboardState.exchange || "bybit";
    exchangeSelect.addEventListener("change", (e) => {
      updateDashboardState({ exchange: e.target.value });
      loadLiveData();
    });
  }
  
  if (timeframeSegmented) {
    const tfButtons = timeframeSegmented.querySelectorAll(".seg-btn");
    // Remove active class from all buttons first, then add to matching one
    const currentTf = dashboardState.timeframe || "15m";
    tfButtons.forEach(btn => {
      btn.classList.remove("active");
      if (btn.dataset.tf === currentTf) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        tfButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tf = btn.dataset.tf;
        updateDashboardState({ timeframe: tf });
        
        // Update chart header timeframe buttons
        const chartTfButtons = document.querySelectorAll(".tf-btn");
        chartTfButtons.forEach(b => {
          if (b.dataset.tf === tf) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
        
        loadLiveData();
      });
    });
  }
  
  // Chart header timeframe buttons
  const chartTfButtons = document.querySelectorAll(".tf-btn");
  // Remove active class from all buttons first, then add to matching one
  const currentTf = dashboardState.timeframe || "15m";
  chartTfButtons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.tf === currentTf) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      chartTfButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tf = btn.dataset.tf;
      updateDashboardState({ timeframe: tf });
      
      // Update bottom bar timeframe buttons
      const bottomTfButtons = document.querySelectorAll(".seg-btn");
      bottomTfButtons.forEach(b => {
        if (b.dataset.tf === tf) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });
      
      loadLiveData();
    });
  });
  
  if (strategySelect) {
    strategySelect.addEventListener("change", () => {
      updateChartHeader();
    });
  }
  
  if (riskInput) {
    riskInput.addEventListener("change", (e) => {
      // Update risk if needed
      console.log("[Dashboard] Risk changed to:", e.target.value);
    });
  }
}

function initAIChat() {
  const input = document.getElementById("ai-chat-input");
  const sendBtn = document.getElementById("ai-chat-send");
  const messages = document.getElementById("ai-chat-messages");
  
  const sendMessage = () => {
    if (!input || !messages) return;
    const text = input.value.trim();
    if (!text) return;
    
    // Add user message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-message";
    userMsg.textContent = `You: ${text}`;
    messages.appendChild(userMsg);
    
    input.value = "";
    
    // Simulate AI response (replace with real API call)
    setTimeout(() => {
      const aiMsg = document.createElement("div");
      aiMsg.className = "chat-message system";
      aiMsg.textContent = "AI: Response will be here (integration in progress)";
      messages.appendChild(aiMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 500);
    
    messages.scrollTop = messages.scrollHeight;
  };
  
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }
  
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
}

// WebSocket connection

let wsConnection = null;

function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
  
  try {
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("[Dashboard] WebSocket connected");
      dashboardState.setWsStatus(true);
    };
    
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "dashboard_update" && msg.payload) {
          dashboardState.setSnapshot(msg.payload);
          
          // Update chart if in live mode
          if (dashboardState.mode === "live" && msg.payload.candles) {
            updatePriceChart(msg.payload.candles);
          }
          
          // Update ticker
          updateTicker();
        }
      } catch (error) {
        console.error("[Dashboard] Failed to parse WebSocket message:", error);
      }
    };
    
    socket.onclose = () => {
      console.log("[Dashboard] WebSocket closed");
      dashboardState.setWsStatus(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(initWebSocket, 3000);
    };
    
    socket.onerror = (error) => {
      console.error("[Dashboard] WebSocket error:", error);
      dashboardState.setWsStatus(false);
    };
    
    wsConnection = socket;
  } catch (error) {
    console.error("[Dashboard] Failed to create WebSocket:", error);
    dashboardState.setWsStatus(false);
  }
}

// Data loading

let liveTicker = null;

async function loadLiveData() {
  try {
    const snapshot = await fetchDashboardSnapshot(
      dashboardState.symbol || "ETHUSDT",
      dashboardState.timeframe || "15m"
    );
    
    if (snapshot) {
      dashboardState.setSnapshot(snapshot);
      
      // Update chart
      if (snapshot.candles && snapshot.candles.length > 0) {
        updatePriceChart(snapshot.candles);
      }
      
      // Update ticker
      updateTicker();
    }
  } catch (error) {
    console.error("[Dashboard] Failed to load live data:", error);
  }
}

// State subscription

function onStateChange(state) {
  updateHeaderInfo();
  updateKPICards();
  updateAIPredictor();
  updateTicker();
  updateModeUI();
  updateWSStatus();
  updateChartHeader();
  updateBottomBar();
}

// Initialize

async function init() {
  console.log("[Dashboard] Initializing...");
  
  // Wait for chart container to be ready
  const chartContainer = document.getElementById("price-chart-container");
  if (!chartContainer) {
    console.error("[Dashboard] Chart container not found, retrying...");
    setTimeout(init, 100);
    return;
  }
  
  // Initialize charts
  initPriceChart();
  
  // Initialize ticker (if LiveTicker class exists)
  try {
    liveTicker = new LiveTicker("ticker-content");
    // Add render method for compatibility
    if (liveTicker && !liveTicker.render) {
      liveTicker.render = (container) => {
        if (liveTicker.container) {
          container.textContent = liveTicker.container.textContent || container.textContent;
        }
      };
    }
  } catch (error) {
    console.warn("[Dashboard] LiveTicker not available, using simple ticker");
    liveTicker = null;
  }
  
  // Initialize UI bindings
  initModeSwitches();
  initParameterControls();
  initAIChat();
  
  // Subscribe to state changes
  subscribeToState(onStateChange);
  
  // Initial UI update
  updateModeUI();
  updateChartHeader();
  
  // Initialize WebSocket connection
  initWebSocket();
  
  // Load initial data
  await loadLiveData();
  
  // Set up periodic refresh (every 30 seconds) as fallback
  setInterval(() => {
    if (dashboardState.mode === "live" && !dashboardState.wsConnected) {
      loadLiveData();
    }
  }, 30000);
  
  console.log("[Dashboard] Initialization complete");
}

// Start when DOM is ready

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
