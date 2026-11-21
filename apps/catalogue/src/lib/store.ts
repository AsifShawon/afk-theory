import type { Catalogue, CatalogueCategoryNode, CatalogueImage, CatalogueProduct, ProductBadge } from "@dtc/catalogue-core"

/** Every category node, depth first, parents before children. */
export function allCategoryNodes(catalogue: Catalogue): CatalogueCategoryNode[] {
  const out: CatalogueCategoryNode[] = []
  const walk = (nodes: CatalogueCategoryNode[]) => {
    for (const node of nodes) {
      out.push(node)
      walk(node.children)
    }
  }
  walk(catalogue.categoryTree)
  return out
}

/** "/c/tees/drop-shoulder/" -> ["tees", "drop-shoulder"] */
export function categoryPathSegments(href: string): string[] {
  return href.replace(/^\/c\//, "").split("/").filter(Boolean)
}

export function findCategoryByPath(catalogue: Catalogue, path: string[]): CatalogueCategoryNode | null {
  const href = `/c/${path.join("/")}/`
  return allCategoryNodes(catalogue).find((node) => node.href === href) ?? null
}

/** Ancestors of a node, top level first, not including the node. */
export function categoryAncestors(catalogue: Catalogue, node: CatalogueCategoryNode): CatalogueCategoryNode[] {
  const byId = new Map(allCategoryNodes(catalogue).map((n) => [n.id, n]))
  return node.trail
    .slice(0, -1)
    .map((id) => byId.get(id))
    .filter((n): n is CatalogueCategoryNode => Boolean(n))
}

/** Products in a category or any of its subcategories, in admin order. */
export function productsInCategory(catalogue: Catalogue, categoryId: string): CatalogueProduct[] {
  return catalogue.products.filter((p) => p.category?.trail.includes(categoryId))
}

export function productsBySlugs(catalogue: Catalogue, slugs: string[]): CatalogueProduct[] {
  const bySlug = new Map(catalogue.products.map((p) => [p.slug, p]))
  return slugs.map((slug) => bySlug.get(slug)).filter((p): p is CatalogueProduct => Boolean(p))
}

/** A cover image for a category or collection: its own banner, else its first product's photo. */
export function coverImage(own: CatalogueImage | null, products: CatalogueProduct[]): CatalogueImage | null {
  if (own) return own
  const first = products[0]
  return first?.images.find((i) => i.role === "model") ?? first?.images[0] ?? null
}

/* ----------------------------- navigation data ----------------------------- */

/** Just enough of a product for menu cards and search results. */
export interface NavProduct {
  slug: string
  name: string
  priceBdt: number
  compareAtBdt: number | null
  badges: ProductBadge[]
  image: CatalogueImage | null
}

export interface NavCategory {
  id: string
  name: string
  href: string
  productCount: number
  children: { id: string; name: string; href: string; productCount: number }[]
}

export interface NavData {
  menu: { id: string; name: string; href: string; children: { id: string; name: string; href: string }[]; products: NavProduct[] }[]
  categories: NavCategory[]
  collections: { name: string; href: string }[]
  newArrivals: NavProduct[]
  hasNew: boolean
  hasSale: boolean
  pages: { slug: string; title: string }[]
  productCount: number
}

export function navProduct(p: CatalogueProduct): NavProduct {
  return {
    slug: p.slug,
    name: p.name,
    priceBdt: p.priceBdt,
    compareAtBdt: p.compareAtBdt,
    badges: p.badges,
    image: p.images.find((i) => i.role === "model") ?? p.images[0] ?? null,
  }
}

/** Everything the header, mobile menu and footer show, kept small for every page. */
export function buildNavData(catalogue: Catalogue): NavData {
  const bySlug = new Map(catalogue.products.map((p) => [p.slug, p]))
  const toNav = (slugs: string[]) =>
    slugs
      .map((s) => bySlug.get(s))
      .filter((p): p is CatalogueProduct => Boolean(p))
      .map(navProduct)

  const visibleCollections = catalogue.collections.filter((c) => c.productSlugs.some((s) => bySlug.has(s)))

  return {
    menu: catalogue.menu.map((item) => ({
      id: item.id,
      name: item.name,
      href: item.href,
      children: item.children,
      products: toNav(item.productSlugs),
    })),
    categories: catalogue.categoryTree
      .filter((n) => n.showInMenu)
      .map((n) => ({
        id: n.id,
        name: n.name,
        href: n.href,
        productCount: n.productCount,
        children: n.children.filter((c) => c.showInMenu).map((c) => ({ id: c.id, name: c.name, href: c.href, productCount: c.productCount })),
      })),
    collections: visibleCollections.map((c) => ({ name: c.name, href: c.href })),
    newArrivals: toNav(catalogue.autoCollections.new.slice(0, 2)),
    hasNew: catalogue.autoCollections.new.length > 0,
    hasSale: catalogue.autoCollections.sale.length > 0,
    pages: catalogue.pages.map((p) => ({ slug: p.slug, title: p.title })),
    productCount: catalogue.products.length,
  }
}

export const BADGE_LABEL: Record<ProductBadge, string> = {
  "sold-out": "Sold out",
  sale: "Sale",
  new: "New",
  bestseller: "Bestseller",
}
