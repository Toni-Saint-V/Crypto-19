import React, { useMemo, useState } from "react";

type RunResponse = {
  equity_curve?: number[];
  prices?: number[];
  trades?: Array<Record<string, unknown>>;
  statistics?: Record<string, unknown>;
};

type BacktestKpiLike = {
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
};

function toNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = Number(v);
    if (Number.isFinite(x)) return x;
  }
  return fallback;
}

function mapStatisticsToKpi(stat: Record<string, unknown> | undefined): BacktestKpiLike {
  const s = stat || {};
  const totalTrades = toNumber(s.total_trades ?? s.totalTrades, 0);
  const maxDrawdown = toNumber(s.max_drawdown ?? s.maxDrawdown, 0);
  const profitFactor = toNumber(s.profit_factor ?? s.profitFactor, 0);
  return { totalTrades, profitFactor, maxDrawdown };
}

export default function BacktestConfigPanel(): JSX.Element {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [strategy, setStrategy] = useState("pattern3_extreme");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("60");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [initialBalance, setInitialBalance] = useState("10000");

  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string>("");

  const runBacktest = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setStatus("Running backtest...");

    const payload: Record<string, unknown> = {
      strategy,
      symbol,
      interval,
      initial_balance: toNumber(initialBalance, 10000),
    };

    if (startDate) payload.start_date = startDate;
    if (endDate) payload.end_date = endDate;

    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`.trim());
      }

      const data = (await res.json().catch(() => ({}))) as RunResponse;
      const kpi = mapStatisticsToKpi(data.statistics);

      window.dispatchEvent(new CustomEvent("backtest:updated", { detail: kpi }));
      setStatus("Backtest done. UI should update now.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`Backtest failed: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Strategy</div>
          <input value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Symbol</div>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 100 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Interval</div>
          <input value={interval} onChange={(e) => setInterval(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Start (YYYY-MM-DD)</div>
          <input value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>End (YYYY-MM-DD)</div>
          <input value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Initial Balance</div>
          <input value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} style={{ width: "100%" }} />
        </div>

        <button
          onClick={runBacktest}
          disabled={isRunning}
          style={{ padding: "8px 12px", cursor: isRunning ? "not-allowed" : "pointer" }}
        >
          {isRunning ? "Running..." : "Run backtest"}
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, whiteSpace: "pre-wrap" }}>{status}</div>
    </div>
  );
}
