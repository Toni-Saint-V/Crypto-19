import React from "react";

type Props = {
  title?: string;
  buttonLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function BacktestSheet({
  title = "Backtest Config",
  buttonLabel = "Configure Backtest",
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {buttonLabel}
      </button>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              zIndex: 50,
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "min(520px, 92vw)",
              background: "rgba(18,18,22,0.98)",
              borderLeft: "1px solid rgba(255,255,255,0.10)",
              zIndex: 51,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{title}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: 14, overflow: "auto" }}>{children}</div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
