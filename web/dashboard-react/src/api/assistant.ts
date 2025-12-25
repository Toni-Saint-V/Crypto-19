import type { AssistantRequest, AssistantResponse } from "../types/assistant";

export async function postAssistant(req: AssistantRequest): Promise<AssistantResponse> {
  const r = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!r.ok) {
    return { answer: `HTTP ${r.status}`, actions: [] };
  }
  return (await r.json()) as AssistantResponse;
}
