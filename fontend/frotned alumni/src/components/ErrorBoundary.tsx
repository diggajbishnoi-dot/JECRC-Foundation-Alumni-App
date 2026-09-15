/**
 * ErrorBoundary — P2-008
 *
 * Production-safe React Error Boundary.
 * - Catches render/lifecycle errors anywhere in the subtree.
 * - Shows a safe, user-friendly fallback (no stack traces, no sensitive details).
 * - Offers a "Reload app" recovery action.
 * - In development, logs the error to the console only.
 * - Never surfaces raw error messages / stack traces to the UI in production.
 */
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional custom fallback rendered instead of the default UI */
  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  /** Kept only for dev-mode console logging, never shown in UI */
  _devError?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, _devError: error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Safe server-side / console-only logging — never exposes secrets or tokens.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary] Uncaught render error:", error, info.componentStack);
    }
    // TODO: wire up a real error-reporting service (e.g. Sentry) here —
    // make sure it is configured to scrub tokens/PII before sending.
  }

  reset = () => {
    this.setState({ hasError: false, _devError: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.reset);
      }
      return <DefaultFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}

/* ---------- default fallback UI ---------- */
function DefaultFallback({ onReset }: { onReset: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        padding: "2rem",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        gap: "1.25rem",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(239,68,68,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          border: "1.5px solid rgba(239,68,68,0.3)",
        }}
      >
        ⚠️
      </div>

      {/* Heading */}
      <h1
        style={{
          margin: 0,
          color: "#f1f5f9",
          fontSize: "1.35rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Something went wrong
      </h1>

      {/* Generic message — no sensitive details */}
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
          fontSize: "0.95rem",
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        An unexpected error occurred. Your data is safe. Please try reloading the
        app — if the problem persists, contact support.
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          id="error-boundary-reload-btn"
          onClick={() => window.location.reload()}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "2rem",
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.01em",
            boxShadow: "0 4px 18px rgba(99,102,241,0.35)",
          }}
        >
          Reload app
        </button>
        <button
          id="error-boundary-retry-btn"
          onClick={onReset}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "2rem",
            border: "1.5px solid rgba(148,163,184,0.25)",
            background: "transparent",
            color: "#94a3b8",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
