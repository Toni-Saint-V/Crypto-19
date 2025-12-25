# OpenAPI + Frontend API usage report
Generated: 2025-12-20 04:34

## Backend OpenAPI status
- Source: http://127.0.0.1:8000/openapi.json
- Snapshot: docs/OPENAPI_SNAPSHOT.json

## /api/ml/score (POST) expected request schema
- Schema: inline schema
- Expected keys: UNKNOWN (schema not found)

## Frontend /api/ml/score usage
```
web/dashboard-react/src/components/MLScoreWidget.tsx:59: 
web/dashboard-react/src/components/MLScoreWidget.tsx:60:   async function fetchOnce() {
web/dashboard-react/src/components/MLScoreWidget.tsx:61:     setLoading(true);
web/dashboard-react/src/components/MLScoreWidget.tsx:62:     setErr(false);
web/dashboard-react/src/components/MLScoreWidget.tsx:63:     try {
web/dashboard-react/src/components/MLScoreWidget.tsx:64:       const payload = { context: props.context, market: { volatility: null, trend_strength: null, spread_estimate: null } };
web/dashboard-react/src/components/MLScoreWidget.tsx:65:       const r = await fetch("/api/ml/score", {
web/dashboard-react/src/components/MLScoreWidget.tsx:66:         method: "POST",
web/dashboard-react/src/components/MLScoreWidget.tsx:67:         headers: { "Content-Type": "application/json" },
web/dashboard-react/src/components/MLScoreWidget.tsx:68:         body: JSON.stringify(payload),
web/dashboard-react/src/components/MLScoreWidget.tsx:69:       });
web/dashboard-react/src/components/MLScoreWidget.tsx:70:       if (!r.ok) {
web/dashboard-react/src/components/MLScoreWidget.tsx:71:         setErr(true);
web/dashboard-react/src/components/MLScoreWidget.tsx:72:         setData({});
web/dashboard-react/src/components/MLScoreWidget.tsx:73:         return;
web/dashboard-react/src/components/MLScoreWidget.tsx:74:       }
web/dashboard-react/src/components/MLScoreWidget.tsx:75:       const j = (await r.json().catch(() => ({} as any))) as MlResp;
web/dashboard-react/src/components/MLScoreWidget.tsx:76:       setData(j || {});
web/dashboard-react/src/components/MLScoreWidget.tsx:77:     } catch {
web/dashboard-react/src/components/MLScoreWidget.tsx:78:       setErr(true);

web/dashboard-react/src/api/ml.ts:1: import type { MLScoreRequest, MLScoreResponse } from "../types/ml";
web/dashboard-react/src/api/ml.ts:2: 
web/dashboard-react/src/api/ml.ts:3: export async function postMLScore(req: MLScoreRequest): Promise<MLScoreResponse> {
web/dashboard-react/src/api/ml.ts:4:   const r = await fetch("/api/ml/score", {
web/dashboard-react/src/api/ml.ts:5:     method: "POST",
web/dashboard-react/src/api/ml.ts:6:     headers: { "Content-Type": "application/json" },
web/dashboard-react/src/api/ml.ts:7:     body: JSON.stringify(req),
web/dashboard-react/src/api/ml.ts:8:   });
web/dashboard-react/src/api/ml.ts:9: 
web/dashboard-react/src/api/ml.ts:10:   if (!r.ok) {
web/dashboard-react/src/api/ml.ts:11:     return {
web/dashboard-react/src/api/ml.ts:12:       output: { signalQuality: 0, riskScore: 0, confidence: 0, tags: ["HTTP_ERROR"], explain: [`HTTP ${r.status}`] },
web/dashboard-react/src/api/ml.ts:13:       featureVector: { features: {} },
web/dashboard-react/src/api/ml.ts:14:     };
web/dashboard-react/src/api/ml.ts:15:   }
web/dashboard-react/src/api/ml.ts:16:   return (await r.json()) as MLScoreResponse;
web/dashboard-react/src/api/ml.ts:17: }

```

## Frontend payload keys (best-effort from JSON.stringify blocks)
- Found keys: UNKNOWN

## Frontend referenced API paths (unique)
- /api/assistant
- /api/ml/score
