"use strict";

import { fetchDashboardSnapshot } from "./cbp_api.js";
import { dashboardState } from "./cbp_state.js";
import { initDashboardRealtime } from "./cbp_realtime.js";
import { initPriceChart } from "./cbp_plotly_chart.js";

function bindStaticUI() {
  const els = {
    balance: document.querySelector("[data-cbp='balance']"),
    dailyPnl: document.querySelector("[data-cbp='daily-pnl']"),
    totalProfit: document.querySelector("[data-cbp='total-profit']"),
    winrate: document.querySelector("[data-cbp='winrate']"),
    activePositions: document.querySelector("[data-cbp='active-positions']"),
    riskLevel: document.querySelector("[data-cbp='risk-level']"),
    aiSignalsContainer: document.querySelector("[data-cbp='ai-signals']"),
  };

  function renderSnapshot() {
    const s = dashboardState;
    if (els.balance && s.balance != null) {
      els.balance.textContent = `$${s.balance.toFixed(2)}`;
    }
    if (els.dailyPnl && s.dailyPnlPct != null) {
      const sign = s.dailyPnlPct >= 0 ? "+" : "";
      els.dailyPnl.textContent = `${sign}${s.dailyPnlPct.toFixed(2)}%`;
      // Update color class
      if (s.dailyPnlPct >= 0) {
        els.dailyPnl.classList.remove("text-red-400");
        els.dailyPnl.classList.add("text-green-400");
      } else {
        els.dailyPnl.classList.remove("text-green-400");
        els.dailyPnl.classList.add("text-red-400");
      }
    }
    if (els.totalProfit && s.totalProfit != null) {
      els.totalProfit.textContent = `$${s.totalProfit.toFixed(2)}`;
    }
    if (els.winrate && s.winratePct != null) {
      els.winrate.textContent = `${s.winratePct.toFixed(1)}%`;
    }
    if (els.activePositions) {
      els.activePositions.textContent = String(s.activePositions ?? 0);
    }
    if (els.riskLevel && s.riskLevelPct != null) {
      els.riskLevel.textContent = `${s.riskLevelPct.toFixed(0)}%`;
      // Update color class based on risk level
      els.riskLevel.classList.remove("text-red-400", "text-yellow-400", "text-green-400");
      if (s.riskLevelPct > 70) {
        els.riskLevel.classList.add("text-red-400");
      } else if (s.riskLevelPct > 40) {
        els.riskLevel.classList.add("text-yellow-400");
      } else {
        els.riskLevel.classList.add("text-green-400");
      }
    }

    if (els.aiSignalsContainer) {
      els.aiSignalsContainer.innerHTML = "";
      (s.aiSignals || []).forEach(sig => {
        const item = document.createElement("div");
        item.className = "p-4 bg-white/5 rounded-lg ai-signal-item";

        const sideLabel = sig.side?.toUpperCase() === "BUY" ? "КУПИТЬ" : "ПРОДАТЬ";
        const conf = typeof sig.confidence === "number"
          ? `${sig.confidence.toFixed(1)}%`
          : "";

        item.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold">${sig.symbol}</span>
            <span class="text-sm font-bold ${sideLabel === "КУПИТЬ" ? "text-green-400" : "text-red-400"}">${sideLabel}</span>
          </div>
          <div class="text-sm text-gray-400">
            <div class="flex justify-between">
              <span>Уверенность:</span>
              <span>${conf}</span>
            </div>
            <div class="flex justify-between">
              <span>Вход:</span>
              <span>$${sig.entry}</span>
            </div>
            <div class="flex justify-between">
              <span>Цель:</span>
              <span>$${sig.target}</span>
            </div>
            ${sig.stop ? `<div class="flex justify-between"><span>Stop:</span><span>$${sig.stop}</span></div>` : ""}
          </div>
          <button class="mt-3 w-full py-1 bg-purple-600/50 rounded text-xs hover:bg-purple-600/70 transition">
            Исполнить сделку
          </button>
        `;

        els.aiSignalsContainer.appendChild(item);
      });
    }
  }

  renderSnapshot();
  window.addEventListener("cbp:dashboard_update", renderSnapshot);

  // Self-check
  Object.entries(els).forEach(([key, el]) => {
    if (!el && key !== "aiSignalsContainer") {
      console.warn(`[CBP SelfCheck] Missing element for`, key);
    }
  });
}

async function bootstrap() {
  const symbol = "BTCUSDT"; // TODO: связать с UI
  const timeframe = "15m";

  try {
    const snapshot = await fetchDashboardSnapshot({ symbol, timeframe });
    dashboardState.setSnapshot(snapshot);
    console.log("[CBP] Initial snapshot loaded");
  } catch (e) {
    console.error("[CBP] Failed to load snapshot", e);
  }

  bindStaticUI();
  initPriceChart();

  // Determine WebSocket URL
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
  
  initDashboardRealtime({
    wsUrl: wsUrl,
  });

  console.log("[CBP] Dashboard initialized");
}

document.addEventListener("DOMContentLoaded", bootstrap);
