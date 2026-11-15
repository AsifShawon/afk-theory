"use client"

import { useEffect } from "react"

/**
 * Last-resort page for errors in the root layout itself. It must render its own
 * <html> and <body>, and cannot rely on the site's styles or components.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[storefront global error]", error.digest ?? "", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F3ED",
          color: "#20241F",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ letterSpacing: 2, fontSize: 12, textTransform: "uppercase" }}>AFK THEORY</p>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>We hit a snag</h1>
          <p style={{ lineHeight: 1.6, fontSize: 15 }}>
            The site couldn&apos;t load. Please try again in a moment.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.7 }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              background: "#20241F",
              color: "#fff",
              border: 0,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: 12,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
