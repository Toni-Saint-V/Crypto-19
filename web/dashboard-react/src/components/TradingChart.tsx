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

export default function TradingChart({ data, trades, height }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartData = data || [];

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
      if (t === null || t === undefined) return undefined;

      if (t instanceof Date && !Number.isNaN(t.getTime())) {
        return Math.floor(t.getTime() / 1000);
      }

      if (typeof t === 'string') {
        const asNum = Number(t);
        if (Number.isFinite(asNum)) {
          return asNum > 1000000000000 ? Math.floor(asNum / 1000) : Math.floor(asNum);
        }
        const parsed = Date.parse(t);
        if (!Number.isNaN(parsed)) {
          return Math.floor(parsed / 1000);
        }
        return undefined;
      }

      if (typeof t === 'number') {
        if (!Number.isFinite(t)) return undefined;
        return t > 1000000000000 ? Math.floor(t / 1000) : Math.floor(t);
      }

      return undefined;
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
    if (seriesRef.current) {
      seriesRef.current.setData(data ?? []);
    }
  }, [data]);

  return (
    <div className="w-full h-full bg-[#05070A] min-h-0">
      <div ref={chartContainerRef} className="w-full h-full min-h-0" />
    </div>
  );
}
