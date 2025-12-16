import type { MLScoreRequest, MLScoreResponse } from "../types/ml";

export async function postMLScore(req: MLScoreRequest): Promise<MLScoreResponse> {
  const r = await fetch("/api/ml/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!r.ok) {
    return {
      output: { signalQuality: 0, riskScore: 0, confidence: 0, tags: ["HTTP_ERROR"], explain: [`HTTP ${r.status}`] },
      featureVector: { features: {} },
    };
  }
  return (await r.json()) as MLScoreResponse;
}
