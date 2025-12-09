"use strict";

/**
 * Robust chart module using Lightweight Charts
 * Handles errors gracefully and ensures chart always displays
 */

import { dashboardState } from "./cbp_state.js";

let chart = null;
let candleSeries = null;
let volumeSeries = null;
let tradeMarkers = [];
let tooltipElement = null;
let lastValidData = [];
let isInitialized = false;

const API_BASE = "/api";

// Logging utilities
function logInfo(msg, ...args) {
    console.log(`[CBP Charts] ${msg}`, ...args);
}

function logError(msg, ...args) {
    console.error(`[CBP Charts] ${msg}`, ...args);
}

function logWarn(msg, ...args) {
    console.warn(`[CBP Charts] ${msg}`, ...args);
}

export function initChart() {
    if (isInitialized) {
        logWarn("Chart already initialized");
        return;
    }
    
    const chartElement = document.getElementById("main-chart");
    if (!chartElement) {
        logError("Chart container #main-chart not found");
        return;
    }
    
    // Check for LightweightCharts
    if (typeof window.LightweightCharts === 'undefined') {
        logError("LightweightCharts library not loaded");
        showErrorOverlay(chartElement, "Библиотека графиков не загружена");
        return;
    }
    
    try {
        chart = window.LightweightCharts.createChart(chartElement, {
            layout: {
                background: { type: 'solid', color: '#050811' },
                textColor: '#d0d4e4',
                fontSize: 12,
            },
            grid: {
                vertLines: { 
                    color: 'rgba(255, 255, 255, 0.05)',
                    style: 1,
                },
                horzLines: { 
                    color: 'rgba(255, 255, 255, 0.05)',
                    style: 1,
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: 1,
            },
        });
        
        candleSeries = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });
        
        volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
        
        // Setup tooltip
        tooltipElement = document.getElementById("trade-tooltip");
        if (tooltipElement) {
            chart.subscribeCrosshairMove((param) => {
                handleCrosshairMove(param);
            });
        }
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (chart && chartElement) {
                try {
                    chart.applyOptions({
                        width: chartElement.clientWidth,
                        height: chartElement.clientHeight
                    });
                } catch (e) {
                    logWarn("Resize error:", e);
                }
            }
        });
        resizeObserver.observe(chartElement);
        
        isInitialized = true;
        logInfo("Chart initialized successfully");
        
        // Load initial data
        loadChartData();
        
    } catch (error) {
        logError("Failed to initialize chart:", error);
        showErrorOverlay(chartElement, "Ошибка инициализации графика");
    }
}

function showErrorOverlay(container, message) {
    if (!container) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'chart-error-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(5, 8, 17, 0.9);
        color: #d0d4e4;
        font-size: 14px;
        z-index: 1000;
    `;
    overlay.textContent = message;
    container.appendChild(overlay);
}

function handleCrosshairMove(param) {
    if (!tooltipElement) return;
    
    if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
        tooltipElement.classList.remove('visible');
        return;
    }
    
    // Find nearest trade marker
    const trade = findNearestTrade(param.time);
    if (trade) {
        showTradeTooltip(trade, param.point.x, param.point.y);
    } else {
        tooltipElement.classList.remove('visible');
    }
}

function findNearestTrade(time) {
    if (!time || tradeMarkers.length === 0) return null;
    
    let nearest = null;
    let minDiff = Infinity;
    
    tradeMarkers.forEach(marker => {
        const diff = Math.abs(marker.time - time);
        if (diff < minDiff && diff < 900) { // Within 15 minutes
            minDiff = diff;
            nearest = marker.trade;
        }
    });
    
    return nearest;
}

function showTradeTooltip(trade, x, y) {
    if (!tooltipElement) return;
    
    const side = (trade.side || trade.type || '').toLowerCase();
    const entryPrice = parseFloat(trade.entry_price || trade.price || 0);
    const exitPrice = trade.exit_price ? parseFloat(trade.exit_price) : null;
    
    let pnl = 0;
    let pnlPercent = 0;
    if (trade.pnl !== undefined) {
        pnl = parseFloat(trade.pnl);
    } else if (trade.result_R !== undefined) {
        pnl = parseFloat(trade.result_R) * (trade.risk_per_trade || 100);
    } else if (exitPrice && entryPrice) {
        const multiplier = side === 'buy' || side === 'long' ? 1 : -1;
        pnl = (exitPrice - entryPrice) * multiplier * (trade.size || 1);
        pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * multiplier;
    }
    
    const resultR = trade.result_R !== undefined ? parseFloat(trade.result_R).toFixed(2) : 'N/A';
    
    tooltipElement.innerHTML = `
        <div class="font-semibold mb-2">
            <span class="${side === 'buy' || side === 'long' ? 'text-green-400' : 'text-red-400'}">
                ${side === 'buy' || side === 'long' ? '🔼 ПОКУПКА' : '🔽 ПРОДАЖА'}
            </span>
        </div>
        <div class="text-xs space-y-1">
            <div><span class="text-gray-400">Вход:</span> <span class="font-semibold">$${entryPrice.toFixed(2)}</span></div>
            ${exitPrice ? `<div><span class="text-gray-400">Выход:</span> <span class="font-semibold">$${exitPrice.toFixed(2)}</span></div>` : ''}
            <div>
                <span class="text-gray-400">P/L:</span> 
                <span class="font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} ${pnlPercent !== 0 ? `(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)` : ''}
                </span>
            </div>
            <div><span class="text-gray-400">R:</span> <span class="font-semibold ${resultR >= 0 ? 'text-green-400' : 'text-red-400'}">${resultR}</span></div>
            ${trade.size ? `<div><span class="text-gray-400">Размер:</span> <span class="font-semibold">${trade.size}</span></div>` : ''}
            ${trade.entry_time ? `<div><span class="text-gray-400">Время входа:</span> <span class="font-semibold">${new Date(trade.entry_time * 1000).toLocaleString('ru-RU')}</span></div>` : ''}
        </div>
    `;
    
    // Position tooltip
    const rect = tooltipElement.getBoundingClientRect();
    const chartRect = document.getElementById("main-chart").getBoundingClientRect();
    
    let tooltipX = x + chartRect.left;
    let tooltipY = y + chartRect.top - rect.height - 10;
    
    if (tooltipX + rect.width > window.innerWidth) {
        tooltipX = window.innerWidth - rect.width - 10;
    }
    if (tooltipY < 0) {
        tooltipY = y + chartRect.top + 20;
    }
    
    tooltipElement.style.left = `${tooltipX}px`;
    tooltipElement.style.top = `${tooltipY}px`;
    tooltipElement.classList.add('visible');
}

async function loadChartData(symbol = "BTCUSDT", timeframe = "15m", exchange = "bybit") {
    if (!isInitialized || !candleSeries) {
        logWarn("Chart not initialized, skipping data load");
        return;
    }
    
    try {
        const params = new URLSearchParams({
            symbol: symbol,
            timeframe: timeframe,
            exchange: exchange,
            limit: "500"
        });
        
        const response = await fetch(`${API_BASE}/candles?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const candles = data.candles || [];
        
        if (candles.length === 0) {
            logWarn("No candles received, using last valid data or showing empty state");
            if (lastValidData.length > 0) {
                applyCandlesToChart(lastValidData);
            } else {
                showNoDataState();
            }
            return;
        }
        
        // Validate and convert candles
        const validCandles = validateAndConvertCandles(candles);
        if (validCandles.length === 0) {
            logWarn("No valid candles after validation");
            if (lastValidData.length > 0) {
                applyCandlesToChart(lastValidData);
            } else {
                showNoDataState();
            }
            return;
        }
        
        // Store as last valid data
        lastValidData = validCandles;
        
        // Apply to chart
        applyCandlesToChart(validCandles);
        
        logInfo(`Loaded ${validCandles.length} candles for ${symbol} ${timeframe}`);
        
    } catch (error) {
        logError("Failed to load chart data:", error);
        // Use last valid data if available
        if (lastValidData.length > 0) {
            logInfo("Using last valid data");
            applyCandlesToChart(lastValidData);
        } else {
            showNoDataState();
        }
    }
}

function validateAndConvertCandles(candles) {
    const valid = [];
    
    for (const c of candles) {
        try {
            const time = normalizeTime(c.time);
            const open = parseFloat(c.open);
            const high = parseFloat(c.high);
            const low = parseFloat(c.low);
            const close = parseFloat(c.close);
            const volume = parseFloat(c.volume || 0);
            
            // Validate all values are finite numbers
            if (![time, open, high, low, close, volume].every(v => 
                typeof v === 'number' && isFinite(v)
            )) {
                continue;
            }
            
            // Validate OHLC logic
            if (high < low || high < open || high < close || low > open || low > close) {
                logWarn("Invalid OHLC values, skipping candle");
                continue;
            }
            
            valid.push({
                time: time,
                open: open,
                high: high,
                low: low,
                close: close,
            });
            
        } catch (e) {
            logWarn("Error validating candle:", e);
            continue;
        }
    }
    
    return valid;
}

function normalizeTime(time) {
    if (!time) {
        return Math.floor(Date.now() / 1000);
    }
    
    if (typeof time === 'string') {
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
            return Math.floor(date.getTime() / 1000);
        }
        const num = parseFloat(time);
        if (!isNaN(num)) {
            return normalizeTime(num);
        }
    }
    
    if (typeof time === 'number') {
        if (time > 1e12) {
            return Math.floor(time / 1000);
        }
        return time;
    }
    
    return Math.floor(Date.now() / 1000);
}

function applyCandlesToChart(candles) {
    if (!candleSeries || !volumeSeries || candles.length === 0) {
        return;
    }
    
    try {
        const volumeData = candles.map(c => ({
            time: c.time,
            value: c.volume || 0,
            color: c.close >= c.open ? '#22c55e80' : '#ef444480',
        }));
        
        candleSeries.setData(candles);
        volumeSeries.setData(volumeData);
        
        if (chart) {
            chart.timeScale().fitContent();
        }
        
    } catch (error) {
        logError("Error applying candles to chart:", error);
    }
}

function showNoDataState() {
    logInfo("Showing no data state");
    // Chart will remain empty but won't crash
}

export function updateChart(params) {
    if (!isInitialized) {
        initChart();
        return;
    }
    
    const symbol = params?.symbol || dashboardState.symbol || "BTCUSDT";
    const timeframe = params?.timeframe || dashboardState.timeframe || "15m";
    const exchange = params?.exchange || dashboardState.exchange || "bybit";
    
    loadChartData(symbol, timeframe, exchange);
    
    // Update trade markers if provided
    if (params?.trades && Array.isArray(params.trades)) {
        updateTradeMarkers(params.trades);
    }
}

function updateTradeMarkers(trades) {
    if (!candleSeries) return;
    
    tradeMarkers = [];
    
    trades.forEach(trade => {
        try {
            const entryTime = normalizeTime(trade.entry_time || trade.time || trade.entry_timestamp);
            const exitTime = trade.exit_time ? normalizeTime(trade.exit_time) : null;
            const entryPrice = parseFloat(trade.entry_price || trade.price || trade.entry || 0);
            const side = (trade.side || trade.direction || trade.type || '').toLowerCase();
            
            // Entry marker
            const entryMarker = {
                time: entryTime,
                position: side === 'buy' || side === 'long' ? 'belowBar' : 'aboveBar',
                color: side === 'buy' || side === 'long' ? '#22c55e' : '#ef4444',
                shape: side === 'buy' || side === 'long' ? 'arrowUp' : 'arrowDown',
                text: side === 'buy' || side === 'long' ? 'BUY' : 'SELL',
                size: 2,
            };
            
            tradeMarkers.push({ ...entryMarker, trade, type: 'entry' });
            
            // Exit marker if available
            if (exitTime) {
                const exitMarker = {
                    time: exitTime,
                    position: side === 'buy' || side === 'long' ? 'aboveBar' : 'belowBar',
                    color: side === 'buy' || side === 'long' ? '#10b981' : '#f59e0b',
                    shape: side === 'buy' || side === 'long' ? 'arrowDown' : 'arrowUp',
                    text: 'EXIT',
                    size: 2,
                };
                tradeMarkers.push({ ...exitMarker, trade, type: 'exit' });
            }
        } catch (e) {
            logWarn("Error creating trade marker:", e);
        }
    });
    
    // Update chart markers
    try {
        const markers = tradeMarkers.map(m => ({
            time: m.time,
            position: m.position,
            color: m.color,
            shape: m.shape,
            text: m.text,
            size: m.size,
        }));
        candleSeries.setMarkers(markers);
    } catch (e) {
        logError("Error setting markers:", e);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart);
} else {
    // DOM already loaded
    setTimeout(initChart, 100);
}
