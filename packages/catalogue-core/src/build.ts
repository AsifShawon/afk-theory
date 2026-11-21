import { buildCategoryTree, flattenTree, type CategoryTreeNode } from "./category-tree"
import { DEFAULT_SETTINGS } from "./constants"
import { newestFirst, pickMenuProducts } from "./menu"
import { descriptionToHtml, descriptionToText } from "./rich-text"
import { normalizeHomeSections } from "./store-defaults"
import {
  SITE_PAGE_SLUGS,
  type Catalogue,
  type CatalogueCategory,
  type CatalogueCategoryNode,
  type CatalogueCollection,
  type CatalogueDesign,
  type CatalogueImage,
  type CatalogueMenuItem,
  type CataloguePage,
  type CatalogueProduct,
  type ImageRole,
  type ProductBadge,
  type RawCatalogue,
  type SearchIndexEntry,
  type SiteSettings,
  type SiteSettingsRow,
  type SizeChart,
} from "./types"

/**
 * Turns one stored width of an image into a URL the site can load. Product,
 * category and collection images all go through it; only `path` is given.
 */
export type ImageSrcResolver = (image: { path: string }, width: number) => string

export interface BuildOptions {
  /** Reference time for "new in the last 30 days". Defaults to now. */
  now?: Date
}

/** Products created this recently count as new. */
export const NEW_PRODUCT_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

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

/** A category or collection banner stored with the product image pipeline. */
interface StoredImageColumns {
  image_path?: string | null
  image_widths?: number[]
  image_width?: number | null
  image_height?: number | null
}

function bannerImage(id: string, alt: string, row: StoredImageColumns, resolveSrc: ImageSrcResolver): CatalogueImage | null {
  const path = row.image_path
  const widths = (row.image_widths ?? []).filter((w) => w > 0)
  if (!path || widths.length === 0 || !row.image_width || !row.image_height) {
    return null
  }
  return {
    id,
    colorId: null,
    designId: null,
    role: "detail",
    alt,
    width: row.image_width,
    height: row.image_height,
    sources: [...widths].sort((a, b) => a - b).map((width) => ({ width, src: resolveSrc({ path }, width) })),
  }
}

function toCategory(node: CategoryTreeNode): CatalogueCategory {
  return {
    id: node.row.id,
    slug: node.row.slug,
    name: node.row.name,
    parentId: node.trail.length > 1 ? node.trail[node.trail.length - 2] : null,
    trail: node.trail,
    href: node.href,
  }
}

/**
 * Builds the render-ready catalogue from database rows. Only published
 * products are kept, and products without images are dropped because the
 * site cannot show them. Categories and collections without products are
 * left out, so menus and filters never lead to an empty page.
 */
export function buildCatalogue(
  raw: RawCatalogue,
  resolveSrc: ImageSrcResolver,
  source: Catalogue["source"],
  options: BuildOptions = {}
): { catalogue: Catalogue; skipped: string[] } {
  const now = (options.now ?? new Date()).getTime()
  const tree = buildCategoryTree(raw.categories)
  const treeNodes = flattenTree(tree)
  const categoryById = new Map(treeNodes.map((node) => [node.row.id, toCategory(node)]))
  const guideById = new Map((raw.sizeGuides ?? []).map((g) => [g.id, g]))
  const collectionRows = [...(raw.collections ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  const collectionById = new Map(collectionRows.map((c) => [c.id, c]))
  const productCollections = raw.productCollections ?? []
  const skipped: string[] = []

  const products: CatalogueProduct[] = []
  const designGroups = new Map<string, string>()
  for (const row of [...raw.products].sort(bySortOrder)) {
    if (row.status !== "published") {
      continue
    }

    const colors = raw.colors
      .filter((c) => c.product_id === row.id)
      .sort(bySortOrder)
      .map((c) => ({ id: c.id, name: c.name, hex: c.hex, inStock: c.in_stock }))

    const designs: CatalogueDesign[] = (raw.designs ?? [])
      .filter((d) => d.product_id === row.id)
      .sort(bySortOrder)
      .map((d) => ({ id: d.id, name: d.name, inStock: d.in_stock }))
    const designIds = new Set(designs.map((d) => d.id))

    const images: CatalogueImage[] = raw.images
      .filter((img) => img.product_id === row.id && img.widths.length > 0)
      .sort((a, b) => a.sort_order - b.sort_order || ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
      .map((img) => ({
        id: img.id,
        colorId: img.color_id,
        designId: img.design_id && designIds.has(img.design_id) ? img.design_id : null,
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

    const guide = row.size_guide_id ? guideById.get(row.size_guide_id) : undefined
    const sizeChart: SizeChart = guide
      ? { columns: guide.columns, rows: guide.rows, unit: guide.unit || undefined, note: guide.note || undefined }
      : row.size_chart ?? { columns: [], rows: [] }

    const sizes = row.sizes ?? []
    const soldOutSizes = (row.sold_out_sizes ?? []).filter((s) => sizes.includes(s))
    const anyColorInStock = colors.length === 0 || colors.some((c) => c.inStock)
    const anyDesignInStock = designs.length === 0 || designs.some((d) => d.inStock)
    const anySizeInStock = sizes.length === 0 || sizes.some((s) => !soldOutSizes.includes(s))
    const soldOut = !anyColorInStock || !anyDesignInStock || !anySizeInStock

    const created = Date.parse(row.created_at)
    const isNew = row.badge === "new" || (Number.isFinite(created) && created <= now && now - created < NEW_PRODUCT_DAYS * DAY_MS)
    const onSale = row.compare_at_bdt !== null && row.compare_at_bdt > row.price_bdt
    const badges: ProductBadge[] = []
    if (soldOut) badges.push("sold-out")
    if (onSale) badges.push("sale")
    if (isNew) badges.push("new")
    if (row.badge === "bestseller") badges.push("bestseller")

    const collectionSlugs = productCollections
      .filter((link) => link.product_id === row.id && collectionById.has(link.collection_id))
      .map((link) => collectionById.get(link.collection_id)!)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.slug)

    const group = (row.design_group ?? "").trim().toLowerCase()
    if (group) designGroups.set(row.id, group)

    products.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      description: descriptionToText(row.description),
      descriptionHtml: descriptionToHtml(row.description),
      seoTitle: (row.seo_title ?? "").trim(),
      seoDescription: (row.seo_description ?? "").trim(),
      priceBdt: row.price_bdt,
      compareAtBdt: row.compare_at_bdt,
      category: row.category_id ? categoryById.get(row.category_id) ?? null : null,
      isFeatured: row.is_featured,
      sizes,
      soldOutSizes,
      details: row.details ?? {},
      sizeChart,
      colors,
      designs,
      images,
      soldOut,
      createdAt: Number.isFinite(created) ? new Date(created).toISOString() : new Date(0).toISOString(),
      isNew,
      badges,
      collectionSlugs: [...new Set(collectionSlugs)],
      moreDesigns: [],
    })
  }

  for (const product of products) {
    const group = designGroups.get(product.id)
    if (group) {
      product.moreDesigns = products.filter((p) => p.id !== product.id && designGroups.get(p.id) === group).map((p) => p.slug)
    }
  }

  const productById = new Map(products.map((p) => [p.id, p]))

  // Category tree with product counts, pruned to branches that hold products.
  const countIn = (id: string) => products.filter((p) => p.category?.trail.includes(id)).length
  const toNode = (node: CategoryTreeNode): CatalogueCategoryNode | null => {
    const productCount = countIn(node.row.id)
    if (productCount === 0) return null
    return {
      ...toCategory(node),
      trailNames: node.trailNames,
      depth: node.depth,
      description: (node.row.description ?? "").trim(),
      image: bannerImage(`category-${node.row.id}`, node.row.name, node.row, resolveSrc),
      showInMenu: node.row.show_in_menu !== false,
      seoTitle: (node.row.seo_title ?? "").trim(),
      seoDescription: (node.row.seo_description ?? "").trim(),
      productCount,
      children: node.children.map(toNode).filter((n): n is CatalogueCategoryNode => n !== null),
    }
  }
  const categoryTree = tree.map(toNode).filter((n): n is CatalogueCategoryNode => n !== null)

  const collections: CatalogueCollection[] = collectionRows
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: (c.description ?? "").trim(),
      image: bannerImage(`collection-${c.id}`, c.name, c, resolveSrc),
      showOnHome: c.show_on_home,
      seoTitle: (c.seo_title ?? "").trim(),
      seoDescription: (c.seo_description ?? "").trim(),
      href: `/collections/${c.slug}/`,
      productSlugs: [
        ...new Set(
          productCollections
            .filter((link) => link.collection_id === c.id && productById.has(link.product_id))
            .sort(bySortOrder)
            .map((link) => productById.get(link.product_id)!.slug)
        ),
      ],
    }))
    .filter((c) => c.productSlugs.length > 0)

  const menuCandidates = products.map((p) => ({ id: p.id, slug: p.slug, createdAt: p.createdAt, categoryTrail: p.category?.trail ?? [] }))
  const menu: CatalogueMenuItem[] = categoryTree
    .filter((node) => node.showInMenu)
    .map((node) => ({
      id: node.id,
      name: node.name,
      href: node.href,
      children: node.children.filter((child) => child.showInMenu).map((child) => ({ id: child.id, name: child.name, href: child.href })),
      productSlugs: pickMenuProducts(
        node.id,
        (raw.menuProducts ?? [])
          .filter((m) => m.category_id === node.id)
          .sort(bySortOrder)
          .map((m) => m.product_id),
        menuCandidates
      ),
    }))
    .filter((item) => item.productSlugs.length > 0)

  const pageOrder = (slug: string) => {
    const i = (SITE_PAGE_SLUGS as readonly string[]).indexOf(slug)
    return i === -1 ? SITE_PAGE_SLUGS.length : i
  }
  const pages: CataloguePage[] = (raw.pages ?? [])
    .map((p) => ({
      slug: p.slug,
      title: p.title.trim(),
      html: descriptionToHtml(p.html ?? ""),
      seoTitle: (p.seo_title ?? "").trim(),
      seoDescription: (p.seo_description ?? "").trim(),
      updatedAt: p.updated_at,
    }))
    .filter((p) => p.title && p.html)
    .sort((a, b) => pageOrder(a.slug) - pageOrder(b.slug) || a.slug.localeCompare(b.slug))

  const searchIndex: SearchIndexEntry[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category ? (treeNodes.find((n) => n.row.id === p.category?.id)?.trailNames ?? [p.category.name]).join(" / ") : "",
    colors: p.colors.map((c) => c.name),
    designs: p.designs.map((d) => d.name),
    priceBdt: p.priceBdt,
    soldOut: p.soldOut,
    image: p.images[0]?.sources[0]?.src ?? null,
  }))

  const usedCategoryIds = new Set(products.map((p) => p.category?.id).filter(Boolean))

  return {
    catalogue: {
      generatedAt: new Date(now).toISOString(),
      source,
      settings: settingsFromRow(raw.settings),
      categories: treeNodes
        .filter((node) => usedCategoryIds.has(node.row.id))
        .sort((a, b) => a.row.sort_order - b.row.sort_order)
        .map((node) => categoryById.get(node.row.id)!),
      categoryTree,
      products,
      collections,
      autoCollections: {
        new: newestFirst(products.filter((p) => p.isNew)).map((p) => p.slug),
        sale: products.filter((p) => p.compareAtBdt !== null && p.compareAtBdt > p.priceBdt).map((p) => p.slug),
      },
      menu,
      pages,
      homeSections: normalizeHomeSections(raw.settings?.home_sections),
      searchIndex,
    },
    skipped,
  }
}

/**
 * Every stored image the built catalogue shows: product photos plus
 * category and collection banners. The site's sync script downloads these
 * and deletes everything else from its media folder.
 */
export function usedImageObjects(raw: RawCatalogue, catalogue: Catalogue): { path: string; widths: number[] }[] {
  const imageIds = new Set(catalogue.products.flatMap((p) => p.images.map((i) => i.id)))
  const categoryIds = new Set(flattenTree(catalogue.categoryTree).filter((c) => c.image).map((c) => c.id))
  const collectionIds = new Set(catalogue.collections.filter((c) => c.image).map((c) => c.id))
  const banners = [
    ...raw.categories.filter((c) => categoryIds.has(c.id)),
    ...(raw.collections ?? []).filter((c) => collectionIds.has(c.id)),
  ]
  return [
    ...raw.images.filter((img) => imageIds.has(img.id)).map((img) => ({ path: img.path, widths: img.widths })),
    ...banners.map((b) => ({ path: b.image_path as string, widths: b.image_widths ?? [] })),
  ]
}
