import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CategoryRow,
  ProductColorRow,
  ProductImageRow,
  ProductRow,
  RawCatalogue,
  SiteSettingsRow,
} from "./types"

export const TABLES = {
  categories: "categories",
  products: "products",
  colors: "product_colors",
  images: "product_images",
  settings: "site_settings",
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

  const [categories, products, colors, images, settings] = await Promise.all([
    client.from(TABLES.categories).select("*"),
    productQuery,
    client.from(TABLES.colors).select("*"),
    client.from(TABLES.images).select("*"),
    client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle(),
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
    settings: unwrap<SiteSettingsRow | null>(settings, "site settings"),
  }
}
