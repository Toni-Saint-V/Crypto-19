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

export default function BacktestResultsPanel() {
  const [data, setData] = useState<AnyObj | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState<number>(220);
  const [activeTab, setActiveTab] = useState<"results" | "trades" | "logs" | "raw">("results");
  const [isResizing, setIsResizing] = useState(false);

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

  return (
    <div
      className="bt-drawer-wrapper border-t border-white/10 bg-white/5"
      data-page="backtest"
      style={{
        height: isExpanded ? drawerHeight : 70,
        transition: isResizing ? "none" : "height 160ms ease-out",
        minHeight: 56,
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

        <div className="flex items-center gap-2">
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
            <div className="mb-2 flex items-center gap-2 text-[11px]">
              {["results", "trades", "logs", "raw"].map((key) => {
                const id = key as typeof activeTab;
                const isActive = activeTab === id;
                const label =
                  id === "results"
                    ? "Results"
                    : id === "trades"
                    ? "Trades"
                    : id === "logs"
                    ? "Logs"
                    : "Raw";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`rounded-full px-3 py-1 border text-[11px] transition-colors ${
                      isActive
                        ? "border-emerald-400 bg-emerald-400/15 text-emerald-200"
                        : "border-white/10 bg-black/30 text-white/60 hover:border-white/30"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar text-xs space-y-3">
              {activeTab === "results" && (
                <div className="space-y-2">
                  {!hasData ? (
                    <div className="bt-empty">
                      <div className="bt-empty-title">No backtest results yet</div>
                      <div className="bt-empty-sub">
                        Run a backtest from the controls to populate metrics and details.
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
