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

/** Badge picked in the admin. Sale and sold out are worked out automatically. */
export const PRODUCT_BADGE_SETTINGS = ["none", "new", "bestseller"] as const
export type ProductBadgeSetting = (typeof PRODUCT_BADGE_SETTINGS)[number]

/** Badges shown on the site, in display priority. */
export const PRODUCT_BADGES = ["sold-out", "sale", "new", "bestseller"] as const
export type ProductBadge = (typeof PRODUCT_BADGES)[number]

/** Homepage sections whose order and visibility the admin controls. */
export const HOME_SECTION_IDS = [
  "categories",
  "new-arrivals",
  "bestsellers",
  "shop-teaser",
  "collection-spotlight",
  "lookbook",
  "trust",
  "how-to-order",
  "faq",
] as const
export type HomeSectionId = (typeof HOME_SECTION_IDS)[number]

export interface HomeSection {
  id: HomeSectionId
  enabled: boolean
}

/** Content pages edited in the admin. */
export const SITE_PAGE_SLUGS = ["about", "delivery-returns", "contact", "privacy", "terms"] as const
export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number]

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
  /** Shown under the table, for example "Measured flat across the chest". */
  note?: string
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

/**
 * Columns after `sort_order` arrive with migration 20261122000000 and are
 * missing until it runs, so they are optional here.
 */
export interface CategoryRow {
  id: string
  slug: string
  name: string
  sort_order: number
  parent_id?: string | null
  /** Plain text shown on the category page. */
  description?: string
  /** Storage path without the width suffix, like product images. */
  image_path?: string | null
  image_widths?: number[]
  image_width?: number | null
  image_height?: number | null
  show_in_menu?: boolean
  seo_title?: string
  seo_description?: string
  updated_at?: string
}

export interface CollectionRow {
  id: string
  slug: string
  name: string
  /** Plain text shown on the collection page. */
  description: string
  image_path: string | null
  image_widths: number[]
  image_width: number | null
  image_height: number | null
  show_on_home: boolean
  sort_order: number
  seo_title: string
  seo_description: string
  created_at: string
  updated_at: string
}

export interface ProductCollectionRow {
  product_id: string
  collection_id: string
  sort_order: number
}

/** Products picked for a category's mega menu panel. At most 2 per category. */
export interface CategoryMenuProductRow {
  category_id: string
  product_id: string
  sort_order: number
}

/** Optional second option next to color, for example "Front design". */
export interface ProductDesignRow {
  id: string
  product_id: string
  name: string
  in_stock: boolean
  sort_order: number
}

export interface SitePageRow {
  id: string
  slug: string
  title: string
  html: string
  seo_title: string
  seo_description: string
  created_at: string
  updated_at: string
}

/** Custom garment example uploaded for the /custom-design/ showcase. */
export interface CustomDesignRow {
  id: string
  title: string
  garment_type: string
  status: ProductStatus
  is_featured: boolean
  sort_order: number
  image_path: string | null
  image_widths: number[]
  image_width: number | null
  image_height: number | null
  image_alt: string
  detail_image_path: string | null
  detail_image_widths: number[]
  detail_image_width: number | null
  detail_image_height: number | null
  detail_image_alt: string
  created_at: string
  updated_at: string
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
  /** Used when no shared size guide is linked. */
  size_chart: SizeChart
  /** Shared size guide. Columns arrive with migration 20261121000000. */
  size_guide_id?: string | null
  seo_title?: string
  seo_description?: string
  /** Columns from migration 20261122000000. */
  badge?: ProductBadgeSetting
  design_group?: string
  /** Column from migration 20261124000000. */
  meta_content_id?: string | null
  created_at: string
  updated_at: string
}

export interface SizeGuideRow {
  id: string
  name: string
  unit: string
  columns: string[]
  rows: { size: string; values: string[] }[]
  note: string
  sort_order: number
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
  /** Column from migration 20261122000000. */
  design_id?: string | null
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
  /** Column from migration 20261122000000. */
  home_sections?: { id: string; enabled: boolean }[]
  published_at: string | null
  updated_at: string
}

export interface RawCatalogue {
  categories: CategoryRow[]
  products: ProductRow[]
  colors: ProductColorRow[]
  images: ProductImageRow[]
  sizeGuides: SizeGuideRow[]
  settings: SiteSettingsRow | null
  collections: CollectionRow[]
  productCollections: ProductCollectionRow[]
  menuProducts: CategoryMenuProductRow[]
  designs: ProductDesignRow[]
  pages: SitePageRow[]
  customDesigns?: CustomDesignRow[]
}

/* ---------------------------- render-ready model ---------------------------- */

export interface ImageSource {
  width: number
  src: string
}

export interface CatalogueImage {
  id: string
  colorId: string | null
  /** Design this photo shows, or null when it applies to every design. */
  designId: string | null
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

export interface CatalogueDesign {
  id: string
  name: string
  inStock: boolean
}

export interface CatalogueCategory {
  id: string
  slug: string
  name: string
  parentId: string | null
  /** Category ids from the top-level category down to this one. */
  trail: string[]
  /** Site path, for example "/c/tees/drop-shoulder/". */
  href: string
}

export interface CatalogueCategoryNode extends CatalogueCategory {
  /** Names from the top-level category down to this one. */
  trailNames: string[]
  depth: number
  description: string
  image: CatalogueImage | null
  showInMenu: boolean
  seoTitle: string
  seoDescription: string
  /** Published products in this category and every subcategory. */
  productCount: number
  /** Only subcategories that hold products. */
  children: CatalogueCategoryNode[]
}

export interface CatalogueCollection {
  id: string
  slug: string
  name: string
  description: string
  image: CatalogueImage | null
  showOnHome: boolean
  seoTitle: string
  seoDescription: string
  /** "/collections/drop-01/" */
  href: string
  /** In the order set in the admin. */
  productSlugs: string[]
}

export interface CatalogueMenuLink {
  id: string
  name: string
  href: string
}

/** One top-level category in the mega menu. */
export interface CatalogueMenuItem extends CatalogueMenuLink {
  /** Subcategories that hold products and are shown in the menu. */
  children: CatalogueMenuLink[]
  /** 1-2 product slugs: the admin's picks, else the newest in the category. */
  productSlugs: string[]
}

export interface CataloguePage {
  slug: string
  title: string
  /** Sanitized HTML, safe to render. */
  html: string
  seoTitle: string
  seoDescription: string
  updatedAt: string
}

export interface CatalogueCustomDesign {
  id: string
  title: string
  garmentType: string
  isFeatured: boolean
  /** Full garment view. */
  image: CatalogueImage
  /** Optional back view or print close-up. */
  detailImage: CatalogueImage | null
  updatedAt: string
}

/** Compact product entry for client-side search. */
export interface SearchIndexEntry {
  slug: string
  name: string
  /** Category names joined with " / ", for example "Tees / Drop shoulder". */
  category: string
  colors: string[]
  designs: string[]
  priceBdt: number
  soldOut: boolean
  /** Smallest width of the first image. */
  image: string | null
}

export interface CatalogueProduct {
  id: string
  slug: string
  name: string
  tagline: string
  /** Plain text of the description, for meta tags and structured data. */
  description: string
  /** Sanitized HTML of the description, safe to render. */
  descriptionHtml: string
  /** Search result title and description. Fall back to name and tagline when empty. */
  seoTitle: string
  seoDescription: string
  priceBdt: number
  compareAtBdt: number | null
  category: CatalogueCategory | null
  isFeatured: boolean
  sizes: string[]
  soldOutSizes: string[]
  details: ProductDetails
  /** The linked shared size guide, or the product's own chart. */
  sizeChart: SizeChart
  colors: CatalogueColor[]
  /** Empty for products that only have color options. */
  designs: CatalogueDesign[]
  images: CatalogueImage[]
  /** True when no color or design is in stock, or every size is sold out. */
  soldOut: boolean
  /** ISO time the product was created, for "newest" sorting. */
  createdAt: string
  /** Picked "new" in the admin, or created in the last 30 days. */
  isNew: boolean
  /** In display priority. */
  badges: ProductBadge[]
  collectionSlugs: string[]
  /** Slugs of other products in the same design group. */
  moreDesigns: string[]
  /** Meta Commerce Manager catalog retailer_id for pixel events. Null if unmapped. */
  metaContentId: string | null
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
  /** Categories that directly hold published products, in admin order. */
  categories: CatalogueCategory[]
  /** Top-level categories with products somewhere below them. */
  categoryTree: CatalogueCategoryNode[]
  products: CatalogueProduct[]
  collections: CatalogueCollection[]
  /** Automatic lists of product slugs: newest first, and products on sale. */
  autoCollections: { new: string[]; sale: string[] }
  menu: CatalogueMenuItem[]
  pages: CataloguePage[]
  customDesigns: CatalogueCustomDesign[]
  homeSections: HomeSection[]
  searchIndex: SearchIndexEntry[]
}
