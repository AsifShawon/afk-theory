"use client"

import Link from "next/link"
import { clsx } from "clsx"
import type { SearchIndexEntry } from "@dtc/catalogue-core"

const price = (bdt: number) => `৳${bdt.toLocaleString("en-US")}`

/** A list of search hits: photo, name, category and price. */
export function SearchResults({
  results,
  onPick,
  tone = "dark",
  compact = false,
}: {
  results: SearchIndexEntry[]
  onPick?: () => void
  tone?: "dark" | "light"
  compact?: boolean
}) {
  return (
    <ul className={clsx("grid gap-2", !compact && "sm:grid-cols-2")}>
      {results.map((r) => (
        <li key={r.slug}>
          <Link
            href={`/products/${r.slug}/`}
            onClick={onPick}
            className={clsx(
              "flex items-center gap-4 p-2 transition-colors",
              tone === "dark" ? "hover:bg-white/5 focus-visible:bg-white/5" : "hover:bg-brand-stone focus-visible:bg-brand-stone"
            )}
          >
            <span className="h-20 w-16 shrink-0 overflow-hidden bg-brand-stone">
              {r.image && <img src={r.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.name}</span>
              {r.category && <span className={clsx("font-hud mt-1 block truncate text-[10px]", tone === "dark" ? "text-brand-bone/50" : "text-brand-olive")}>{r.category}</span>}
              <span className="font-hud mt-1 block text-xs tracking-normal">
                {price(r.priceBdt)}
                {r.soldOut && <span className="ml-2 text-[10px] tracking-wider opacity-60">Sold out</span>}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
