import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';

interface TradingChartProps {
  trades?: any[];

  data?: CandlestickData<Time>[];
  height?: number;
}

// Design token colors as hex values (lightweight-charts doesn't support CSS variables)
const COLOR_GOOD = '#3EF08A';
const COLOR_BAD = '#FF5C7A';
const COLOR_NEUTRAL = '#9AA8C7'; // Muted color for break-even/unknown

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

export default function TradingChart({ data, trades, height }: TradingChartProps) {
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

    // Add candlestick series (v5+ API) - using hex colors (lightweight-charts doesn't support CSS variables)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLOR_GOOD,
      downColor: COLOR_BAD,
      borderUpColor: COLOR_GOOD,
      borderDownColor: COLOR_BAD,
      wickUpColor: COLOR_GOOD,
      wickDownColor: COLOR_BAD,
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

  // Trade markers effect (separate hook - moved outside to fix Rules of Hooks violation)
  useEffect(() => {
    const s: any = seriesRef.current;
    if (!s || typeof s.setMarkers !== 'function') return;

    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      s.setMarkers([]);
      return;
    }

    const normTime = (t: any) => {
      const n = Number(t);
      if (!Number.isFinite(n)) return undefined;
      return n > 1000000000000 ? Math.floor(n / 1000) : n;
    };

    const markers: any[] = [];
    for (const tr of trades) {
      const side = String(tr?.side || 'long').toLowerCase();
      const entryTime = normTime(tr?.entryTime ?? tr?.entry_ts ?? tr?.entry_time);
      const exitTime = normTime(tr?.exitTime ?? tr?.exit_ts ?? tr?.exit_time);

      if (entryTime !== undefined) {
        const entryPriceRaw = tr?.entryPrice ?? tr?.entry_price ?? tr?.price;
        // Convert to number before calling toFixed (handles string values)
        const entryPrice = typeof entryPriceRaw === 'number' ? entryPriceRaw : Number(entryPriceRaw);
        markers.push({
          time: entryTime,
          position: side === 'short' ? 'aboveBar' : 'belowBar',
          color: side === 'short' ? COLOR_BAD : COLOR_GOOD, // Use hex color, not CSS variable
          shape: side === 'short' ? 'arrowDown' : 'arrowUp',
          text: (entryPriceRaw !== undefined && entryPriceRaw !== null && Number.isFinite(entryPrice)) 
            ? `IN ${entryPrice.toFixed(2)}` 
            : 'IN',
          size: 1,
        });
      }
      if (exitTime !== undefined) {
        const exitPriceRaw = tr?.exitPrice ?? tr?.exit_price ?? tr?.close_price;
        // Convert to number before calling toFixed (handles string values)
        const exitPrice = typeof exitPriceRaw === 'number' ? exitPriceRaw : Number(exitPriceRaw);
        const pnlRaw = tr?.pnl ?? tr?.profit ?? tr?.result_R;
        const pnl = typeof pnlRaw === 'number' ? pnlRaw : Number(pnlRaw);
        
        // Determine exit marker color: good for profit, bad for loss, neutral for break-even or missing
        let exitColor: string;
        if (side === 'short') {
          // For shorts: profit when price goes down (pnl > 0)
          exitColor = (Number.isFinite(pnl) && pnl > 0) ? COLOR_GOOD : 
                      (Number.isFinite(pnl) && pnl < 0) ? COLOR_BAD : 
                      COLOR_NEUTRAL; // Neutral for break-even (pnl === 0) or missing data
        } else {
          // For longs: profit when price goes up (pnl > 0)
          exitColor = (Number.isFinite(pnl) && pnl > 0) ? COLOR_GOOD : 
                      (Number.isFinite(pnl) && pnl < 0) ? COLOR_BAD : 
                      COLOR_NEUTRAL; // Neutral for break-even (pnl === 0) or missing data
        }
        
        markers.push({
          time: exitTime,
          position: side === 'short' ? 'belowBar' : 'aboveBar',
          color: exitColor,
          shape: side === 'short' ? 'arrowUp' : 'arrowDown',
          text: (exitPriceRaw !== undefined && exitPriceRaw !== null && Number.isFinite(exitPrice)) 
            ? `OUT ${exitPrice.toFixed(2)}` 
            : 'OUT',
          size: 1,
        });
      }
    }

    s.setMarkers(markers);
  }, [trades]);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return (
    <div className="w-full h-full bg-[#05070A] min-h-0">
      <div ref={chartContainerRef} className="w-full h-full min-h-0" />
    </div>
  );
}
