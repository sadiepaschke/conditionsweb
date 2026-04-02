import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 48, textAlign: "center", color: "#c99d28",
          fontFamily: "'DM Sans', sans-serif",
          background: "#0e0d0a", minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <p style={{ fontSize: 18, marginBottom: 16 }}>Something went wrong.</p>
          <p style={{ fontSize: 13, color: "#999", marginBottom: 8, maxWidth: 500 }}>
            {this.state.error?.message || "Unknown error"}
          </p>
          <pre style={{
            fontSize: 11, color: "#666", marginBottom: 24, maxWidth: 600,
            textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-all",
            padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 8,
            maxHeight: 150, overflow: "auto",
          }}>
            {this.state.error?.stack?.slice(0, 500)}
          </pre>
          <button
            onClick={() => {
              try { localStorage.removeItem("conditions-web-session"); } catch {}
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "10px 24px", fontSize: 13,
              background: "transparent", border: "1px solid rgba(201,157,40,0.4)",
              color: "#c99d28", borderRadius: 8, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
