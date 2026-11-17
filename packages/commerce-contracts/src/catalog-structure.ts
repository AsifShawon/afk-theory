import type { ProductView } from "./catalog"
import type { StoreRoutes } from "./routes"

/**
 * The store sells two product lines. This file is the single place that
 * describes them: the menu, home page, footer, search suggestions and size guide
 * all read from here, so the catalog only has to be described once.
 *
 * In Medusa Admin:
 *  - each product line is a Collection (handle = `handle` below)
 *  - each hoodie style is a Product Category (handle = style `handle`)
 */

export interface ProductStyle {
  /** Medusa product category handle. */
  handle: string
  title: string
  /** How many colors the style comes in. */
  colorCount: number
  summary: string
}

export interface ProductLine {
  /** Medusa collection handle. */
  handle: string
  title: string
  /** Short label for tight spaces. */
  shortTitle: string
  /** One sentence for tiles and menus. */
  summary: string
  /** Colors per design/style, when every item in the line has the same number. */
  colorCount?: number
  /** Optional sub-styles, each a Medusa product category. */
  styles: ProductStyle[]
  /** Photo for menus and tiles. */
  image: string
}

export const PRODUCT_LINES: readonly ProductLine[] = [
  {
    handle: "drop-shoulder-tees",
    title: "Drop Shoulder Tees",
    shortTitle: "Tees",
    summary: "Oversized drop shoulder tees in 3 colors, across multiple designs.",
    colorCount: 3,
    styles: [],
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    handle: "hoodies",
    title: "Hoodies",
    shortTitle: "Hoodies",
    summary: "Two hoodie styles: a basic in 2 colors and a drop shoulder in 3 colors.",
    styles: [
      {
        handle: "basic-hoodie",
        title: "Basic Hoodie",
        colorCount: 2,
        summary: "The everyday hoodie, in 2 colors.",
      },
      {
        handle: "drop-shoulder-hoodie",
        title: "Drop Shoulder Hoodie",
        colorCount: 3,
        summary: "Dropped shoulder seams and a boxy fit, in 3 colors.",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
  },
]

/** Category used by earlier tee listings; tees in it still count as drop shoulder tees. */
export const LEGACY_TEE_CATEGORY_HANDLE = "drop-shoulder-t-shirts"

export const TEES_LINE: ProductLine = PRODUCT_LINES[0]
export const HOODIES_LINE: ProductLine = PRODUCT_LINES[1]

export function getProductLine(handle: string): ProductLine | undefined {
  return PRODUCT_LINES.find((line) => line.handle === handle)
}

export function lineHref(routes: Pick<StoreRoutes, "collection">, line: ProductLine): string {
  return routes.collection(line.handle)
}

export function styleHref(routes: Pick<StoreRoutes, "category">, style: ProductStyle): string {
  return routes.category(style.handle)
}

/**
 * Whether a product belongs to a line. Tees also match the earlier
 * "Drop Shoulder T-Shirts" category so existing listings keep showing up.
 */
export function productBelongsToLine(
  product: Pick<ProductView, "collectionHandle" | "categoryNames">,
  line: ProductLine
): boolean {
  if (product.collectionHandle === line.handle) return true
  if (line.handle === TEES_LINE.handle) {
    return product.categoryNames.some(
      (name) => name.toLowerCase().replace(/\s+/g, "-") === LEGACY_TEE_CATEGORY_HANDLE
    )
  }
  return false
}

/**
 * Category handles the shop's filter list should offer: the hoodie styles
 * (and the earlier tee category). Other categories that may exist in the
 * database are not part of the current catalog.
 */
export function getShownCategoryHandles(): string[] {
  return [
    LEGACY_TEE_CATEGORY_HANDLE,
    ...PRODUCT_LINES.flatMap((line) => line.styles.map((style) => style.handle)),
  ]
}

/**
 * Splits products into the two lines for home page rails. If no product is
 * tagged as a tee yet (for example a store that has not set up collections),
 * all products are shown in the tees rail so the home page is never empty.
 */
export function groupProductsByLine<
  T extends Pick<ProductView, "collectionHandle" | "categoryNames">,
>(products: T[]): { tees: T[]; hoodies: T[] } {
  const tees = products.filter((p) => productBelongsToLine(p, TEES_LINE))
  const hoodies = products.filter((p) => productBelongsToLine(p, HOODIES_LINE))
  return { tees: tees.length > 0 || hoodies.length > 0 ? tees : products, hoodies }
}
