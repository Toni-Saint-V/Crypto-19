document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('chart');
  if (!el) return;

  // ждём загрузки LightweightCharts с CDN
  function initChart() {
    if (!window.LightweightCharts) {
      setTimeout(initChart, 200);
      return;
    }

    const chart = LightweightCharts.createChart(el, {
      width: el.clientWidth,
      height: 420,
      layout: {
        background: { type: 'Solid', color: '#0b1321' },
        textColor: '#c3cee5',
      },
      grid: {
        vertLines: { color: '#1b2740' },
        horzLines: { color: '#1b2740' },
      },
      timeScale: { borderColor: '#1b2740' },
      rightPriceScale: { borderColor: '#1b2740' }
    });

    const series = chart.addCandlestickSeries({
      upColor: '#2bb988',
      borderUpColor: '#2bb988',
      wickUpColor: '#2bb988',
      downColor: '#ff6b6b',
      borderDownColor: '#ff6b6b',
      wickDownColor: '#ff6b6b',
    });

    const now = Math.floor(Date.now() / 1000);
    const data = [];
    for (let i = 0; i < 120; i++) {
      const t = now - (120 - i) * 60;
      const base = 50000 + Math.sin(i / 7) * 300 + (Math.random() - 0.5) * 150;
      const open = base + (Math.random() - 0.5) * 80;
      const close = base + (Math.random() - 0.5) * 80;
      const high = Math.max(open, close) + 60;
      const low = Math.min(open, close) - 60;
      data.push({ time: t, open, high, low, close });
    }

    series.setData(data);
    window.addEventListener('resize', () => {
      chart.applyOptions({ width: el.clientWidth });
    });
  }

  initChart();
});
