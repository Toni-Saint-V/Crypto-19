import { useEffect, useMemo, useState } from "react";
import type { MLContext, MLScoreResponse } from "../types/ml";
import { postMLScore } from "../api/ml";

export function MLScoreWidget(props: { context: MLContext; market?: Record<string, any> }) {
  const { context, market } = props;
  const [resp, setResp] = useState<MLScoreResponse | null>(null);
  const req = useMemo(() => ({ context, market }), [context, market]);

  useEffect(() => {
    let alive = true;
    postMLScore(req)
      .then((r) => alive && setResp(r))
      .catch(() => alive && setResp({
        output: { signalQuality: 0, riskScore: 0, confidence: 0, tags: ["ERROR"], explain: ["fetch failed"] },
        featureVector: { features: {} },
      }));
    return () => { alive = false; };
  }, [req]);

  const out = resp?.output;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>ML</div>
      <div style={{ fontSize: 12 }}>Quality: <b>{out ? Math.round(out.signalQuality) : "..."}</b></div>
      <div style={{ fontSize: 12 }}>Risk: <b>{out ? Math.round(out.riskScore) : "..."}</b></div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{out?.tags?.slice(0, 3).join(" / ")}</div>
    </div>
  );
}
