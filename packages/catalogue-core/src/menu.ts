/** Most products a mega menu panel shows. */
export const MENU_PRODUCT_LIMIT = 2

export interface MenuCandidate {
  id: string
  slug: string
  createdAt: string
  /** Category ids from the top-level category down to the product's category. */
  categoryTrail: string[]
}

/** Newest first. Equal times keep their original order. */
export function newestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index, time: Date.parse(item.createdAt) || 0 }))
    .sort((a, b) => b.time - a.time || a.index - b.index)
    .map((entry) => entry.item)
}

/**
 * Product slugs for one category's menu panel. The admin's picks win, in
 * their order, as long as the product is still published and still in this
 * category or one of its subcategories. With no valid pick, the newest
 * products of the category fill the panel, so it is never empty while the
 * category has products.
 */
export function pickMenuProducts(
  categoryId: string,
  pickedIds: string[],
  products: MenuCandidate[],
  limit = MENU_PRODUCT_LIMIT
): string[] {
  const inCategory = products.filter((p) => p.categoryTrail.includes(categoryId))
  const byId = new Map(inCategory.map((p) => [p.id, p]))
  const picked = [...new Set(pickedIds)]
    .map((id) => byId.get(id))
    .filter((p): p is MenuCandidate => Boolean(p))
    .slice(0, limit)
  if (picked.length > 0) {
    return picked.map((p) => p.slug)
  }
  return newestFirst(inCategory)
    .slice(0, limit)
    .map((p) => p.slug)
}
