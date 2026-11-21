import type { CategoryRow } from "./types"

export interface CategoryTreeNode {
  row: CategoryRow
  depth: number
  /** Ids from the top-level category down to this one. */
  trail: string[]
  trailSlugs: string[]
  trailNames: string[]
  /** "/c/tees/drop-shoulder/" */
  href: string
  children: CategoryTreeNode[]
}

/** Site path of a category from its slug trail. */
export function categoryHref(trailSlugs: string[]): string {
  return `/c/${trailSlugs.join("/")}/`
}

const byOrder = (a: CategoryRow, b: CategoryRow) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)

/**
 * Resolves each category's parent. A parent that no longer exists, or one
 * that would make a loop, is dropped so the category becomes top-level.
 * Rows are handled in sort order, so the same data always gives the same tree.
 */
export function resolveParents(rows: CategoryRow[]): Map<string, string | null> {
  const ids = new Set(rows.map((r) => r.id))
  const parentOf = new Map<string, string | null>()
  for (const row of rows) {
    const parent = row.parent_id && row.parent_id !== row.id && ids.has(row.parent_id) ? row.parent_id : null
    parentOf.set(row.id, parent)
  }
  for (const row of [...rows].sort(byOrder)) {
    const seen = new Set<string>([row.id])
    let current = parentOf.get(row.id) ?? null
    while (current) {
      if (current === row.id) {
        parentOf.set(row.id, null)
        break
      }
      // A loop further up that this row is not part of. It is cut when one of its members is handled.
      if (seen.has(current)) break
      seen.add(current)
      current = parentOf.get(current) ?? null
    }
  }
  return parentOf
}

/** Builds the parent/child tree, ordered by sort order then name at every level. */
export function buildCategoryTree(rows: CategoryRow[]): CategoryTreeNode[] {
  const parentOf = resolveParents(rows)
  const childrenOf = new Map<string | null, CategoryRow[]>()
  for (const row of rows) {
    const parent = parentOf.get(row.id) ?? null
    const list = childrenOf.get(parent) ?? []
    list.push(row)
    childrenOf.set(parent, list)
  }

  const build = (row: CategoryRow, parent: CategoryTreeNode | null): CategoryTreeNode => {
    const trailSlugs = [...(parent?.trailSlugs ?? []), row.slug]
    const node: CategoryTreeNode = {
      row,
      depth: parent ? parent.depth + 1 : 0,
      trail: [...(parent?.trail ?? []), row.id],
      trailSlugs,
      trailNames: [...(parent?.trailNames ?? []), row.name],
      href: categoryHref(trailSlugs),
      children: [],
    }
    node.children = (childrenOf.get(row.id) ?? []).sort(byOrder).map((child) => build(child, node))
    return node
  }

  return (childrenOf.get(null) ?? []).sort(byOrder).map((row) => build(row, null))
}

/** Every node, parents before their children. */
export function flattenTree<T extends { children: T[] }>(nodes: T[]): T[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)])
}

/** Ids of a category and all of its subcategories, for parent pickers. */
export function categoryAndDescendantIds(rows: CategoryRow[], id: string): Set<string> {
  const node = flattenTree(buildCategoryTree(rows)).find((n) => n.row.id === id)
  return new Set(node ? flattenTree([node]).map((n) => n.row.id) : [id])
}
