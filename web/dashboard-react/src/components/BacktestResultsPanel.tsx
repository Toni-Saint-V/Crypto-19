import { useEffect, useMemo, useState } from "react";

type AnyObj = Record<string, any>;

function num(v: any, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function pickKpi(data: AnyObj) {
  const src = (data && (data.kpi || data.summary || data)) || {};
  return {
    totalTrades: num(src.totalTrades ?? src.trades ?? src.total_trades, 0),
    profitFactor: num(src.profitFactor ?? src.pf ?? src.profit_factor, 0),
    maxDrawdown: num(src.maxDrawdown ?? src.dd ?? src.max_drawdown, 0),
  };
}

export default function BacktestResultsPanel() {
  const [data, setData] = useState<AnyObj | null>(null);

  useEffect(() => {
    const handler = (e: any) => setData(e?.detail || null);
    window.addEventListener("backtest:updated", handler as any);
    return () => window.removeEventListener("backtest:updated", handler as any);
  }, []);

  const kpi = useMemo(() => pickKpi(data || {}), [data]);

  const pretty = useMemo(() => {
    try {
      return data ? JSON.stringify(data, null, 2) : "";
    } catch {
      return "";
    }
  }, [data]);

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-sm font-semibold">Backtest result</div>

      {!data ? (
        <div className="mt-2 text-xs text-white/60">
          No results yet. Run a backtest to see output here.
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] text-white/60">Total Trades</div>
              <div className="text-sm font-semibold">{kpi.totalTrades}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] text-white/60">Profit Factor</div>
              <div className="text-sm font-semibold">{kpi.profitFactor.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
              <div className="text-[11px] text-white/60">Max Drawdown</div>
              <div className="text-sm font-semibold">{kpi.maxDrawdown.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[11px] text-white/60">Raw payload (first 160 lines)</div>
            <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[11px] leading-4">
{pretty.split("\n").slice(0, 160).join("\n")}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
