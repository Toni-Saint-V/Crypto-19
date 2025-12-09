"use strict";

/**
 * Parameters panel module for dashboard configuration
 * Uses JSON-based config for easy extensibility
 */

const DEFAULT_CONFIG = {
    symbol: {
        type: "select",
        label: "Валюта",
        value: "BTCUSDT",
        options: [
            { value: "BTCUSDT", label: "BTC/USDT" },
            { value: "ETHUSDT", label: "ETH/USDT" },
            { value: "BNBUSDT", label: "BNB/USDT" },
            { value: "SOLUSDT", label: "SOL/USDT" },
            { value: "XRPUSDT", label: "XRP/USDT" },
            { value: "ADAUSDT", label: "ADA/USDT" },
            { value: "DOGEUSDT", label: "DOGE/USDT" },
            { value: "TRXUSDT", label: "TRX/USDT" },
            { value: "DOTUSDT", label: "DOT/USDT" },
            { value: "MATICUSDT", label: "MATIC/USDT" }
        ]
    },
    exchange: {
        type: "select",
        label: "Биржа",
        value: "bybit",
        options: [
            { value: "bybit", label: "Bybit" },
            { value: "binance", label: "Binance" }
        ]
    },
    timeframe: {
        type: "timeframe",
        label: "Таймфрейм",
        value: "15m",
        quickOptions: ["1m", "5m", "15m", "1h", "4h", "1d"]
    },
    strategy: {
        type: "select",
        label: "Стратегия",
        value: "momentum_ml_v2",
        options: [
            { value: "momentum_ml_v2", label: "Momentum ML v2" },
            { value: "pattern3_extreme", label: "Pattern3 Extreme" },
            { value: "example_strategy", label: "Example Strategy" }
        ]
    },
    riskDollars: {
        type: "number",
        label: "Риск на сделку ($)",
        value: 100,
        min: 1,
        step: 0.01
    }
};

export class ParamsPanel {
    constructor(containerId, config = DEFAULT_CONFIG) {
        this.container = document.getElementById(containerId);
        this.config = config;
        this.values = {};
        this.callbacks = new Set();
        
        if (!this.container) {
            console.warn(`[CBP Params] Container ${containerId} not found`);
            return;
        }
        
        // Initialize values from config
        Object.keys(this.config).forEach(key => {
            this.values[key] = this.config[key].value;
        });
        
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        let html = '<div class="params-panel-content">';
        
        Object.entries(this.config).forEach(([key, param]) => {
            html += this.renderParam(key, param);
        });
        
        html += '</div>';
        this.container.innerHTML = html;
        
        // Attach event listeners
        this.attachListeners();
    }
    
    renderParam(key, param) {
        let html = `<div class="param-group mb-4">`;
        html += `<label class="block text-sm text-gray-400 mb-2">${param.label}</label>`;
        
        switch (param.type) {
            case "select":
                html += `<select data-param="${key}" class="param-input w-full">`;
                param.options.forEach(opt => {
                    const selected = this.values[key] === opt.value ? 'selected' : '';
                    html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                });
                html += `</select>`;
                break;
                
            case "timeframe":
                html += `<div class="flex flex-col gap-2">`;
                html += `<div class="flex gap-2">`;
                param.quickOptions.forEach(opt => {
                    const active = this.values[key] === opt ? 'bg-blue-600' : 'bg-white/10';
                    html += `<button data-tf="${opt}" class="px-3 py-1 ${active} rounded text-xs hover:bg-white/20 transition">${opt}</button>`;
                });
                html += `</div>`;
                html += `</div>`;
                break;
                
            case "number":
                html += `<input type="number" data-param="${key}" class="param-input w-full" value="${param.value}" min="${param.min || 0}" step="${param.step || 1}">`;
                break;
                
            default:
                html += `<input type="text" data-param="${key}" class="param-input w-full" value="${param.value}">`;
        }
        
        html += `</div>`;
        return html;
    }
    
    attachListeners() {
        if (!this.container) return;
        
        // Select and input changes
        this.container.querySelectorAll('[data-param]').forEach(el => {
            el.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-param');
                const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                this.setValue(key, value);
            });
        });
        
        // Timeframe quick buttons
        this.container.querySelectorAll('[data-tf]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tf = e.target.getAttribute('data-tf');
                this.setValue('timeframe', tf);
                // Update button states
                this.container.querySelectorAll('[data-tf]').forEach(b => {
                    b.classList.remove('bg-blue-600');
                    b.classList.add('bg-white/10');
                });
                e.target.classList.remove('bg-white/10');
                e.target.classList.add('bg-blue-600');
            });
        });
    }
    
    setValue(key, value) {
        if (this.values[key] === value) return;
        
        this.values[key] = value;
        this.notifyChange(key, value);
    }
    
    getValue(key) {
        return this.values[key];
    }
    
    getValues() {
        return { ...this.values };
    }
    
    onChange(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }
    
    notifyChange(key, value) {
        this.callbacks.forEach(cb => {
            try {
                cb(key, value, this.getValues());
            } catch (e) {
                console.error("[CBP Params] Callback error:", e);
            }
        });
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.render();
    }
}

