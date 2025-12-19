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

type RunStatus = "idle" | "running" | "done" | "error";

function toNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = Number(v);
    if (Number.isFinite(x)) return x;
  }
  return fallback;
}

interface BacktestResultsPanelProps {
  apiBase?: string;
  onRun?: () => void;
  onCancel?: () => void;
  runStatus?: RunStatus;
  runError?: string;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function BacktestResultsPanel({ 
  apiBase, 
  onRun,
  onCancel,
  runStatus: externalRunStatus,
  runError: externalRunError,
  onExpandedChange,
}: BacktestResultsPanelProps = {}) {
  const [data, setData] = useState<AnyObj | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "trades" | "logs" | "monte-carlo" | "raw">("results");
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  // Use external status if provided, otherwise internal state
  const [internalRunStatus, setInternalRunStatus] = useState<RunStatus>("idle");
  const [internalRunError, setInternalRunError] = useState<string>("");
  const runStatus = externalRunStatus ?? internalRunStatus;
  const runError = externalRunError ?? internalRunError;

  useEffect(() => {
    const handler = (e: any) => setData(e?.detail || null);
    window.addEventListener("backtest:updated", handler as any);
    return () => window.removeEventListener("backtest:updated", handler as any);
  }, []);

  const kpi = useMemo(() => pickKpi(data || {}), [data]);
  
  // Extract PnL from data (try multiple possible fields)
  const totalPnl = useMemo(() => {
    if (!data) return null;
    const src = data.kpi || data.summary || data.metrics || data;
    const pnl = src.totalPnl ?? src.pnl ?? src.total_pnl ?? src.total_pnl_usd ?? src.profit;
    if (typeof pnl === 'number' && Number.isFinite(pnl)) return pnl;
    return null;
  }, [data]);

  const pretty = useMemo(() => {
    try {
      return data ? JSON.stringify(data, null, 2) : "";
    } catch {
      return "";
    }
  }, [data]);

  const totalTrades = kpi.totalTrades ?? 0;
  const hasData = !!data && totalTrades > 0;

  const handleToggle = () => {
    setIsExpanded((prev) => {
      const newExpanded = !prev;
      onExpandedChange?.(newExpanded);
      return newExpanded;
    });
  };

  const handleRunBacktest = async () => {
    if (runStatus === "running") return;
    
    // Use external handler if provided
    if (onRun) {
      onRun();
      return;
    }

    // Fallback to internal handler if no external handler
    setInternalRunStatus("running");
    setInternalRunError("");

    try {
      const payload: Record<string, unknown> = {
        strategy: "pattern3_extreme",
        symbol: "BTCUSDT",
        interval: "60",
        initial_balance: 10000,
      };

      const base = String(apiBase || '').replace(/\/$/, '');
      const url = `${base}/api/backtest/run`;
      const res = await fetch(url, {
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
      setInternalRunStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setInternalRunError(msg);
      setInternalRunStatus("error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Collapsed header / Summary strip */}
      <div
        className="w-full flex items-center justify-between gap-3 px-4 py-2 flex-shrink-0"
        style={{ height: '48px', cursor: 'pointer' }}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-label="Toggle backtest results drawer"
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-backtest)' }}>
            Backtest Results
          </div>
          <div className="flex items-center gap-2 text-xs overflow-hidden min-w-0">
            {hasData ? (
              <>
                <span 
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
                >
                  <span style={{ color: 'var(--text-3)' }}>PnL</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--text-1)' }}>
                    {totalPnl !== null 
                      ? `$${totalPnl.toFixed(2)}` 
                      : '—'}
                  </span>
                </span>
                <span 
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
                >
                  <span style={{ color: 'var(--text-3)' }}>Trades</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--text-1)' }}>
                    {kpi.totalTrades}
                  </span>
                </span>
                <span 
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
                >
                  <span style={{ color: 'var(--text-3)' }}>DD</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--status-loss)' }}>
                    {kpi.maxDrawdown.toFixed(1)}%
                  </span>
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--text-3)' }} className="truncate">
                No results yet
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {runStatus === "running" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-7 items-center rounded-lg px-3 text-xs font-semibold transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--stroke)',
                color: 'var(--text-2)',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleRunBacktest}
            disabled={runStatus === "running"}
            className="inline-flex h-7 items-center rounded-lg px-3 text-xs font-semibold transition-all disabled:opacity-50"
            style={{
              background: runStatus === "error"
                ? 'var(--status-loss-bg)'
                : 'var(--accent-backtest-bg)',
              color: runStatus === "error" ? 'var(--status-loss)' : 'var(--text-1)',
              border: `1px solid ${runStatus === "error" ? 'var(--status-loss-border)' : 'var(--accent-backtest-border)'}`,
            }}
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
              "▶ Run"
            )}
          </button>
          <span 
            className="inline-flex h-7 items-center rounded-lg px-3 text-xs font-medium"
            style={{ 
              background: 'var(--surface-2)', 
              border: '1px solid var(--stroke)',
              color: 'var(--text-2)',
            }}
          >
            {isExpanded ? "▼" : "▲"}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Tabs + Content */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-3">
            {/* Tabs */}
            <div className="mb-2 flex items-center gap-2 text-xs flex-wrap flex-shrink-0">
              {["results", "trades", "logs", "monte-carlo", "raw"].map((key) => {
                const id = key as typeof activeTab;
                const isActive = activeTab === id;
                const label =
                  id === "results"
                    ? "Overview"
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
                    className="rounded-lg px-3 py-1 text-xs font-medium transition-all"
                    style={{
                      background: isActive ? 'var(--accent-backtest-bg)' : 'var(--surface-2)',
                      border: `1px solid ${isActive ? 'var(--accent-backtest-border)' : 'var(--stroke)'}`,
                      color: isActive ? 'var(--accent-backtest)' : 'var(--text-2)',
                      boxShadow: isActive ? `0 0 8px var(--accent-backtest-glow)` : 'none',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar text-xs space-y-3">
              {runStatus === "error" && runError && (
                <div 
                  className="rounded-lg p-3 text-[11px]"
                  style={{
                    border: '1px solid var(--status-loss-border)',
                    background: 'var(--status-loss-bg)',
                    color: 'var(--text-1)',
                  }}
                >
                  <div 
                    className="font-semibold mb-1"
                    style={{ color: 'var(--status-loss)' }}
                  >
                    Backtest Error
                  </div>
                  <div style={{ color: 'var(--text-2)' }}>{runError}</div>
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
                        <div 
                          className="rounded-lg p-2"
                          style={{
                            border: '1px solid var(--stroke)',
                            background: 'var(--surface-2)',
                          }}
                        >
                          <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>Total Trades</div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{kpi.totalTrades}</div>
                        </div>
                        <div 
                          className="rounded-lg p-2"
                          style={{
                            border: '1px solid var(--stroke)',
                            background: 'var(--surface-2)',
                          }}
                        >
                          <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>Profit Factor</div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                            {kpi.profitFactor.toFixed(2)}
                          </div>
                        </div>
                        <div 
                          className="rounded-lg p-2"
                          style={{
                            border: '1px solid var(--stroke)',
                            background: 'var(--surface-2)',
                          }}
                        >
                          <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>Max Drawdown</div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--status-loss)' }}>
                            {kpi.maxDrawdown.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
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
                      <thead 
                        style={{
                          position: 'sticky',
                          top: 0,
                          background: 'var(--surface-3)',
                          zIndex: 10,
                        }}
                      >
                        <tr>
                          <th 
                            className="px-2 py-1 text-left font-medium"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Time
                          </th>
                          <th 
                            className="px-2 py-1 text-left font-medium"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Side
                          </th>
                          <th 
                            className="px-2 py-1 text-right font-medium"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Size
                          </th>
                          <th 
                            className="px-2 py-1 text-right font-medium"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Price
                          </th>
                          <th 
                            className="px-2 py-1 text-right font-medium"
                            style={{ color: 'var(--text-3)' }}
                          >
                            PnL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.trades.slice(0, 120).map((t: AnyObj, idx: number) => (
                          <tr
                            key={idx}
                            style={{
                              borderTop: '1px solid var(--stroke)',
                              background: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                            }}
                          >
                            <td className="px-2 py-1" style={{ color: 'var(--text-1)' }}>
                              {t.time || t.timestamp || t.entry_time || "-"}
                            </td>
                            <td className="px-2 py-1" style={{ color: 'var(--text-1)' }}>
                              {(t.side || t.direction || "").toString().toUpperCase() || "-"}
                            </td>
                            <td className="px-2 py-1 text-right" style={{ color: 'var(--text-1)' }}>
                              {t.size ?? t.qty ?? t.quantity ?? "-"}
                            </td>
                            <td className="px-2 py-1 text-right" style={{ color: 'var(--text-1)' }}>
                              {t.price ?? t.entry_price ?? "-"}
                            </td>
                            <td className="px-2 py-1 text-right" style={{ color: 'var(--text-1)' }}>
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
                          className="rounded px-2 py-1 font-mono text-[10px]"
                          style={{
                            background: 'var(--surface-2)',
                            color: 'var(--text-2)',
                          }}
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
                      <div 
                        className="rounded-lg p-3 space-y-3"
                        style={{
                          border: '1px solid var(--stroke)',
                          background: 'var(--surface-2)',
                        }}
                      >
                        <div 
                          className="text-[11px] font-semibold mb-2"
                          style={{ color: 'var(--text-1)' }}
                        >
                          Monte Carlo Parameters
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label 
                              className="text-[10px] mb-1 block"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Iterations
                            </label>
                            <select 
                              className="w-full rounded px-2 py-1.5 text-[11px] focus:outline-none transition-colors"
                              style={{ 
                                background: 'var(--surface-3)',
                                border: `1px solid ${focusedInputId === 'iterations' ? 'var(--accent-backtest-border)' : 'var(--stroke)'}`,
                                color: 'var(--text-1)',
                                boxShadow: focusedInputId === 'iterations' ? `0 0 0 1px var(--accent-backtest-glow)` : 'none',
                              }}
                              onFocus={() => {
                                setFocusedInputId('iterations');
                              }}
                              onBlur={() => {
                                setFocusedInputId(null);
                              }}
                            >
                              <option>500</option>
                              <option>1000</option>
                              <option>5000</option>
                            </select>
                          </div>
                          <div>
                            <label 
                              className="text-[10px] mb-1 block"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Method
                            </label>
                            <select 
                              className="w-full rounded px-2 py-1.5 text-[11px] focus:outline-none transition-colors"
                              style={{
                                background: 'var(--surface-3)',
                                border: `1px solid ${focusedInputId === 'method' ? 'var(--accent-backtest-border)' : 'var(--stroke)'}`,
                                color: 'var(--text-1)',
                                boxShadow: focusedInputId === 'method' ? `0 0 0 1px var(--accent-backtest-glow)` : 'none',
                              }}
                              onFocus={() => {
                                setFocusedInputId('method');
                              }}
                              onBlur={() => {
                                setFocusedInputId(null);
                              }}
                            >
                              <option>Bootstrap Returns</option>
                              <option>Trade Shuffle</option>
                              <option>Block Bootstrap</option>
                            </select>
                          </div>
                          <div>
                            <label 
                              className="text-[10px] mb-1 block"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Horizon
                            </label>
                            <select 
                              className="w-full rounded px-2 py-1.5 text-[11px] focus:outline-none transition-colors"
                              style={{
                                background: 'var(--surface-3)',
                                border: `1px solid ${focusedInputId === 'horizon' ? 'var(--accent-backtest-border)' : 'var(--stroke)'}`,
                                color: 'var(--text-1)',
                                boxShadow: focusedInputId === 'horizon' ? `0 0 0 1px var(--accent-backtest-glow)` : 'none',
                              }}
                              onFocus={() => {
                                setFocusedInputId('horizon');
                              }}
                              onBlur={() => {
                                setFocusedInputId(null);
                              }}
                            >
                              <option>30 days</option>
                              <option>100 trades</option>
                              <option>Custom</option>
                            </select>
                          </div>
                          <div>
                            <label 
                              className="text-[10px] mb-1 block"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Seed (optional)
                            </label>
                            <input
                              type="number"
                              placeholder="Auto"
                              className="w-full rounded px-2 py-1.5 text-[11px] focus:outline-none transition-colors"
                              style={{
                                background: 'var(--surface-3)',
                                border: `1px solid ${focusedInputId === 'seed' ? 'var(--accent-backtest-border)' : 'var(--stroke)'}`,
                                color: 'var(--text-1)',
                                boxShadow: focusedInputId === 'seed' ? `0 0 0 1px var(--accent-backtest-glow)` : 'none',
                              }}
                              onFocus={() => {
                                setFocusedInputId('seed');
                              }}
                              onBlur={() => {
                                setFocusedInputId(null);
                              }}
                            />
                          </div>
                        </div>
                        <button 
                          className="w-full text-[11px] font-semibold py-2 rounded transition-colors"
                          style={{
                            background: isButtonHovered ? 'var(--accent-backtest)' : 'var(--accent-backtest-bg)',
                            border: '1px solid var(--accent-backtest-border)',
                            color: isButtonHovered ? 'var(--text-1)' : 'var(--accent-backtest)',
                            boxShadow: `0 0 8px var(--accent-backtest-glow)`,
                          }}
                          onMouseEnter={() => {
                            setIsButtonHovered(true);
                          }}
                          onMouseLeave={() => {
                            setIsButtonHovered(false);
                          }}
                        >
                          Run Monte Carlo
                        </button>
                      </div>

                      {/* Output Placeholders */}
                      <div className="space-y-3">
                        <div 
                          className="text-[11px] font-semibold"
                          style={{ color: 'var(--text-1)' }}
                        >
                          Risk Analysis
                        </div>
                        
                        {/* Histogram placeholder */}
                        <div 
                          className="rounded-lg backdrop-blur-sm p-3"
                          style={{
                            border: '1px solid var(--stroke)',
                            background: 'var(--surface-2)',
                          }}
                        >
                          <div 
                            className="text-[10px] mb-2"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Final Equity Distribution
                          </div>
                          <div 
                            className="h-32 rounded flex items-center justify-center"
                            style={{
                              background: 'var(--surface-3)',
                              border: '1px solid var(--stroke)',
                            }}
                          >
                            <span 
                              className="text-[10px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Histogram placeholder (equity distribution)
                            </span>
                          </div>
                        </div>

                        {/* Fan chart placeholder */}
                        <div 
                          className="rounded-lg backdrop-blur-sm p-3"
                          style={{
                            border: '1px solid var(--stroke)',
                            background: 'var(--surface-2)',
                          }}
                        >
                          <div 
                            className="text-[10px] mb-2"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Equity Fan Chart (Percentiles: 5/25/50/75/95)
                          </div>
                          <div 
                            className="h-40 rounded flex items-center justify-center"
                            style={{
                              background: 'var(--surface-3)',
                              border: '1px solid var(--stroke)',
                            }}
                          >
                            <span 
                              className="text-[10px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Fan chart placeholder (percentile bands over time)
                            </span>
                          </div>
                        </div>

                        {/* Risk KPIs */}
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            className="rounded-lg p-2"
                            style={{
                              border: '1px solid var(--stroke)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <div 
                              className="text-[10px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              VaR (95%)
                            </div>
                            <div 
                              className="text-sm font-semibold"
                              style={{ color: 'var(--status-loss)' }}
                            >
                              —
                            </div>
                          </div>
                          <div 
                            className="rounded-lg p-2"
                            style={{
                              border: '1px solid var(--stroke)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <div 
                              className="text-[10px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              CVaR (95%)
                            </div>
                            <div 
                              className="text-sm font-semibold"
                              style={{ color: 'var(--status-loss)' }}
                            >
                              —
                            </div>
                          </div>
                          <div 
                            className="rounded-lg p-2"
                            style={{
                              border: '1px solid var(--stroke)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <div 
                              className="text-[10px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Probability of Ruin
                            </div>
                            <div 
                              className="text-sm font-semibold"
                              style={{ color: 'var(--status-loss)' }}
                            >
                              —
                            </div>
                          </div>
                          <div 
                            className="rounded-lg p-2"
                            style={{
                              border: '1px solid var(--stroke)',
                              background: 'var(--surface-2)',
                            }}
                          >
                            <div 
                              className="text-[10px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              Expected Drawdown
                            </div>
                            <div 
                              className="text-sm font-semibold"
                              style={{ color: 'var(--status-loss)' }}
                            >
                              —
                            </div>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div 
                          className="rounded-lg p-3"
                          style={{
                            border: '1px solid var(--accent-backtest-border)',
                            background: 'var(--accent-backtest-bg)',
                          }}
                        >
                          <div 
                            className="text-[10px] font-semibold mb-1"
                            style={{ color: 'var(--accent-backtest)' }}
                          >
                            Analysis Summary
                          </div>
                          <div 
                            className="text-[11px] leading-relaxed"
                            style={{ color: 'var(--text-2)' }}
                          >
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
                      <div 
                        className="text-[11px]"
                        style={{ color: 'var(--text-3)' }}
                      >
                        Raw payload (first 160 lines)
                      </div>
                      <pre 
                        className="mt-1 max-h-64 overflow-auto rounded-lg p-2 text-[11px] leading-4"
                        style={{
                          border: '1px solid var(--stroke)',
                          background: 'var(--surface-2)',
                          color: 'var(--text-2)',
                        }}
                      >
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
