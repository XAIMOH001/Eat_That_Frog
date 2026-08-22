"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#e0e5ec",
          color: "#3f4a5f",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            This app didn&apos;t start
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#5a6579" }}>
            Something failed before the page could load. Check the server logs.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "none",
              backgroundColor: "#e0e5ec",
              color: "#6052ce",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
