/**
 * Filtering and sorting for shop, category and collection pages. Pure and
 * free of heavy imports so it can run in the browser on data already in the
 * page. Import from "@dtc/catalogue-core/listing" in client components.
 */

export const LISTING_SORTS = ["featured", "newest", "price-asc", "price-desc"] as const
export type ListingSort = (typeof LISTING_SORTS)[number]

export const LISTING_SORT_LABELS: Record<ListingSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
}

/** The fields filtering and sorting need. `CatalogueProduct` satisfies it. */
export interface ListingProduct {
  priceBdt: number
  isFeatured: boolean
  soldOut: boolean
  createdAt: string
  sizes: string[]
  soldOutSizes: string[]
  colors: { name: string; hex: string; inStock: boolean }[]
  category: { trail: string[] } | null
}

export interface ListingFilters {
  /** Category ids. A product matches when its category or any parent is listed. */
  categoryIds?: string[]
  /** Color names, compared case-insensitively. */
  colors?: string[]
  /** Sizes that must be available (not sold out). */
  sizes?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  inStockOnly?: boolean
}

export const colorKey = (name: string) => name.trim().toLowerCase()

const SIZE_RANK = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]

/** Orders sizes XS, S, M, L, XL..., then anything else naturally. */
export function compareSizes(a: string, b: string): number {
  const rank = (s: string) => {
    const i = SIZE_RANK.indexOf(s.toUpperCase())
    return i === -1 ? 100 : i
  }
  return rank(a) - rank(b) || a.localeCompare(b, undefined, { numeric: true })
}

const hasValues = (list: string[] | undefined): list is string[] => Boolean(list && list.length > 0)

export function filterProducts<T extends ListingProduct>(products: T[], filters: ListingFilters): T[] {
  const colors = hasValues(filters.colors) ? new Set(filters.colors.map(colorKey)) : null
  const sizes = hasValues(filters.sizes) ? new Set(filters.sizes.map((s) => s.toUpperCase())) : null
  const categories = hasValues(filters.categoryIds) ? new Set(filters.categoryIds) : null
  const min = typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice) ? filters.minPrice : null
  const max = typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice) ? filters.maxPrice : null

  return products.filter((p) => {
    if (categories && !(p.category?.trail ?? []).some((id) => categories.has(id))) return false
    if (colors && !p.colors.some((c) => colors.has(colorKey(c.name)))) return false
    if (sizes) {
      const available = p.sizes.filter((s) => !p.soldOutSizes.includes(s)).map((s) => s.toUpperCase())
      if (!available.some((s) => sizes.has(s))) return false
    }
    if (min !== null && p.priceBdt < min) return false
    if (max !== null && p.priceBdt > max) return false
    if (filters.inStockOnly && p.soldOut) return false
    return true
  })
}

/**
 * Sorts a copy. Sold-out products always go last. Equal items keep their
 * admin order, so "featured" is featured products first, then admin order.
 */
export function sortProducts<T extends ListingProduct>(products: T[], sort: ListingSort): T[] {
  const time = (p: T) => Date.parse(p.createdAt) || 0
  const compare: Record<ListingSort, (a: T, b: T) => number> = {
    featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
    newest: (a, b) => time(b) - time(a),
    "price-asc": (a, b) => a.priceBdt - b.priceBdt,
    "price-desc": (a, b) => b.priceBdt - a.priceBdt,
  }
  return products
    .map((item, index) => ({ item, index }))
    .sort((a, b) => Number(a.item.soldOut) - Number(b.item.soldOut) || compare[sort](a.item, b.item) || a.index - b.index)
    .map((entry) => entry.item)
}

export function applyListing<T extends ListingProduct>(products: T[], filters: ListingFilters, sort: ListingSort): T[] {
  return sortProducts(filterProducts(products, filters), sort)
}

export interface ListingFacets {
  colors: { key: string; name: string; hex: string; count: number }[]
  sizes: { size: string; count: number }[]
  /** Null when there are no products. */
  price: { min: number; max: number } | null
  inStockCount: number
}

/**
 * The filter options a set of products offers, with product counts. A facet
 * with a single value is not worth showing; the page decides that.
 */
export function listingFacets(products: ListingProduct[]): ListingFacets {
  const colors = new Map<string, { key: string; name: string; hex: string; count: number }>()
  const sizes = new Map<string, { size: string; count: number }>()
  for (const p of products) {
    for (const key of new Set(p.colors.map((c) => colorKey(c.name)))) {
      const color = p.colors.find((c) => colorKey(c.name) === key)
      if (!color || !key) continue
      const entry = colors.get(key) ?? { key, name: color.name.trim(), hex: color.hex, count: 0 }
      entry.count++
      colors.set(key, entry)
    }
    for (const size of new Set(p.sizes.filter((s) => !p.soldOutSizes.includes(s)).map((s) => s.toUpperCase()))) {
      const entry = sizes.get(size) ?? { size, count: 0 }
      entry.count++
      sizes.set(size, entry)
    }
  }
  const prices = products.map((p) => p.priceBdt)
  return {
    colors: [...colors.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    sizes: [...sizes.values()].sort((a, b) => compareSizes(a.size, b.size)),
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    inStockCount: products.filter((p) => !p.soldOut).length,
  }
}
