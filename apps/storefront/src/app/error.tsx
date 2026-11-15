"use client"

import Link from "next/link"
import { useEffect } from "react"

/**
 * Shown when something unexpected fails while rendering a page.
 * The rest of the site (header, footer) stays usable because this sits inside the root layout.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Hook point for an error-monitoring service; the digest matches the server log entry.
    console.error("[storefront error]", error.digest ?? "", error)
  }, [error])

  return (
    <div className="bg-white min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-block px-3 py-1 bg-brand-secondary border border-brand-border text-[10px] font-heading font-semibold uppercase tracking-widest text-brand-primary">
          Something went wrong
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-brand-primary">
          We hit a snag
        </h1>

        <p className="text-sm text-brand-muted leading-relaxed">
          This page didn&apos;t load properly. Your bag is safe. Please try again, or head back
          to the shop.
        </p>

        {error.digest && (
          <p className="text-[11px] font-mono text-brand-muted">Reference: {error.digest}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 bg-brand-primary text-white text-xs font-heading font-semibold uppercase tracking-wider hover:bg-black transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-brand-border text-brand-primary text-xs font-heading font-semibold uppercase tracking-wider hover:border-brand-primary transition-colors"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  )
}
