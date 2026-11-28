import "server-only"
import {
  buildCategoryTree,
  flattenTree,
  isMissingTable,
  normalizeHomeSections,
  settingsFromRow,
  type SizeGuideRow,
  TABLES,
  type CategoryMenuProductRow,
  type CategoryRow,
  type CollectionRow,
  type CustomDesignRow,
  type HomeSection,
  type ProductCollectionRow,
  type ProductColorRow,
  type ProductDesignRow,
  type ProductImageRow,
  type ProductRow,
  type SitePageRow,
  type SiteSettings,
  type SiteSettingsRow,
} from "@dtc/catalogue-core"
import { publicImageUrl } from "./supabase"
import { getAdmin } from "./supabase-server"
import { storeStructureReady } from "./store-structure"

export interface AdminImage extends ProductImageRow {
  thumbUrl: string
}

export interface ProductListItem {
  id: string
  name: string
  slug: string
  status: ProductRow["status"]
  isFeatured: boolean
  priceBdt: number
  categoryName: string | null
  imageCount: number
  thumbUrl: string | null
}

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data as T
}

function thumbFor(image: ProductImageRow): string {
  const { env } = getAdmin()
  return publicImageUrl(env, image.path, image.widths[0])
}

export async function loadProductList(): Promise<ProductListItem[]> {
  const { client } = getAdmin()
  const [products, images, categories] = await Promise.all([
    client.from(TABLES.products).select("*").order("sort_order"),
    client.from(TABLES.images).select("*").order("sort_order"),
    client.from(TABLES.categories).select("*"),
  ])
  const imageRows = check(images) as ProductImageRow[]
  const categoryNames = categoryPathNames(check(categories) as CategoryRow[])

  return (check(products) as ProductRow[]).map((p) => {
    const own = imageRows.filter((i) => i.product_id === p.id)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      isFeatured: p.is_featured,
      priceBdt: p.price_bdt,
      categoryName: (p.category_id && categoryNames.get(p.category_id)) || null,
      imageCount: own.length,
      thumbUrl: own[0] ? thumbFor(own[0]) : null,
    }
  })
}

export async function loadProduct(id: string) {
  const { client } = getAdmin()
  const [product, colors, images] = await Promise.all([
    client.from(TABLES.products).select("*").eq("id", id).maybeSingle(),
    client.from(TABLES.colors).select("*").eq("product_id", id).order("sort_order"),
    client.from(TABLES.images).select("*").eq("product_id", id).order("sort_order"),
  ])
  const row = check(product) as ProductRow | null
  if (!row) {
    return null
  }
  return {
    product: row,
    colors: check(colors) as ProductColorRow[],
    images: (check(images) as ProductImageRow[]).map((img) => ({ ...img, thumbUrl: thumbFor(img) })),
  }
}

export interface SizeGuidesState {
  guides: SizeGuideRow[]
  /** Product count per guide id. */
  usage: Record<string, number>
  /** True until migration 20261121000000 has been run. */
  migrationMissing: boolean
}

export async function loadSizeGuides(): Promise<SizeGuidesState> {
  const { client } = getAdmin()
  const guides = await client.from(TABLES.sizeGuides).select("*").order("sort_order")
  if (guides.error) {
    if (isMissingTable(guides.error)) {
      return { guides: [], usage: {}, migrationMissing: true }
    }
    throw new Error(guides.error.message)
  }
  const products = await client.from(TABLES.products).select("size_guide_id")
  const usage: Record<string, number> = {}
  for (const p of (products.data ?? []) as { size_guide_id: string | null }[]) {
    if (p.size_guide_id) usage[p.size_guide_id] = (usage[p.size_guide_id] ?? 0) + 1
  }
  return { guides: guides.data as SizeGuideRow[], usage, migrationMissing: false }
}

export interface ColorPreset {
  name: string
  hex: string
  /** How many products use this color, for ordering. */
  uses: number
}

/**
 * Every color already saved on any product, one entry per name (the most
 * used hex wins), most used first. Powers quick-add on the product form.
 */
export async function loadColorPresets(): Promise<ColorPreset[]> {
  const { client } = getAdmin()
  const rows = check(await client.from(TABLES.colors).select("name, hex")) as { name: string; hex: string }[]
  const byName = new Map<string, { name: string; hexes: Map<string, number>; uses: number }>()
  for (const row of rows) {
    const name = row.name.trim()
    if (!name) continue
    const key = name.toLowerCase()
    const entry = byName.get(key) ?? { name, hexes: new Map(), uses: 0 }
    const hex = row.hex.toUpperCase()
    entry.hexes.set(hex, (entry.hexes.get(hex) ?? 0) + 1)
    entry.uses++
    byName.set(key, entry)
  }
  return [...byName.values()]
    .map((e) => ({ name: e.name, uses: e.uses, hex: [...e.hexes.entries()].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
}

export async function loadCategories(): Promise<CategoryRow[]> {
  const { client } = getAdmin()
  return check(await client.from(TABLES.categories).select("*").order("sort_order")) as CategoryRow[]
}

/** "T-Shirts / Drop shoulder" for every category id. */
export function categoryPathNames(rows: CategoryRow[]): Map<string, string> {
  return new Map(flattenTree(buildCategoryTree(rows)).map((n) => [n.row.id, n.trailNames.join(" / ")]))
}

/* ------------------------------------------------------------ store structure */

/** A product as the pickers on the category and collection screens show it. */
export interface ProductOption {
  id: string
  name: string
  slug: string
  status: ProductRow["status"]
  categoryId: string | null
  createdAt: string
  thumbUrl: string | null
}

async function loadProductOptions(): Promise<ProductOption[]> {
  const { client } = getAdmin()
  const [products, images] = await Promise.all([
    client.from(TABLES.products).select("id, name, slug, status, category_id, created_at, sort_order").order("sort_order"),
    client.from(TABLES.images).select("*").order("sort_order"),
  ])
  const imageRows = check(images) as ProductImageRow[]
  return (check(products) as ProductRow[]).map((p) => {
    const first = imageRows.find((i) => i.product_id === p.id)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      categoryId: p.category_id,
      createdAt: p.created_at,
      thumbUrl: first ? thumbFor(first) : null,
    }
  })
}

function bannerUrl(row: { image_path?: string | null; image_widths?: number[] }): string | null {
  const { env } = getAdmin()
  const width = row.image_widths?.[0]
  return row.image_path && width ? publicImageUrl(env, row.image_path, width) : null
}

export interface CategoriesState {
  categories: (CategoryRow & { imageUrl: string | null })[]
  products: ProductOption[]
  /** Picked menu product ids per category, in order. */
  menuPicks: Record<string, string[]>
  /** True until migration 20261122000000 has been run. */
  migrationMissing: boolean
}

export async function loadCategoriesState(): Promise<CategoriesState> {
  const { client } = getAdmin()
  const [categories, products, ready] = await Promise.all([loadCategories(), loadProductOptions(), storeStructureReady(client)])
  const menuPicks: Record<string, string[]> = {}
  if (ready) {
    const picks = check(await client.from(TABLES.menuProducts).select("*").order("sort_order")) as CategoryMenuProductRow[]
    for (const pick of picks) {
      ;(menuPicks[pick.category_id] ??= []).push(pick.product_id)
    }
  }
  return {
    categories: categories.map((c) => ({ ...c, imageUrl: bannerUrl(c) })),
    products,
    menuPicks,
    migrationMissing: !ready,
  }
}

export interface CollectionsState {
  collections: (CollectionRow & { imageUrl: string | null; productIds: string[] })[]
  products: ProductOption[]
  migrationMissing: boolean
}

export async function loadCollectionsState(): Promise<CollectionsState> {
  const { client } = getAdmin()
  const [products, ready] = await Promise.all([loadProductOptions(), storeStructureReady(client)])
  if (!ready) {
    return { collections: [], products, migrationMissing: true }
  }
  const [collections, links] = await Promise.all([
    client.from(TABLES.collections).select("*").order("sort_order"),
    client.from(TABLES.productCollections).select("*").order("sort_order"),
  ])
  const linkRows = check(links) as ProductCollectionRow[]
  return {
    collections: (check(collections) as CollectionRow[]).map((c) => ({
      ...c,
      imageUrl: bannerUrl(c),
      productIds: linkRows.filter((l) => l.collection_id === c.id).map((l) => l.product_id),
    })),
    products,
    migrationMissing: false,
  }
}

/** Collections, designs and design groups for the product form. */
export interface ProductStoreOptions {
  available: boolean
  collections: { id: string; name: string }[]
  /** Existing design group names with the products in each. */
  designGroups: { name: string; products: string[] }[]
  designs: ProductDesignRow[]
  collectionIds: string[]
}

export async function loadProductStoreOptions(productId: string | null): Promise<ProductStoreOptions> {
  const { client } = getAdmin()
  if (!(await storeStructureReady(client))) {
    return { available: false, collections: [], designGroups: [], designs: [], collectionIds: [] }
  }
  const [collections, products, designs, links] = await Promise.all([
    client.from(TABLES.collections).select("id, name, sort_order").order("sort_order"),
    client.from(TABLES.products).select("id, name, design_group").neq("design_group", ""),
    productId ? client.from(TABLES.designs).select("*").eq("product_id", productId).order("sort_order") : Promise.resolve({ data: [], error: null }),
    productId ? client.from(TABLES.productCollections).select("*").eq("product_id", productId) : Promise.resolve({ data: [], error: null }),
  ])
  const groups = new Map<string, { name: string; products: string[] }>()
  for (const p of check(products) as Pick<ProductRow, "id" | "name" | "design_group">[]) {
    const name = (p.design_group ?? "").trim()
    if (!name) continue
    const key = name.toLowerCase()
    const group = groups.get(key) ?? { name, products: [] }
    if (p.id !== productId) group.products.push(p.name)
    groups.set(key, group)
  }
  return {
    available: true,
    collections: (check(collections) as Pick<CollectionRow, "id" | "name">[]).map((c) => ({ id: c.id, name: c.name })),
    designGroups: [...groups.values()].sort((a, b) => a.name.localeCompare(b.name)),
    designs: check(designs) as ProductDesignRow[],
    collectionIds: (check(links) as ProductCollectionRow[]).map((l) => l.collection_id),
  }
}

export interface PagesState {
  pages: SitePageRow[]
  migrationMissing: boolean
}

export async function loadPagesState(): Promise<PagesState> {
  const { client } = getAdmin()
  const pages = await client.from(TABLES.pages).select("*")
  if (pages.error) {
    if (isMissingTable(pages.error)) return { pages: [], migrationMissing: true }
    throw new Error(pages.error.message)
  }
  return { pages: pages.data as SitePageRow[], migrationMissing: false }
}

export interface HomepageState {
  sections: HomeSection[]
  migrationMissing: boolean
}

export async function loadHomepageState(): Promise<HomepageState> {
  const { client } = getAdmin()
  const ready = await storeStructureReady(client)
  const row = check(await client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle()) as SiteSettingsRow | null
  return { sections: normalizeHomeSections(row?.home_sections), migrationMissing: !ready }
}

export async function loadSettings(): Promise<{ settings: SiteSettings; row: SiteSettingsRow | null }> {
  const { client } = getAdmin()
  const row = check(await client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle()) as SiteSettingsRow | null
  return { settings: settingsFromRow(row), row }
}

export interface CustomDesignsState {
  designs: (CustomDesignRow & { imageUrl: string | null; detailImageUrl: string | null })[]
  migrationMissing: boolean
}

export async function loadCustomDesignsState(): Promise<CustomDesignsState> {
  const { client } = getAdmin()
  const result = await client.from(TABLES.customDesigns).select("*").order("sort_order")
  if (result.error) {
    if (isMissingTable(result.error)) return { designs: [], migrationMissing: true }
    throw new Error(result.error.message)
  }
  return {
    designs: (result.data as CustomDesignRow[]).map((d) => ({
      ...d,
      imageUrl: bannerUrl(d),
      detailImageUrl: bannerUrl({ image_path: d.detail_image_path, image_widths: d.detail_image_widths }),
    })),
    migrationMissing: false,
  }
}

export interface PublishStatus {
  publishedAt: string | null
  lastChangeAt: string | null
  hasUnpublishedChanges: boolean
  hasDeployHook: boolean
  previewUrl: string
}

export async function loadPublishStatus(): Promise<PublishStatus> {
  const { client, env } = getAdmin()
  const latest = (table: string) => client.from(table).select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle()
  const [settings, latestProduct, ...storeTables] = await Promise.all([
    client.from(TABLES.settings).select("published_at, updated_at").eq("id", 1).maybeSingle(),
    latest(TABLES.products),
    // These have updated_at only after migrations 20261122000000 and 20261128000000; errors before that are ignored.
    latest(TABLES.categories),
    latest(TABLES.collections),
    latest(TABLES.pages),
    latest(TABLES.customDesigns),
  ])
  const s = check(settings) as { published_at: string | null; updated_at: string } | null
  const p = check(latestProduct) as { updated_at: string } | null
  const storeChanges = storeTables.map((r) => (r.error ? undefined : (r.data as { updated_at: string } | null)?.updated_at))
  const changes = [s?.updated_at, p?.updated_at, ...storeChanges].filter((v): v is string => Boolean(v)).sort()
  const lastChangeAt = changes[changes.length - 1] ?? null
  const publishedAt = s?.published_at ?? null
  return {
    publishedAt,
    lastChangeAt,
    hasUnpublishedChanges: Boolean(lastChangeAt && (!publishedAt || lastChangeAt > publishedAt)),
    hasDeployHook: Boolean(env.deployHookUrl),
    previewUrl: env.previewUrl,
  }
}
