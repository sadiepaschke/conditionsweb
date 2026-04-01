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
          padding: 32, textAlign: "center", color: "#c99d28",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>Something went wrong.</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => {
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
