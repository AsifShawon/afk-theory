/**
 * Catalogue domain types.
 *
 * "Row" types mirror the Supabase tables one to one (snake_case columns).
 * The camelCase types are the ready-to-render catalogue that the public site
 * builds from those rows at build time.
 */

export const IMAGE_ROLES = ["front", "back", "model", "detail"] as const
export type ImageRole = (typeof IMAGE_ROLES)[number]

export const PRODUCT_STATUSES = ["draft", "published"] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export interface ProductDetails {
  fabric?: string
  gsm?: string
  fit?: string
  care?: string
  origin?: string
}

export interface SizeChart {
  /** Column headings, for example ["Chest", "Length", "Sleeve"]. */
  columns: string[]
  /** One row per size. `values` lines up with `columns`. */
  rows: { size: string; values: string[] }[]
  /** Unit shown under the table, for example "inches". */
  unit?: string
}

export interface DeliveryZone {
  name: string
  area: string
  feeBdt: number
  eta: string
}

export interface FaqItem {
  question: string
  answer: string
}

/* ----------------------------- database rows ----------------------------- */

export interface CategoryRow {
  id: string
  slug: string
  name: string
  sort_order: number
}

export interface ProductRow {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  price_bdt: number
  compare_at_bdt: number | null
  category_id: string | null
  status: ProductStatus
  is_featured: boolean
  sort_order: number
  sizes: string[]
  sold_out_sizes: string[]
  details: ProductDetails
  size_chart: SizeChart
  created_at: string
  updated_at: string
}

export interface ProductColorRow {
  id: string
  product_id: string
  name: string
  hex: string
  in_stock: boolean
  sort_order: number
}

export interface ProductImageRow {
  id: string
  product_id: string
  color_id: string | null
  /** Storage path without the width suffix, for example "products/<product>/<image>". */
  path: string
  /** Widths that exist in storage, stored as `${path}-${width}.webp`. */
  widths: number[]
  width: number
  height: number
  alt: string
  role: ImageRole
  sort_order: number
}

export interface SiteSettingsRow {
  id: number
  whatsapp_number: string
  messenger_page: string
  instagram_handle: string
  hero_title: string
  hero_subtitle: string
  announcement: string
  delivery_zones: DeliveryZone[]
  faq: FaqItem[]
  published_at: string | null
  updated_at: string
}

export interface RawCatalogue {
  categories: CategoryRow[]
  products: ProductRow[]
  colors: ProductColorRow[]
  images: ProductImageRow[]
  settings: SiteSettingsRow | null
}

/* ---------------------------- render-ready model ---------------------------- */

export interface ImageSource {
  width: number
  src: string
}

export interface CatalogueImage {
  id: string
  colorId: string | null
  role: ImageRole
  alt: string
  width: number
  height: number
  /** Sorted smallest first. */
  sources: ImageSource[]
}

export interface CatalogueColor {
  id: string
  name: string
  hex: string
  inStock: boolean
}

export interface CatalogueCategory {
  id: string
  slug: string
  name: string
}

export interface CatalogueProduct {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  priceBdt: number
  compareAtBdt: number | null
  category: CatalogueCategory | null
  isFeatured: boolean
  sizes: string[]
  soldOutSizes: string[]
  details: ProductDetails
  sizeChart: SizeChart
  colors: CatalogueColor[]
  images: CatalogueImage[]
  /** True when no color is in stock or every size is sold out. */
  soldOut: boolean
}

export interface SiteSettings {
  whatsappNumber: string
  messengerPage: string
  instagramHandle: string
  heroTitle: string
  heroSubtitle: string
  announcement: string
  deliveryZones: DeliveryZone[]
  faq: FaqItem[]
}

export interface Catalogue {
  generatedAt: string
  source: "supabase" | "fixture"
  settings: SiteSettings
  categories: CatalogueCategory[]
  products: CatalogueProduct[]
}
