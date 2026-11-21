"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { clsx } from "clsx"
import { formatBdt, type CatalogueProduct } from "@dtc/catalogue-core"
import {
  applyListing,
  LISTING_SORT_LABELS,
  LISTING_SORTS,
  listingFacets,
  type ListingFilters,
  type ListingSort,
} from "@dtc/catalogue-core/listing"
import { useLenis } from "@/components/motion/smooth-scroll"
import { ProductCard } from "@/components/product/product-card"
import { CloseIcon } from "@/components/ui/icons"

export interface ListingCategoryOption {
  id: string
  name: string
  /** URL value, the category's own slug. */
  slug: string
}

interface State {
  sort: ListingSort
  categories: string[]
  colors: string[]
  sizes: string[]
  min: number | null
  max: number | null
  inStock: boolean
}

const EMPTY: State = { sort: "featured", categories: [], colors: [], sizes: [], min: null, max: null, inStock: false }

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : [])
const num = (value: string | null) => {
  const n = value ? Number(value) : NaN
  return Number.isFinite(n) && n >= 0 ? n : null
}

function readUrl(): State {
  const p = new URLSearchParams(window.location.search)
  const sort = p.get("sort")
  return {
    sort: (LISTING_SORTS as readonly string[]).includes(sort ?? "") ? (sort as ListingSort) : "featured",
    categories: list(p.get("category")),
    colors: list(p.get("color")),
    sizes: list(p.get("size")).map((s) => s.toUpperCase()),
    min: num(p.get("min")),
    max: num(p.get("max")),
    inStock: p.get("stock") === "1",
  }
}

function writeUrl(state: State) {
  const url = new URL(window.location.href)
  const set = (key: string, value: string | null) => (value ? url.searchParams.set(key, value) : url.searchParams.delete(key))
  set("sort", state.sort === "featured" ? null : state.sort)
  set("category", state.categories.join(",") || null)
  set("color", state.colors.join(",") || null)
  set("size", state.sizes.join(",") || null)
  set("min", state.min !== null ? String(state.min) : null)
  set("max", state.max !== null ? String(state.max) : null)
  set("stock", state.inStock ? "1" : null)
  window.history.replaceState(window.history.state, "", url)
}

const toggle = (values: string[], value: string) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value])

/**
 * Product grid with filters and sorting. Runs in the browser on products
 * already in the page; the filter state lives in the URL so a view can be
 * shared. The static HTML shows every product, so search engines see all.
 */
export function ProductListing({
  products,
  categoryOptions = [],
  emptyText = "No products here yet. New pieces are on the way.",
}: {
  products: CatalogueProduct[]
  categoryOptions?: ListingCategoryOption[]
  emptyText?: string
}) {
  const [state, setState] = useState<State>(EMPTY)
  const [sheetOpen, setSheetOpen] = useState(false)
  const lenis = useLenis()

  useEffect(() => setState(readUrl()), [])

  const update = useCallback((patch: Partial<State>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      writeUrl(next)
      return next
    })
  }, [])

  const facets = useMemo(() => listingFacets(products), [products])
  const categoryIdBySlug = useMemo(() => new Map(categoryOptions.map((c) => [c.slug, c.id])), [categoryOptions])

  const shown = useMemo(() => {
    const filters: ListingFilters = {
      categoryIds: state.categories.map((slug) => categoryIdBySlug.get(slug)).filter((id): id is string => Boolean(id)),
      colors: state.colors,
      sizes: state.sizes,
      minPrice: state.min,
      maxPrice: state.max,
      inStockOnly: state.inStock,
    }
    return applyListing(products, filters, state.sort)
  }, [products, state, categoryIdBySlug])

  const showCategories = categoryOptions.length > 1
  const showColors = facets.colors.length > 1
  const showSizes = facets.sizes.length > 1
  const showPrice = Boolean(facets.price && facets.price.min < facets.price.max)
  const showStock = facets.inStockCount > 0 && facets.inStockCount < products.length
  const hasFacets = showCategories || showColors || showSizes || showPrice || showStock

  const activeCount =
    state.categories.length + state.colors.length + state.sizes.length + (state.min !== null || state.max !== null ? 1 : 0) + (state.inStock ? 1 : 0)
  const clearAll = () => update({ ...EMPTY, sort: state.sort })

  useEffect(() => {
    if (!sheetOpen) return
    lenis?.stop()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      lenis?.start()
      window.removeEventListener("keydown", onKey)
    }
  }, [sheetOpen, lenis])

  const facetPanel = (
    <div className="space-y-8">
      {showCategories && (
        <FacetGroup title="Category">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <Chip key={c.id} active={state.categories.includes(c.slug)} onClick={() => update({ categories: toggle(state.categories, c.slug) })}>
                {c.name}
              </Chip>
            ))}
          </div>
        </FacetGroup>
      )}
      {showColors && (
        <FacetGroup title="Color">
          <div className="grid grid-cols-1 gap-1">
            {facets.colors.map((c) => {
              const active = state.colors.includes(c.key)
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => update({ colors: toggle(state.colors, c.key) })}
                  aria-pressed={active}
                  className="flex min-h-[40px] items-center gap-3 text-left text-sm"
                >
                  <span className={clsx("h-6 w-6 shrink-0 border-2", active ? "border-brand-graphite" : "border-black/10")} style={{ backgroundColor: c.hex }} />
                  <span className={clsx("flex-1", active && "font-semibold")}>{c.name}</span>
                  <span className="font-hud text-[10px] text-brand-olive">{c.count}</span>
                </button>
              )
            })}
          </div>
        </FacetGroup>
      )}
      {showSizes && (
        <FacetGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <Chip key={s.size} active={state.sizes.includes(s.size)} onClick={() => update({ sizes: toggle(state.sizes, s.size) })}>
                {s.size}
              </Chip>
            ))}
          </div>
        </FacetGroup>
      )}
      {showPrice && facets.price && (
        <FacetGroup title="Price">
          <div className="flex items-center gap-2">
            <PriceInput label="Minimum price" placeholder={String(facets.price.min)} value={state.min} onChange={(min) => update({ min })} />
            <span className="text-brand-olive">to</span>
            <PriceInput label="Maximum price" placeholder={String(facets.price.max)} value={state.max} onChange={(max) => update({ max })} />
          </div>
          <p className="mt-2 text-xs text-brand-olive">
            From {formatBdt(facets.price.min)} to {formatBdt(facets.price.max)}
          </p>
        </FacetGroup>
      )}
      {showStock && (
        <FacetGroup title="Availability">
          <label className="flex min-h-[40px] cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={state.inStock} onChange={(e) => update({ inStock: e.target.checked })} className="h-5 w-5 accent-brand-graphite" />
            In stock only <span className="font-hud text-[10px] text-brand-olive">{facets.inStockCount}</span>
          </label>
        </FacetGroup>
      )}
    </div>
  )

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-brand-graphite/15 py-3">
        <div className="flex items-center gap-4">
          {hasFacets && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="font-hud flex h-10 items-center gap-2 border border-brand-graphite/20 px-4 text-[11px] hover:border-brand-graphite lg:hidden"
            >
              Filters{activeCount > 0 && <span className="bg-brand-graphite px-1.5 text-[10px] tracking-normal text-brand-bone">{activeCount}</span>}
            </button>
          )}
          <p className="font-hud text-[11px] text-brand-olive" aria-live="polite">
            {shown.length} {shown.length === 1 ? "product" : "products"}
          </p>
        </div>
        <label className="font-hud flex items-center gap-2 text-[11px] text-brand-olive">
          Sort
          <select
            value={state.sort}
            onChange={(e) => update({ sort: e.target.value as ListingSort })}
            className="h-10 border border-brand-graphite/20 bg-transparent px-3 text-[11px] text-brand-graphite focus:border-brand-graphite focus:outline-none"
          >
            {LISTING_SORTS.map((s) => (
              <option key={s} value={s}>
                {LISTING_SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {state.categories.map((slug) => (
            <ActiveChip key={`c-${slug}`} label={categoryOptions.find((c) => c.slug === slug)?.name ?? slug} onRemove={() => update({ categories: state.categories.filter((v) => v !== slug) })} />
          ))}
          {state.colors.map((key) => (
            <ActiveChip key={`k-${key}`} label={facets.colors.find((c) => c.key === key)?.name ?? key} onRemove={() => update({ colors: state.colors.filter((v) => v !== key) })} />
          ))}
          {state.sizes.map((size) => (
            <ActiveChip key={`s-${size}`} label={`Size ${size}`} onRemove={() => update({ sizes: state.sizes.filter((v) => v !== size) })} />
          ))}
          {(state.min !== null || state.max !== null) && (
            <ActiveChip
              label={`${state.min !== null ? formatBdt(state.min) : "Any"} to ${state.max !== null ? formatBdt(state.max) : "any"}`}
              onRemove={() => update({ min: null, max: null })}
            />
          )}
          {state.inStock && <ActiveChip label="In stock" onRemove={() => update({ inStock: false })} />}
          <button type="button" onClick={clearAll} className="font-hud ml-1 text-[11px] underline underline-offset-4">
            Clear all
          </button>
        </div>
      )}

      <div className={clsx("mt-8 grid gap-10", hasFacets && "lg:grid-cols-[220px_minmax(0,1fr)]")}>
        {hasFacets && <aside className="hidden lg:block" aria-label="Filters">{facetPanel}</aside>}

        <div>
          {shown.length === 0 ? (
            <div className="border border-brand-graphite/15 p-10 text-center">
              <p className="display text-2xl">{products.length === 0 ? "Coming soon" : "Nothing matches"}</p>
              <p className="mt-2 text-sm text-brand-olive">{products.length === 0 ? emptyText : "Try removing a filter."}</p>
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className="btn-outline mt-6 h-12">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className={clsx("grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6", hasFacets ? "xl:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-4")}>
              {shown.map((product) => (
                <li key={product.id} className="animate-fade-in">
                  <ProductCard product={product} sizes="(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 50vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Phones: filters in a bottom sheet. */}
      {hasFacets && (
        <div className={clsx("fixed inset-0 z-50 lg:hidden", sheetOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!sheetOpen}>
          <div onClick={() => setSheetOpen(false)} className={clsx("absolute inset-0 bg-black/50 transition-opacity duration-300", sheetOpen ? "opacity-100" : "opacity-0")} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            inert={!sheetOpen}
            className={clsx(
              "absolute inset-x-0 bottom-0 flex max-h-[85svh] flex-col bg-brand-bone text-brand-graphite transition-transform duration-500 ease-out-expo",
              sheetOpen ? "translate-y-0" : "translate-y-full"
            )}
          >
            <div className="flex items-center justify-between border-b border-brand-graphite/10 px-5 py-4">
              <p className="display text-2xl">Filters</p>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className="p-2">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6" data-lenis-prevent>
              {facetPanel}
            </div>
            <div className="flex gap-3 border-t border-brand-graphite/10 px-5 py-4">
              <button type="button" onClick={clearAll} className="btn-outline h-12 flex-1 px-4">
                Clear
              </button>
              <button type="button" onClick={() => setSheetOpen(false)} className="btn-signal h-12 flex-[2] px-4">
                Show {shown.length} {shown.length === 1 ? "product" : "products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="font-hud mb-3 text-[11px] text-brand-olive">{title}</legend>
      {children}
    </fieldset>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "font-hud min-h-[40px] min-w-[44px] border px-3 text-[11px] transition-colors",
        active ? "border-brand-graphite bg-brand-graphite text-brand-bone" : "border-brand-graphite/20 hover:border-brand-graphite"
      )}
    >
      {children}
    </button>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="font-hud flex h-8 items-center gap-2 bg-brand-graphite px-3 text-[10px] text-brand-bone hover:bg-brand-graphite-light"
      aria-label={`Remove filter ${label}`}
    >
      {label}
      <CloseIcon size={12} />
    </button>
  )
}

function PriceInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={label}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
      className="h-10 w-full border border-brand-graphite/20 bg-white px-3 text-sm focus:border-brand-graphite focus:outline-none"
    />
  )
}

