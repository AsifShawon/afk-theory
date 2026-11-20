import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CategoryRow,
  ProductColorRow,
  ProductImageRow,
  ProductRow,
  RawCatalogue,
  SiteSettingsRow,
  SizeGuideRow,
} from "./types"

export const TABLES = {
  categories: "categories",
  products: "products",
  colors: "product_colors",
  images: "product_images",
  settings: "site_settings",
  sizeGuides: "size_guides",
} as const

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
 */
export async function fetchRawCatalogue(
  client: SupabaseClient,
  options: { includeDrafts?: boolean } = {}
): Promise<RawCatalogue> {
  let productQuery = client.from(TABLES.products).select("*")
  if (!options.includeDrafts) {
    productQuery = productQuery.eq("status", "published")
  }

  const [categories, products, colors, images, settings, sizeGuides] = await Promise.all([
    client.from(TABLES.categories).select("*"),
    productQuery,
    client.from(TABLES.colors).select("*"),
    client.from(TABLES.images).select("*"),
    client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle(),
    client.from(TABLES.sizeGuides).select("*").order("sort_order"),
  ])

  const productRows = unwrap<ProductRow[]>(products, "products")
  const productIds = new Set(productRows.map((p) => p.id))

  return {
    categories: unwrap<CategoryRow[]>(categories, "categories"),
    products: productRows,
    colors: unwrap<ProductColorRow[]>(colors, "product colors").filter((c) =>
      productIds.has(c.product_id)
    ),
    images: unwrap<ProductImageRow[]>(images, "product images").filter((i) =>
      productIds.has(i.product_id)
    ),
    sizeGuides: sizeGuideRows(sizeGuides),
    settings: unwrap<SiteSettingsRow | null>(settings, "site settings"),
  }
}

/**
 * Size guides arrived in a later migration. Until it is run, products fall
 * back to their own charts instead of the whole catalogue failing to load.
 */
function sizeGuideRows(result: { data: unknown; error: { message: string; code?: string } | null }): SizeGuideRow[] {
  if (result.error) {
    if (isMissingTable(result.error)) {
      console.warn("[catalogue] size_guides table not found. Run migration 20261121000000_size_guides_seo.sql.")
      return []
    }
    throw new Error(`Could not load size guides: ${result.error.message}`)
  }
  return (result.data as SizeGuideRow[]) ?? []
}

export function isMissingTable(error: { message: string; code?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|Could not find the table/i.test(error.message)
}
