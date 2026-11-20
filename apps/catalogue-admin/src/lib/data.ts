import "server-only"
import {
  settingsFromRow,
  TABLES,
  type CategoryRow,
  type ProductColorRow,
  type ProductImageRow,
  type ProductRow,
  type SiteSettings,
  type SiteSettingsRow,
} from "@dtc/catalogue-core"
import { publicImageUrl } from "./supabase"
import { getAdmin } from "./supabase-server"

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
  const categoryRows = check(categories) as CategoryRow[]

  return (check(products) as ProductRow[]).map((p) => {
    const own = imageRows.filter((i) => i.product_id === p.id)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      isFeatured: p.is_featured,
      priceBdt: p.price_bdt,
      categoryName: categoryRows.find((c) => c.id === p.category_id)?.name ?? null,
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

export async function loadCategories(): Promise<CategoryRow[]> {
  const { client } = getAdmin()
  return check(await client.from(TABLES.categories).select("*").order("sort_order")) as CategoryRow[]
}

export async function loadSettings(): Promise<{ settings: SiteSettings; row: SiteSettingsRow | null }> {
  const { client } = getAdmin()
  const row = check(await client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle()) as SiteSettingsRow | null
  return { settings: settingsFromRow(row), row }
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
  const [settings, latestProduct] = await Promise.all([
    client.from(TABLES.settings).select("published_at, updated_at").eq("id", 1).maybeSingle(),
    client.from(TABLES.products).select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ])
  const s = check(settings) as { published_at: string | null; updated_at: string } | null
  const p = check(latestProduct) as { updated_at: string } | null
  const changes = [s?.updated_at, p?.updated_at].filter((v): v is string => Boolean(v)).sort()
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
