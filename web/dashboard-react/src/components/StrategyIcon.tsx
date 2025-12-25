
type Props = {
  strategy?: string;
  size?: number;
  title?: string;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function pick(strategy?: string): "mr3" | "trend" | "breakout" | "default" {
  const v = norm(String(strategy || ""));
  if (v.includes("mean") || v.includes("reversion") || v.includes("mr")) return "mr3";
  if (v.includes("trend") || v.includes("following")) return "trend";
  if (v.includes("breakout") || v.includes("range break")) return "breakout";
  return "default";
}

export default function StrategyIcon(props: Props) {
  const size = props.size ?? 14;
  const kind = pick(props.strategy);
  const title = props.title ?? props.strategy ?? "strategy";

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    role: "img",
    "aria-label": title,
  } as const;

  if (kind === "mr3") {
    return (
      <svg {...common} className="strategy-icon">
        <title>{title}</title>
        <rect x="5" y="6" width="3" height="12" rx="1" />
        <rect x="10.5" y="4" width="3" height="16" rx="1" />
        <rect x="16" y="7" width="3" height="10" rx="1" />
      </svg>
    );
  }

  if (kind === "trend") {
    return (
      <svg {...common} className="strategy-icon">
        <title>{title}</title>
        <path d="M5 16 L10 11 L13 14 L19 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 8 H19 V10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "breakout") {
    return (
      <svg {...common} className="strategy-icon">
        <title>{title}</title>
        <rect x="5" y="6" width="10" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M13 12 H20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 10 L20 12 L18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg {...common} className="strategy-icon">
      <title>{title}</title>
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
