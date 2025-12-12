import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';

interface TradingChartProps {
  data?: CandlestickData<Time>[];
  height?: number;
}

// Generate mock candlestick data if none provided
function generateMockData(count: number = 200): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  let price = 2500;
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 1 minute intervals

  for (let i = count - 1; i >= 0; i--) {
    const time = (now - i * interval) as Time;
    const change = (Math.random() - 0.5) * 20;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;

    data.push({
      time,
      open,
      high,
      low,
      close,
    });

    price = close;
  }

  return data;
}

export default function TradingChart({ data, height }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartData = data || generateMockData(200);

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#05070A' },
        textColor: 'rgba(255, 255, 255, 0.7)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0, // Normal
      },
      width: chartContainerRef.current.clientWidth,
      height: height || chartContainerRef.current.clientHeight,
    });

    // Add candlestick series (v5+ API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // emerald-500
      downColor: '#ef4444', // red-500
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(chartData);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height || chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [data, height]);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return (
    <div className="w-full h-full bg-[#05070A]">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
