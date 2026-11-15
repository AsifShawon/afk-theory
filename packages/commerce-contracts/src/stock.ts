import type { ProductVariantView } from "./catalog"

/**
 * Low-stock threshold shared by product cards and the product page.
 */
export const LOW_STOCK_THRESHOLD = 5

/**
 * Derives purchasable state from variant inventory fields.
 *
 * A quantity is only trusted when the backend actually returned it. If a managed
 * variant has no quantity (the caller did not request the inventory field, or the
 * sales channel has no stock location), the variant is treated as unavailable
 * rather than invented as "in stock". The backend still performs the
 * authoritative inventory check when the item is added to the cart.
 */
export function resolveVariantStock({
  manageInventory,
  allowBackorder,
  inventoryQuantity,
}: {
  manageInventory: boolean
  allowBackorder: boolean
  inventoryQuantity: number | null | undefined
}): { inStock: boolean; inventoryQuantity: number | undefined } {
  if (!manageInventory) {
    return { inStock: true, inventoryQuantity: undefined }
  }

  const known =
    typeof inventoryQuantity === "number" && Number.isFinite(inventoryQuantity)
      ? inventoryQuantity
      : undefined

  return {
    inStock: allowBackorder || (known !== undefined && known > 0),
    inventoryQuantity: known,
  }
}

/**
 * Total units across variants, only when every variant is tracked and has a
 * known quantity. Otherwise a total would be misleading, so it is left
 * undefined and no low-stock badge is shown.
 */
export function sumTrackedStock(
  variants: Pick<ProductVariantView, "manageInventory" | "inventoryQuantity">[]
): number | undefined {
  if (variants.length === 0) return undefined

  let total = 0
  for (const variant of variants) {
    if (!variant.manageInventory || variant.inventoryQuantity === undefined) {
      return undefined
    }
    total += Math.max(0, variant.inventoryQuantity)
  }
  return total
}
