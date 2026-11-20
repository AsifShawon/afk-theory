import { DEFAULT_SETTINGS } from "./constants"
import type {
  Catalogue,
  CatalogueCategory,
  CatalogueImage,
  CatalogueProduct,
  ImageRole,
  ProductImageRow,
  RawCatalogue,
  SiteSettings,
  SiteSettingsRow,
} from "./types"

/** Turns one stored width of an image into a URL the site can load. */
export type ImageSrcResolver = (image: ProductImageRow, width: number) => string

const ROLE_ORDER: Record<ImageRole, number> = {
  front: 0,
  model: 1,
  back: 2,
  detail: 3,
}

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

export function settingsFromRow(row: SiteSettingsRow | null): SiteSettings {
  if (!row) {
    return DEFAULT_SETTINGS
  }
  return {
    whatsappNumber: row.whatsapp_number,
    messengerPage: row.messenger_page,
    instagramHandle: row.instagram_handle,
    heroTitle: row.hero_title || DEFAULT_SETTINGS.heroTitle,
    heroSubtitle: row.hero_subtitle,
    announcement: row.announcement,
    deliveryZones: row.delivery_zones?.length ? row.delivery_zones : DEFAULT_SETTINGS.deliveryZones,
    faq: row.faq ?? [],
  }
}

/**
 * Builds the render-ready catalogue from database rows. Only published
 * products are kept, and products without images are dropped because the
 * site cannot show them.
 */
export function buildCatalogue(
  raw: RawCatalogue,
  resolveSrc: ImageSrcResolver,
  source: Catalogue["source"]
): { catalogue: Catalogue; skipped: string[] } {
  const categories: CatalogueCategory[] = [...raw.categories]
    .sort(bySortOrder)
    .map((c) => ({ id: c.id, slug: c.slug, name: c.name }))
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const skipped: string[] = []

  const products: CatalogueProduct[] = []
  for (const row of [...raw.products].sort(bySortOrder)) {
    if (row.status !== "published") {
      continue
    }

    const colors = raw.colors
      .filter((c) => c.product_id === row.id)
      .sort(bySortOrder)
      .map((c) => ({ id: c.id, name: c.name, hex: c.hex, inStock: c.in_stock }))

    const images: CatalogueImage[] = raw.images
      .filter((img) => img.product_id === row.id && img.widths.length > 0)
      .sort((a, b) => a.sort_order - b.sort_order || ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
      .map((img) => ({
        id: img.id,
        colorId: img.color_id,
        role: img.role,
        alt: img.alt || row.name,
        width: img.width,
        height: img.height,
        sources: [...img.widths]
          .sort((a, b) => a - b)
          .map((width) => ({ width, src: resolveSrc(img, width) })),
      }))

    if (images.length === 0) {
      skipped.push(`${row.name} (${row.slug}) has no images`)
      continue
    }

    const sizes = row.sizes ?? []
    const soldOutSizes = (row.sold_out_sizes ?? []).filter((s) => sizes.includes(s))
    const anyColorInStock = colors.length === 0 || colors.some((c) => c.inStock)
    const anySizeInStock = sizes.length === 0 || sizes.some((s) => !soldOutSizes.includes(s))

    products.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      description: row.description,
      priceBdt: row.price_bdt,
      compareAtBdt: row.compare_at_bdt,
      category: row.category_id ? categoryById.get(row.category_id) ?? null : null,
      isFeatured: row.is_featured,
      sizes,
      soldOutSizes,
      details: row.details ?? {},
      sizeChart: row.size_chart ?? { columns: [], rows: [] },
      colors,
      images,
      soldOut: !anyColorInStock || !anySizeInStock,
    })
  }

  const usedCategoryIds = new Set(products.map((p) => p.category?.id).filter(Boolean))

  return {
    catalogue: {
      generatedAt: new Date().toISOString(),
      source,
      settings: settingsFromRow(raw.settings),
      categories: categories.filter((c) => usedCategoryIds.has(c.id)),
      products,
    },
    skipped,
  }
}
