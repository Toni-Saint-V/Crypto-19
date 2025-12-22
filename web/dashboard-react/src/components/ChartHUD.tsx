import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  mode?: string;
  symbol?: string;
  timeframe?: string;
};

type AssistantResponse = {
  answer?: string;
  actions?: Array<{ type: string; label: string; payload?: Record<string, any> }>;
};

function nowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

// Format value: show —/N/A/Partial instead of UNKNOWN
function formatValue(value: string | undefined, fallback: string = "—"): string {
  if (!value || value.trim() === "" || value.toUpperCase() === "UNKNOWN") {
    return fallback;
  }
  return value;
}

export default function ChartHUD(props: Props) {
  const mode = props.mode || "LIVE";
  const symbol = formatValue(props.symbol);
  const timeframe = formatValue(props.timeframe);

  const [healthCode, setHealthCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastPing, setLastPing] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [assistantText, setAssistantText] = useState<string>("");
  const [assistantMeta, setAssistantMeta] = useState<string>("");

  const timerRef = useRef<number | null>(null);

  const decisionLine = useMemo(() => {
    const ok = healthCode === 200 ? "OK" : (healthCode === 404 ? "404" : (healthCode == null ? "…" : String(healthCode)));
    const l = latencyMs == null ? "—" : String(latencyMs);
    return `Режим: ${mode} | ${symbol} ${timeframe} | Бэкенд: ${ok} | Задержка: ${l}ms`;
  }, [mode, symbol, timeframe, healthCode, latencyMs]);

  async function ping() {
    const t0 = Date.now();
    try {
      const r = await fetch("/health", { method: "GET" });
      const dt = Date.now() - t0;
      setHealthCode(r.status);
      setLatencyMs(dt);
      setLastPing(nowIso());
    } catch {
      setHealthCode(0);
      setLatencyMs(null);
      setLastPing(nowIso());
    }
  }

  useEffect(() => {
    ping();
    timerRef.current = window.setInterval(() => ping(), 10000) as unknown as number;
    return () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  async function callAssistant(intent: string) {
    setBusy(true);
    setAssistantMeta(intent);
    setAssistantText("");
    try {
      const payload = {
        messages: [{ role: "user", content: intent }],
        context: { mode, symbol, timeframe }
      };
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = (await r.json()) as AssistantResponse;
      if (j && j.answer) {
        setAssistantText(String(j.answer));
      } else {
        // Don't show HTTP codes - show human message
        const errorMsg = (j as any)?.error || (j as any)?.message || "Не удалось получить ответ";
        const requestId = (j as any)?.request_id || (j as any)?.requestId || "";
        setAssistantText(requestId ? `${errorMsg} (request: ${requestId})` : errorMsg);
      }
    } catch (e) {
      setAssistantText("Ошибка ассистента");
    } finally {
      setBusy(false);
    }
  }

  const rowStyle: React.CSSProperties = {
    height: 28,
    display: "flex",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    whiteSpace: "nowrap"
  };

  const chipsStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    overflowY: "hidden",
    whiteSpace: "nowrap",
    paddingBottom: 2
  };

  const chipBtnStyle: React.CSSProperties = {
    height: 26,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    fontSize: 12
  };

  const textStyle: React.CSSProperties = {
    fontSize: 12,
    opacity: 0.9,
    overflow: "hidden",
    textOverflow: "ellipsis"
  };

  return (
    <div style={{ overflow: "hidden" }}>
      <div style={rowStyle} title={decisionLine}>
        <div style={{ ...textStyle, flex: 1, minWidth: 0 }}>{decisionLine}</div>
        <div style={{ ...textStyle, opacity: 0.7 }}>Последнее: {lastPing ? lastPing.slice(11, 19) : "—"}</div>
      </div>

      <div style={{ ...rowStyle, height: 30 }}>
        <div style={chipsStyle} className="chart-hud-chips">
          <button style={chipBtnStyle} disabled={busy} onClick={() => callAssistant("Explain last signal in 5 bullets.")}>
            Объяснить сигнал
          </button>
          <button style={chipBtnStyle} disabled={busy} onClick={() => callAssistant("Объяснить просадку and main drivers.")}>
            Объяснить просадку
          </button>
          <button style={chipBtnStyle} disabled={busy} onClick={() => callAssistant("Give risk warnings for current context.")}>
            Риск-предупреждения
          </button>
          <button style={chipBtnStyle} disabled={busy} onClick={() => callAssistant("Suggest safe parameter tweaks (no auto apply).")}>
            Подсказать настройки
          </button>
        </div>
        <div style={{ ...textStyle, opacity: 0.7 }}>{busy ? "Ассистент: думаю…" : (assistantMeta ? `Assistant: ${assistantMeta}` : "")}</div>
      </div>
      {(busy || assistantMeta || assistantText) ? (
        <div style={{ ...rowStyle, height: 26 }} title={assistantText || ""}>
          <div style={{ ...textStyle, flex: 1, minWidth: 0, opacity: assistantText ? 0.95 : 0.65 }}>
            {assistantText ? assistantText : (busy ? "Ассистент: думаю…" : "Assistant: —")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
