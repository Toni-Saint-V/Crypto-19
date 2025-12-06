// Dashboard JS logic placeholder
document.addEventListener("DOMContentLoaded", () => {
    console.log("[CBP] Dashboard loaded");

    const symbolEl = document.getElementById("symbol");
    const tfEl = document.getElementById("tf");
    const statusSymbol = document.getElementById("status-symbol");
    const statusTf = document.getElementById("status-tf");
    const statusBt = document.getElementById("status-bt");
    const btnFetch = document.getElementById("btn-fetch");
    const btnBacktest = document.getElementById("btn-backtest");

    function updateStatus() {
        if (statusSymbol && symbolEl) statusSymbol.textContent = symbolEl.value;
        if (statusTf && tfEl) statusTf.textContent = tfEl.value;
    }

    if (symbolEl && tfEl) {
        symbolEl.addEventListener("change", updateStatus);
        tfEl.addEventListener("change", updateStatus);
        updateStatus();
    }

    async function runBacktest() {
        try {
            const payload = {
                symbol: symbolEl ? symbolEl.value : "BTCUSDT",
                tf: tfEl ? tfEl.value : "1m"
            };
            const res = await fetch("/api/backtest/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            console.log("[CBP] backtest run:", data);
            if (statusBt) statusBt.textContent = data.message || "completed";
            // Можно тут же дернуть /api/backtest/summary
        } catch (e) {
            console.error("[CBP] backtest error", e);
            if (statusBt) statusBt.textContent = "Error";
        }
    }

    if (btnBacktest) {
        btnBacktest.addEventListener("click", runBacktest);
    }

    if (btnFetch) {
        btnFetch.addEventListener("click", () => {
            console.log("[CBP] fetch candles clicked");
            // Здесь позже подключим вызов /api/fetch и отрисовку графика
        });
    }
});


// ------------------ CHART INIT ------------------
async function loadCandles() {
    const res = await fetch("/api/candles");
    const data = await res.json();
    if (!data || !data.data) return;

    const chart = LightweightCharts.createChart(
        document.getElementById("chart-root"),
        {
            width: document.getElementById("chart-root").clientWidth,
            height: document.getElementById("chart-root").clientHeight,
            layout: {
                background: { color: '#080811' },
                textColor: '#ffffff'
            },
            grid: {
                vertLines: { color: '#1a1a1a' },
                horzLines: { color: '#1a1a1a' }
            },
            timeScale: { timeVisible: true, secondsVisible: false }
        }
    );

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#34c759',
        downColor: '#ff453a',
        borderVisible: false,
        wickUpColor: '#34c759',
        wickDownColor: '#ff453a'
    });

    const candles = data.data.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
    }));

    candleSeries.setData(candles);
    console.log("[CBP] Candles loaded:", candles.length);
}

// Run after DOM load
document.addEventListener("DOMContentLoaded", loadCandles);
