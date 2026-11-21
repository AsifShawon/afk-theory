"use client"

import { Link } from "next-view-transitions"
import { useEffect, useMemo, useState } from "react"
import type { SearchIndexEntry } from "@dtc/catalogue-core"
import { searchCatalogue } from "@dtc/catalogue-core/search"
import { SearchResults } from "./search-results"

/** Full search results for /search/?q=..., run in the browser. */
export function SearchPage({ index, suggestions }: { index: SearchIndexEntry[]; suggestions: { name: string; href: string }[] }) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "")
  }, [])

  const results = useMemo(() => (query.trim() ? searchCatalogue(index, query, 48) : []), [index, query])

  const change = (value: string) => {
    setQuery(value)
    const url = new URL(window.location.href)
    if (value.trim()) url.searchParams.set("q", value)
    else url.searchParams.delete("q")
    window.history.replaceState(window.history.state, "", url)
  }

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search-page-input" className="sr-only">
          Search products
        </label>
        <input
          id="search-page-input"
          type="search"
          value={query}
          onChange={(e) => change(e.target.value)}
          placeholder="Search tees, hoodies, colors..."
          autoComplete="off"
          className="display h-16 w-full border-b-2 border-brand-graphite bg-transparent text-3xl placeholder:text-brand-graphite/25 focus:outline-none md:text-5xl"
        />
      </form>
      <p className="font-hud mt-4 text-[11px] text-brand-olive" aria-live="polite">
        {query.trim() ? `${results.length} ${results.length === 1 ? "result" : "results"} for "${query.trim()}"` : "Type to search"}
      </p>
      <div className="mt-8">
        {results.length > 0 ? (
          <SearchResults results={results} tone="light" />
        ) : (
          query.trim() &&
          suggestions.length > 0 && (
            <div>
              <p className="text-brand-olive">No products match. Try a category:</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Link key={s.href} href={s.href} className="font-hud border border-brand-graphite/20 px-4 py-2.5 text-[11px] hover:border-brand-graphite">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
