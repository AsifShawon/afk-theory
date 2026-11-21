"use client"

// Plain navigation here: a page transition would be cut short as the overlay unlocks scrolling.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { clsx } from "clsx"
import type { SearchIndexEntry } from "@dtc/catalogue-core"
import { searchCatalogue } from "@dtc/catalogue-core/search"
import { useNavUI } from "@/components/layout/nav-ui"
import { CloseIcon, SearchIcon } from "@/components/ui/icons"
import { SearchResults } from "./search-results"

/**
 * Instant search over the prebuilt index. Full screen on phones, a panel
 * under the header on desktop. Enter opens the full results page.
 */
export function SearchOverlay({ index, suggestions }: { index: SearchIndexEntry[]; suggestions: { name: string; href: string }[] }) {
  const { searchOpen, setSearchOpen } = useNavUI()
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!searchOpen) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("keydown", onKey)
    }
  }, [searchOpen, setSearchOpen])

  const results = useMemo(() => (query.trim() ? searchCatalogue(index, query, 8) : []), [index, query])
  const close = () => setSearchOpen(false)

  return (
    <div className={clsx("fixed inset-0 z-[60]", searchOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!searchOpen}>
      <div onClick={close} className={clsx("absolute inset-0 bg-black/60 transition-opacity duration-300", searchOpen ? "opacity-100" : "opacity-0")} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        inert={!searchOpen}
        className={clsx(
          "absolute inset-x-0 top-0 flex max-h-full flex-col bg-brand-graphite-dark text-brand-bone transition-[transform,opacity] duration-500 ease-out-expo max-lg:bottom-0",
          searchOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (!query.trim()) return
            close()
            router.push(`/search/?q=${encodeURIComponent(query.trim())}`)
          }}
          className="mx-auto flex w-full max-w-editorial items-center gap-3 border-b border-white/10 px-5 py-4 md:px-10"
        >
          <SearchIcon size={22} className="shrink-0 text-brand-accent" />
          <label htmlFor="search-overlay-input" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="search-overlay-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tees, hoodies, colors..."
            autoComplete="off"
            enterKeyHint="search"
            className="display h-12 min-w-0 flex-1 bg-transparent text-2xl placeholder:text-brand-bone/25 focus:outline-none md:text-4xl"
          />
          <button type="button" onClick={close} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center">
            <CloseIcon />
          </button>
        </form>

        <div className="mx-auto w-full max-w-editorial flex-1 overflow-y-auto px-5 py-6 md:px-10 lg:max-h-[60vh]" data-lenis-prevent>
          {query.trim() ? (
            results.length > 0 ? (
              <>
                <SearchResults results={results} onPick={close} />
                <Link
                  href={`/search/?q=${encodeURIComponent(query.trim())}`}
                  onClick={close}
                  className="font-hud mt-6 inline-block text-[11px] text-brand-accent underline underline-offset-4"
                >
                  See all results
                </Link>
              </>
            ) : (
              <p className="text-brand-bone/60">No products match &quot;{query.trim()}&quot;. Try a category below.</p>
            )
          ) : (
            <p className="font-hud text-[10px] text-brand-bone/50">Browse</p>
          )}
          {(!query.trim() || results.length === 0) && suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Link key={s.href} href={s.href} onClick={close} className="font-hud border border-white/15 px-4 py-2.5 text-[11px] hover:border-brand-accent">
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
