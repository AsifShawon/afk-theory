import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../../modules/wishlist"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.json({
      wishlist: {
        customer_id: null,
        items: [],
        product_ids: [],
      },
    })
  }

  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const items = await wishlistService.listWishlistItems(
      { customer_id: customerId },
      { order: { created_at: "DESC" } }
    )

    const productIds = items.map((item: { product_id: string }) => item.product_id).filter(Boolean)

    let products: any[] = []
    if (productIds.length > 0) {
      const { data } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "handle",
          "thumbnail",
          "status",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.calculated_price.*",
        ],
        filters: {
          id: productIds,
          status: "published",
        },
      })
      products = data || []
    }

    const validProductIds = new Set(products.map((p) => p.id))
    const validItems = items.filter((item: { product_id: string }) => validProductIds.has(item.product_id))

    return res.json({
      wishlist: {
        customer_id: customerId,
        items: validItems.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          created_at: item.created_at,
          product: products.find((p) => p.id === item.product_id) || null,
        })),
        product_ids: validItems.map((item: any) => item.product_id),
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load customer wishlist",
      type: "internal_error",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({
      message: "Customer authentication required to save cloud wishlist items.",
      type: "unauthorized",
    })
  }

  const body = req.body as { product_id?: string }
  const productId = body?.product_id

  if (!productId || typeof productId !== "string") {
    return res.status(400).json({
      message: "Missing or invalid 'product_id' in request body.",
      type: "invalid_data",
    })
  }

  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as any

  try {
    const existing = await wishlistService.listWishlistItems({
      customer_id: customerId,
      product_id: productId,
    })

    if (existing && existing.length > 0) {
      return res.json({
        success: true,
        item: existing[0],
        message: "Product is already in wishlist.",
      })
    }

    const item = await wishlistService.createWishlistItems({
      customer_id: customerId,
      product_id: productId,
    })

    return res.status(201).json({
      success: true,
      item,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to add item to wishlist",
      type: "internal_error",
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({
      message: "Customer authentication required to modify cloud wishlist.",
      type: "unauthorized",
    })
  }

  const productId =
    (req.query?.product_id as string) || (req.body as { product_id?: string })?.product_id

  if (!productId) {
    return res.status(400).json({
      message: "Missing 'product_id' parameter.",
      type: "invalid_data",
    })
  }

  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as any

  try {
    const existing = await wishlistService.listWishlistItems({
      customer_id: customerId,
      product_id: productId,
    })

    if (existing && existing.length > 0) {
      await wishlistService.deleteWishlistItems(existing.map((e: any) => e.id))
    }

    return res.json({
      success: true,
      removed: productId,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to remove item from wishlist",
      type: "internal_error",
    })
  }
}
