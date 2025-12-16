import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("UI crash caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || String(this.state.error || "Unknown error");
      const stack = this.state.error?.stack || "";
      return (
        <div style={{ padding: 16, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          <h2 style={{ margin: "0 0 12px 0" }}>Dashboard crashed (React runtime error)</h2>
          <div style={{ marginBottom: 12, opacity: 0.9 }}>
            Open DevTools Console for full stack and source map.
          </div>
          <pre style={{ whiteSpace: "pre-wrap", padding: 12, border: "1px solid rgba(0,0,0,0.2)", borderRadius: 8 }}>
            {message}
            {"\n\n"}
            {stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
