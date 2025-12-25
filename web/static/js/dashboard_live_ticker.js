// CryptoBot Pro Dashboard Live Ticker Module

"use strict";

export class LiveTicker {
  constructor(containerId = "live-ticker-content") {
    this.container = document.getElementById(containerId);
    this.trades = [];
    this.isPaused = false;
    this.animationId = null;
    this.scrollPosition = 0;
    
    if (!this.container) {
      console.warn("[Live Ticker] Container not found:", containerId);
      return;
    }
    
    this.init();
  }
  
  init() {
    // Set up hover pause/resume
    const tickerPanel = this.container.closest(".ticker-bar");
    if (tickerPanel) {
      tickerPanel.addEventListener("mouseenter", () => {
        this.isPaused = true;
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
      });
      
      tickerPanel.addEventListener("mouseleave", () => {
        this.isPaused = false;
        this.startAnimation();
      });
    }
    
    this.updateDisplay();
  }
  
  setTrades(trades) {
    if (!Array.isArray(trades)) {
      console.warn("[Live Ticker] Invalid trades array");
      return;
    }
    
    // Keep only last 50 trades
    this.trades = trades.slice(-50);
    this.updateDisplay();
  }
  
  addTrade(trade) {
    if (!trade) return;
    
    this.trades.push(trade);
    // Keep only last 50 trades
    if (this.trades.length > 50) {
      this.trades.shift();
    }
    this.updateDisplay();
  }
  
  formatTrade(trade) {
    const time = trade.entry_time || trade.time || trade.timestamp || Date.now();
    let timeStr = "";
    
    if (typeof time === "number") {
      // Assume seconds if < 1e12, milliseconds otherwise
      const timestamp = time < 1e12 ? time * 1000 : time;
      const date = new Date(timestamp);
      timeStr = date.toLocaleTimeString("ru-RU", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else if (typeof time === "string") {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        timeStr = date.toLocaleTimeString("ru-RU", { 
          hour: "2-digit", 
          minute: "2-digit" 
        });
      } else {
        timeStr = String(time);
      }
    } else {
      timeStr = "--:--";
    }
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement("div");
      div.textContent = String(text);
      return div.innerHTML;
    };
    
    const symbol = escapeHtml(trade.symbol || "N/A");
    const sideRaw = trade.side || trade.direction || "N/A";
    // Case-insensitive side detection
    const sideLower = String(sideRaw).toLowerCase();
    const isLong = sideLower === "buy" || sideLower === "long";
    const sideLabel = isLong ? "LONG" : "SHORT";
    const sideColor = isLong ? "#2ECC71" : "#E74C3C";
    
    const size = escapeHtml(trade.size || trade.quantity || trade.qty || "N/A");
    const price = trade.entry_price || trade.price || 0;
    const priceStr = typeof price === "number" ? price.toFixed(2) : escapeHtml(String(price));
    
    let pnlStr = "";
    if (trade.pnl !== undefined && trade.pnl !== null) {
      const pnl = parseFloat(trade.pnl);
      const pnlColor = pnl >= 0 ? "#2ECC71" : "#E74C3C";
      const pnlSign = pnl >= 0 ? "+" : "";
      pnlStr = ` <span style="color: ${pnlColor}">${pnlSign}$${pnl.toFixed(2)}</span>`;
    }
    
    return `<span style="color: #8B949E">${escapeHtml(timeStr)}</span> <span style="font-weight: 600">${symbol}</span> <span style="color: ${sideColor}">${sideLabel}</span> ${size} @ ${priceStr}${pnlStr}`;
  }
  
  updateDisplay() {
    if (!this.container) return;
    
    if (this.trades.length === 0) {
      this.container.textContent = "No trades yet";
      this.container.style.transform = "translateX(0)";
      // Stop animation when no trades
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      return;
    }
    
    // Format trades as simple text for new layout
    const items = this.trades
      .slice(-10)
      .map(t => {
        const side = (t.side || "BUY").toUpperCase();
        const price = t.price || t.entry_price || 0;
        const pnl = t.realized_pnl !== undefined ? t.realized_pnl : 0;
        return `${side} $${typeof price === "number" ? price.toFixed(2) : price} ${pnl >= 0 ? "+" : ""}$${typeof pnl === "number" ? pnl.toFixed(2) : pnl}`;
      })
      .join(" • ");
    
    this.container.textContent = items;
    
    // Restart animation if not paused and content overflows
    if (!this.isPaused) {
      this.startAnimation();
    }
  }
  
  // Render method for compatibility - formats and displays trades like updateDisplay
  render(container) {
    if (!container) return;
    
    // Use the same logic as updateDisplay to format trades
    if (this.trades.length === 0) {
      container.textContent = "No trades yet";
      return;
    }
    
    // Format trades as simple text for new layout
    const items = this.trades
      .slice(-10)
      .map(t => {
        const side = (t.side || "BUY").toUpperCase();
        const price = t.price || t.entry_price || 0;
        const pnl = t.realized_pnl !== undefined ? t.realized_pnl : 0;
        return `${side} $${typeof price === "number" ? price.toFixed(2) : price} ${pnl >= 0 ? "+" : ""}$${typeof pnl === "number" ? pnl.toFixed(2) : pnl}`;
      })
      .join(" • ");
    
    container.textContent = items;
  }
  
  startAnimation() {
    // Cancel any existing animation to prevent multiple loops
    // Store current ID before canceling to handle race conditions
    const currentAnimationId = this.animationId;
    if (currentAnimationId) {
      cancelAnimationFrame(currentAnimationId);
      this.animationId = null;
    }
    
    if (!this.container) return;
    
    const animate = () => {
      // Early return checks - don't schedule new frame
      if (this.isPaused || !this.container) {
        // Only clear ID when we're stopping animation
        this.animationId = null;
        return;
      }
      
      const containerWidth = this.container.parentElement?.offsetWidth || 0;
      const contentWidth = this.container.scrollWidth;
      
      if (contentWidth <= containerWidth) {
        // Content fits, no need to scroll
        this.container.style.transform = "translateX(0)";
        // Only clear ID when we're stopping animation
        this.animationId = null;
        return;
      }
      
      this.scrollPosition -= 0.5; // Scroll speed
      
      // Reset when scrolled past content
      if (Math.abs(this.scrollPosition) >= contentWidth + containerWidth) {
        this.scrollPosition = containerWidth;
      }
      
      this.container.style.transform = `translateX(${this.scrollPosition}px)`;
      this.container.style.transition = "none";
      
      // Schedule next frame and store ID
      // This ID must remain set until the next frame executes or is canceled
      this.animationId = requestAnimationFrame(animate);
    };
    
    // Initial position
    this.scrollPosition = this.container.parentElement?.offsetWidth || 0;
    this.animationId = requestAnimationFrame(animate);
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isPaused = true; // Prevent any pending animation frames from continuing
    this.trades = [];
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

