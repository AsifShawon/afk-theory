import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CategoryMenuProductRow,
  CategoryRow,
  CollectionRow,
  ProductCollectionRow,
  ProductColorRow,
  ProductDesignRow,
  ProductImageRow,
  ProductRow,
  RawCatalogue,
  SiteSettingsRow,
  SitePageRow,
  SizeGuideRow,
} from "./types"

export const TABLES = {
  categories: "categories",
  products: "products",
  colors: "product_colors",
  images: "product_images",
  settings: "site_settings",
  sizeGuides: "size_guides",
  collections: "collections",
  productCollections: "product_collections",
  menuProducts: "category_menu_products",
  designs: "product_designs",
  pages: "site_pages",
} as const

/** Migration that adds collections, designs, menu picks, pages and homepage sections. */
export const STORE_STRUCTURE_MIGRATION = "20261122000000_store_structure.sql"

type QueryResult = { data: unknown; error: { message: string; code?: string } | null }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) {
    throw new Error(`Could not load ${what}: ${result.error.message}`)
  }
  return result.data as T
}

/**
 * Loads every catalogue table. With the public (anon/publishable) key, row
 * level security already limits this to published products. Pass
 * `includeDrafts` from the admin, which uses the secret key.
 *
 * Tables from later migrations are optional: until a migration runs, its
 * tables load as empty with a warning, so builds never break.
 */
export async function fetchRawCatalogue(
  client: SupabaseClient,
  options: { includeDrafts?: boolean } = {}
): Promise<RawCatalogue> {
  let productQuery = client.from(TABLES.products).select("*")
  if (!options.includeDrafts) {
    productQuery = productQuery.eq("status", "published")
  }

  const [categories, products, colors, images, settings, sizeGuides, collections, productCollections, menuProducts, designs, pages] =
    await Promise.all([
      client.from(TABLES.categories).select("*"),
      productQuery,
      client.from(TABLES.colors).select("*"),
      client.from(TABLES.images).select("*"),
      client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle(),
      client.from(TABLES.sizeGuides).select("*").order("sort_order"),
      client.from(TABLES.collections).select("*"),
      client.from(TABLES.productCollections).select("*"),
      client.from(TABLES.menuProducts).select("*"),
      client.from(TABLES.designs).select("*"),
      client.from(TABLES.pages).select("*"),
    ])

  const productRows = unwrap<ProductRow[]>(products, "products")
  const productIds = new Set(productRows.map((p) => p.id))
  const ofProducts = <T extends { product_id: string }>(rows: T[]) => rows.filter((r) => productIds.has(r.product_id))

  const missing: string[] = []
  const optional = <T>(result: QueryResult, table: string): T[] => {
    if (result.error) {
      if (isMissingTable(result.error)) {
        missing.push(table)
        return []
      }
      throw new Error(`Could not load ${table}: ${result.error.message}`)
    }
    return (result.data as T[]) ?? []
  }

  const sizeGuideRows = optional<SizeGuideRow>(sizeGuides, TABLES.sizeGuides)
  if (missing.length > 0) {
    console.warn("[catalogue] size_guides table not found. Run migration 20261121000000_size_guides_seo.sql.")
    missing.length = 0
  }

  const raw: RawCatalogue = {
    categories: unwrap<CategoryRow[]>(categories, "categories"),
    products: productRows,
    colors: ofProducts(unwrap<ProductColorRow[]>(colors, "product colors")),
    images: ofProducts(unwrap<ProductImageRow[]>(images, "product images")),
    sizeGuides: sizeGuideRows,
    settings: unwrap<SiteSettingsRow | null>(settings, "site settings"),
    collections: optional<CollectionRow>(collections, TABLES.collections),
    productCollections: ofProducts(optional<ProductCollectionRow>(productCollections, TABLES.productCollections)),
    menuProducts: ofProducts(optional<CategoryMenuProductRow>(menuProducts, TABLES.menuProducts)),
    designs: ofProducts(optional<ProductDesignRow>(designs, TABLES.designs)),
    pages: optional<SitePageRow>(pages, TABLES.pages),
  }

  if (missing.length > 0) {
    console.warn(`[catalogue] ${missing.join(", ")} not found. Run migration ${STORE_STRUCTURE_MIGRATION}. Building without them.`)
  }
  return raw
}

export function isMissingTable(error: { message: string; code?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|Could not find the table/i.test(error.message)
}

/** A column a later migration adds is not there yet (PostgREST schema cache or Postgres). */
export function isMissingColumn(error: { message: string; code?: string }): boolean {
  return error.code === "42703" || error.code === "PGRST204" || /column .* does not exist|Could not find the '.*' column/i.test(error.message)
}
