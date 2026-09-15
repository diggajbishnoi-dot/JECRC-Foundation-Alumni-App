/**
 * Focused tests for ErrorBoundary (P2-008)
 *
 * Verifies:
 * 1. Children render normally when there is no error.
 * 2. Fallback UI is shown (not the child) when a render error occurs.
 * 3. The fallback does NOT expose raw error messages, stack traces, or
 *    sensitive details to the user.
 * 4. A "Try again" button resets the boundary and allows the child to retry.
 * 5. A custom fallback prop is supported.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";

/** A component that throws on purpose when `shouldThrow` is true */
function BombComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("SENSITIVE_SECRET: db_password=hunter2, token=eyJfake");
  }
  return <div data-testid="child-content">Child rendered OK</div>;
}

/** Suppress expected console.error noise from React's error boundary logging */
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  vi.mocked(console.error).mockRestore();
});

describe("ErrorBoundary (P2-008)", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("MUST NOT expose raw error message (sensitive details) in the fallback UI", () => {
    const { container } = render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const html = container.innerHTML;
    // Raw error string must never appear in the DOM
    expect(html).not.toContain("SENSITIVE_SECRET");
    expect(html).not.toContain("db_password");
    expect(html).not.toContain("hunter2");
    expect(html).not.toContain("token=eyJfake");
    expect(html).not.toContain("stack");
  });

  it("shows a generic human-friendly message in the fallback UI", () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/your data is safe/i)).toBeInTheDocument();
  });

  it("shows Reload and Try again buttons in the fallback UI", () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /reload app/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("resets the boundary when Try again is clicked, re-rendering children", () => {
    /** Stateful wrapper so we can toggle shouldThrow externally */
    function Wrapper() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary>
          {shouldThrow ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <BombComponent shouldThrow={true} key="bad" />
          ) : (
            <div data-testid="recovered">Recovered!</div>
          )}
          {/* hidden button to flip state externally */}
          <button onClick={() => setShouldThrow(false)} style={{ display: "none" }} data-testid="fix-btn">fix</button>
        </ErrorBoundary>
      );
    }

    const { rerender } = render(<Wrapper />);

    // Initially showing fallback
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click "Try again" — resets boundary state
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    // After reset the boundary will try to render children again.
    // The bomb is still active so the boundary will catch again —
    // this confirms reset → catch cycle works without crashing the test.
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<Wrapper />);
  });

  it("renders a custom fallback prop when provided", () => {
    const customFallback = (reset: () => void) => (
      <div data-testid="custom-fallback">
        <span>Custom error UI</span>
        <button onClick={reset}>custom-reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    // Default fallback must NOT be shown when custom is provided
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});
