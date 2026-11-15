import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../modules/wishlist"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({
      message: "Customer authentication required to merge wishlist.",
      type: "unauthorized",
    })
  }

  const body = req.body as { product_ids?: string[] }
  const productIds = Array.isArray(body?.product_ids) ? body.product_ids : []

  if (productIds.length === 0) {
    return res.json({
      success: true,
      merged_count: 0,
    })
  }

  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as any

  try {
    const existing = await wishlistService.listWishlistItems({
      customer_id: customerId,
    })

    const existingProductIds = new Set(existing.map((e: any) => e.product_id))
    const toInsert = productIds
      .filter((id) => typeof id === "string" && !existingProductIds.has(id))
      .map((productId) => ({
        customer_id: customerId,
        product_id: productId,
      }))

    if (toInsert.length > 0) {
      await wishlistService.createWishlistItems(toInsert)
    }

    const allItems = await wishlistService.listWishlistItems({
      customer_id: customerId,
    })

    return res.json({
      success: true,
      merged_count: toInsert.length,
      product_ids: allItems.map((i: any) => i.product_id),
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to merge wishlist",
      type: "internal_error",
    })
  }
}
