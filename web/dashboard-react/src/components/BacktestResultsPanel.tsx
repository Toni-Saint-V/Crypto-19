import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type RunStatus = "idle" | "running" | "done" | "error";

function toNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = Number(v);
    if (Number.isFinite(x)) return x;
  }
  return fallback;
}

export default function BacktestResultsPanel() {
  const [data, setData] = useState<AnyObj | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState<number>(220);
  const [activeTab, setActiveTab] = useState<"results" | "trades" | "logs" | "monte-carlo" | "raw">("results");
  const [isResizing, setIsResizing] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runError, setRunError] = useState<string>("");

  const startYRef = useRef(0);
  const startHeightRef = useRef(220);

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

  const totalTrades = kpi.totalTrades ?? 0;
  const hasData = !!data && totalTrades > 0;

  const handleResizeMove = useCallback((ev: MouseEvent) => {
    const dy = startYRef.current - ev.clientY;
    const next = Math.min(380, Math.max(96, startHeightRef.current + dy));
    setDrawerHeight(next);
  }, []);

  const handleResizeUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeUp);

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeUp);
    };
  }, [isResizing, handleResizeMove, handleResizeUp]);

  const onResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    startYRef.current = e.clientY;
    startHeightRef.current = drawerHeight;
    setIsResizing(true);
  };

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleRunBacktest = async () => {
    if (runStatus === "running") return;

    setRunStatus("running");
    setRunError("");

    try {
      const payload: Record<string, unknown> = {
        strategy: "pattern3_extreme",
        symbol: "BTCUSDT",
        interval: "60",
        initial_balance: 10000,
      };

      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`.trim());
      }

      const result = (await res.json().catch(() => ({}))) as AnyObj;
      
      // Extract KPI from result
      const stat = result.statistics || result.summary || result;
      const kpi = {
        totalTrades: toNumber(stat.total_trades ?? stat.totalTrades, 0),
        profitFactor: toNumber(stat.profit_factor ?? stat.profitFactor, 0),
        maxDrawdown: toNumber(stat.max_drawdown ?? stat.maxDrawdown, 0),
      };

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("backtest:updated", { detail: { ...kpi, ...result } }));
      
      // Update local state
      setData({ ...kpi, ...result });
      setRunStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRunError(msg);
      setRunStatus("error");
    }
  };

  return (
    <div
      className="bt-drawer-wrapper border-t border-white/10 bg-black/40 backdrop-blur-sm"
      data-page="backtest"
      style={{
        height: isExpanded ? Math.min(drawerHeight, Math.floor(window.innerHeight * 0.45)) : 70,
        transition: isResizing ? "none" : "height 160ms ease-out",
        minHeight: 56,
        maxHeight: isExpanded ? `${Math.floor(window.innerHeight * 0.45)}px` : 'none',
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="bt-drawer-header w-full flex items-center justify-between gap-3 px-4 py-2 text-left"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Backtest
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/70 overflow-hidden">
            {hasData ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 border border-white/10">
                  <span className="text-white/50">Trades</span>
                  <span className="font-semibold text-white">{kpi.totalTrades}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 border border-white/10">
                  <span className="text-white/50">PF</span>
                  <span className="font-semibold text-emerald-300">
                    {kpi.profitFactor.toFixed(2)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 border border-white/10">
                  <span className="text-white/50">Max DD</span>
                  <span className="font-semibold text-rose-300">
                    {kpi.maxDrawdown.toFixed(2)}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-white/60 truncate">
                No backtest results yet. Run a backtest to see metrics and details.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRunBacktest();
            }}
            disabled={runStatus === "running"}
            className={`inline-flex h-7 items-center rounded-full px-4 text-[11px] font-semibold border transition-all ${
              runStatus === "running"
                ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40 cursor-wait opacity-75"
                : runStatus === "done"
                ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-400/30"
                : runStatus === "error"
                ? "bg-rose-400/20 text-rose-300 border-rose-400/40 hover:bg-rose-400/30"
                : "bg-emerald-400 text-black border-emerald-400 hover:bg-emerald-300"
            }`}
          >
            {runStatus === "running" ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Running...
              </>
            ) : runStatus === "done" ? (
              "✓ Done"
            ) : runStatus === "error" ? (
              "✗ Error"
            ) : (
              "▶ Run Backtest"
            )}
          </button>
          <span className="hidden md:inline text-[11px] text-white/50">
            Backtest sheet
          </span>
          <span className="inline-flex h-7 items-center rounded-full bg-emerald-400/10 px-3 text-[11px] font-semibold text-emerald-300 border border-emerald-400/40">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="flex flex-col h-[calc(100%-40px)] min-h-0">
          <div
            className="bt-drawer-handle flex items-center justify-center cursor-row-resize select-none"
            onMouseDown={onResizeStart}
          >
            <div className="h-1.5 w-16 rounded-full bg-white/20" />
          </div>

          <div className="bt-drawer-body flex-1 min-h-0 flex flex-col px-4 pb-3 pt-1">
            <div className="mb-2 flex items-center gap-2 text-[11px] flex-wrap">
              {["results", "trades", "logs", "monte-carlo", "raw"].map((key) => {
                const id = key as typeof activeTab;
                const isActive = activeTab === id;
                const label =
                  id === "results"
                    ? "Results"
                    : id === "trades"
                    ? "Trades"
                    : id === "logs"
                    ? "Logs"
                    : id === "monte-carlo"
                    ? "Monte Carlo"
                    : "Raw";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`rounded-full px-3 py-1 border text-[11px] transition-colors ${
                      isActive
                        ? "border-[#21D4B4] bg-[#21D4B4]/15 text-[#21D4B4] shadow-[0_0_8px_rgba(33,212,180,0.3)]"
                        : "border-white/10 bg-black/30 backdrop-blur-sm text-white/60 hover:border-white/30"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar text-xs space-y-3">
              {runStatus === "error" && runError && (
                <div className="rounded-lg border border-rose-400/40 bg-rose-400/10 p-3 text-[11px] text-rose-300">
                  <div className="font-semibold mb-1">Backtest Error</div>
                  <div className="text-rose-200/80">{runError}</div>
                </div>
              )}
              {activeTab === "results" && (
                <div className="space-y-2">
                  {!hasData ? (
                    <div className="bt-empty">
                      <div className="bt-empty-title">No backtest results yet</div>
                      <div className="bt-empty-sub">
                        Click "Run Backtest" above to start a backtest and see metrics and details here.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                          <div className="text-[11px] text-white/60">Total Trades</div>
                          <div className="text-sm font-semibold">{kpi.totalTrades}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                          <div className="text-[11px] text-white/60">Profit Factor</div>
                          <div className="text-sm font-semibold">
                            {kpi.profitFactor.toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                          <div className="text-[11px] text-white/60">Max Drawdown</div>
                          <div className="text-sm font-semibold">
                            {kpi.maxDrawdown.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-white/60">
                        Additional statistics are available in the raw payload tab.
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "trades" && (
                <div className="space-y-2">
                  {!data?.trades || !Array.isArray(data.trades) || data.trades.length === 0 ? (
                    <div className="bt-empty">
                      <div className="bt-empty-title">No trades captured</div>
                      <div className="bt-empty-sub">
                        When the backtest returns a `trades` array it will be summarized here.
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-black/40 text-white/60">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium">Time</th>
                          <th className="px-2 py-1 text-left font-medium">Side</th>
                          <th className="px-2 py-1 text-right font-medium">Size</th>
                          <th className="px-2 py-1 text-right font-medium">Price</th>
                          <th className="px-2 py-1 text-right font-medium">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.trades.slice(0, 120).map((t: AnyObj, idx: number) => (
                          <tr
                            key={idx}
                            className="border-t border-white/5 odd:bg-white/[0.01]"
                          >
                            <td className="px-2 py-1">
                              {t.time || t.timestamp || t.entry_time || "-"}
                            </td>
                            <td className="px-2 py-1">
                              {(t.side || t.direction || "").toString().toUpperCase() || "-"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {t.size ?? t.qty ?? t.quantity ?? "-"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {t.price ?? t.entry_price ?? "-"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {t.pnl ?? t.profit ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-2">
                  {!data?.logs || !Array.isArray(data.logs) || data.logs.length === 0 ? (
                    <div className="bt-empty">
                      <div className="bt-empty-title">No logs available</div>
                      <div className="bt-empty-sub">
                        If the backtest returns a `logs` array, it will appear here for quick
                        inspection.
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {data.logs.slice(0, 200).map((line: any, idx: number) => (
                        <li
                          key={idx}
                          className="rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-white/80"
                        >
                          {typeof line === "string" ? line : JSON.stringify(line)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === "monte-carlo" && (
                <div className="space-y-3">
                  {!hasData ? (
                    <div className="bt-empty">
                      <div className="bt-empty-title">No backtest data available</div>
                      <div className="bt-empty-sub">
                        Запусти backtest чтобы построить Monte Carlo анализ.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Controls */}
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
                        <div className="text-[11px] font-semibold text-white/90 mb-2">Monte Carlo Parameters</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-white/60 mb-1 block">Iterations</label>
                            <select className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#21D4B4]">
                              <option>500</option>
                              <option>1000</option>
                              <option>5000</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-white/60 mb-1 block">Method</label>
                            <select className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#21D4B4]">
                              <option>Bootstrap Returns</option>
                              <option>Trade Shuffle</option>
                              <option>Block Bootstrap</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-white/60 mb-1 block">Horizon</label>
                            <select className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#21D4B4]">
                              <option>30 days</option>
                              <option>100 trades</option>
                              <option>Custom</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-white/60 mb-1 block">Seed (optional)</label>
                            <input
                              type="number"
                              placeholder="Auto"
                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-white/40 focus:outline-none focus:border-[#21D4B4]"
                            />
                          </div>
                        </div>
                        <button className="w-full bg-[#21D4B4] text-black text-[11px] font-semibold py-2 rounded hover:bg-[#1bb89a] transition-colors shadow-[0_0_8px_rgba(33,212,180,0.3)]">
                          Run Monte Carlo
                        </button>
                      </div>

                      {/* Output Placeholders */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-semibold text-white/90">Risk Analysis</div>
                        
                        {/* Histogram placeholder */}
                        <div className="rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm p-3">
                          <div className="text-[10px] text-white/60 mb-2">Final Equity Distribution</div>
                          <div className="h-32 bg-black/40 rounded flex items-center justify-center border border-white/5">
                            <span className="text-[10px] text-white/40">Histogram placeholder (equity distribution)</span>
                          </div>
                        </div>

                        {/* Fan chart placeholder */}
                        <div className="rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm p-3">
                          <div className="text-[10px] text-white/60 mb-2">Equity Fan Chart (Percentiles: 5/25/50/75/95)</div>
                          <div className="h-40 bg-black/40 rounded flex items-center justify-center border border-white/5">
                            <span className="text-[10px] text-white/40">Fan chart placeholder (percentile bands over time)</span>
                          </div>
                        </div>

                        {/* Risk KPIs */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                            <div className="text-[10px] text-white/60">VaR (95%)</div>
                            <div className="text-sm font-semibold text-rose-300">—</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                            <div className="text-[10px] text-white/60">CVaR (95%)</div>
                            <div className="text-sm font-semibold text-rose-300">—</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                            <div className="text-[10px] text-white/60">Probability of Ruin</div>
                            <div className="text-sm font-semibold text-rose-300">—</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                            <div className="text-[10px] text-white/60">Expected Drawdown</div>
                            <div className="text-sm font-semibold text-rose-300">—</div>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="rounded-lg border border-[#21D4B4]/30 bg-[#21D4B4]/5 p-3">
                          <div className="text-[10px] font-semibold text-[#21D4B4] mb-1">Analysis Summary</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">
                            Monte Carlo simulation will assess strategy robustness by generating multiple random scenarios based on historical trade patterns. Results will show probability distributions of outcomes, risk metrics, and potential worst-case scenarios.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "raw" && (
                <div className="space-y-1">
                  {!pretty ? (
                    <div className="bt-empty">
                      <div className="bt-empty-title">No payload yet</div>
                      <div className="bt-empty-sub">
                        Run a backtest to populate the raw JSON response here.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] text-white/60">
                        Raw payload (first 160 lines)
                      </div>
                      <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[11px] leading-4">
                        {pretty.split("\n").slice(0, 160).join("\n")}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
