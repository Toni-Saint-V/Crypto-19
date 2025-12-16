import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  context: any;
};

type MlResp = {
  label?: string;
  signal?: string;
  direction?: string;
  score?: number;
  quality?: number;
  risk?: number;
  confidence?: number;
  conf?: number;
};

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function to01From100(x: number | null): number | null {
  if (x == null) return null;
  if (x <= 1) return clamp01(x);
  return clamp01(x / 100);
}

function trafficFromQuality(q01: number | null): "green" | "yellow" | "red" | "off" {
  if (q01 == null) return "off";
  if (q01 >= 0.66) return "green";
  if (q01 >= 0.33) return "yellow";
  return "red";
}

export function MLScoreWidget(props: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [data, setData] = useState<MlResp>({});
  const timerRef = useRef<number | null>(null);

  const q01 = useMemo(() => {
    const q = (data.quality != null ? data.quality : (data.score != null ? data.score : null)) as number | null;
    return to01From100(q);
  }, [data]);

  const risk01 = useMemo(() => {
    const r = (data.risk != null ? data.risk : null) as number | null;
    return to01From100(r);
  }, [data]);

  const tl = useMemo(() => trafficFromQuality(q01), [q01]);

  const label = useMemo(() => {
    const s = String(data.label || data.signal || data.direction || "").trim();
    return s;
  }, [data]);

  async function fetchOnce() {
    setLoading(true);
    setErr(false);
    try {
      const payload = { context: props.context, market: { volatility: null, trend_strength: null, spread_estimate: null } };
      const r = await fetch("/api/ml/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        setErr(true);
        setData({});
        return;
      }
      const j = (await r.json().catch(() => ({} as any))) as MlResp;
      setData(j || {});
    } catch {
      setErr(true);
      setData({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOnce();
    timerRef.current = window.setInterval(() => fetchOnce(), 10000) as unknown as number;
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
    };
  }, [props.context]);

  const title = err ? "ML недоступен" : (label ? label : "ML");

  return (
    <div className="ml-widget" title={title}>
      <div className="ml-traffic" aria-label={title}>
        <span className={"ml-dot " + (tl === "green" ? "is-green" : "")} />
        <span className={"ml-dot " + (tl === "yellow" ? "is-yellow" : "")} />
        <span className={"ml-dot " + (tl === "red" ? "is-red" : "")} />
      </div>

      <div className="ml-text">
        {loading ? (
          <span className="shimmer-line" style={{ width: 120 }} />
        ) : err ? (
          <span className="ml-muted">Нет данных</span>
        ) : (
          <>
            <span className="ml-label">{label ? label : "ML"}</span>
            {q01 != null ? <span className="ml-metric">Качество {Math.round(q01 * 100)}</span> : null}
            {risk01 != null ? <span className="ml-metric">Риск {Math.round(risk01 * 100)}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

export default MLScoreWidget;
