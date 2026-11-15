"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { retrieveCustomer } from "./customer"
import { listProducts } from "./products"
import { HttpTypes } from "@medusajs/types"

export interface WishlistResponse {
  items: Array<{
    id: string
    product_id: string
    created_at: string
    product: HttpTypes.StoreProduct | null
  }>
  product_ids: string[]
  customer_id: string | null
}

export async function getWishlist(): Promise<WishlistResponse> {
  const customer = await retrieveCustomer()
  if (!customer) {
    return { items: [], product_ids: [], customer_id: null }
  }

  const authHeaders = await getAuthHeaders()
  const headers = { ...authHeaders }

  return await sdk.client
    .fetch<{ wishlist: WishlistResponse }>(`/store/wishlist`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then((res) => res.wishlist)
    .catch(() => ({ items: [], product_ids: [], customer_id: customer.id }))
}

export async function addWishlistItem(productId: string) {
  const customer = await retrieveCustomer()
  if (!customer) {
    return { success: false, isGuest: true }
  }

  const authHeaders = await getAuthHeaders()
  return await sdk.client
    .fetch<{ success: boolean; item: unknown }>(`/store/wishlist`, {
      method: "POST",
      headers: { ...authHeaders },
      body: { product_id: productId },
    })
    .catch((err: Error) => ({ success: false, error: err?.message }))
}

export async function removeWishlistItem(productId: string) {
  const customer = await retrieveCustomer()
  if (!customer) {
    return { success: true, isGuest: true }
  }

  const authHeaders = await getAuthHeaders()
  return await sdk.client
    .fetch<{ success: boolean; removed: string }>(`/store/wishlist`, {
      method: "DELETE",
      headers: { ...authHeaders },
      body: { product_id: productId },
    })
    .catch((err: Error) => ({ success: false, error: err?.message }))
}

export async function mergeGuestWishlist(productIds: string[]) {
  const customer = await retrieveCustomer()
  if (!customer || !productIds.length) {
    return { success: false, merged_count: 0 }
  }

  const authHeaders = await getAuthHeaders()
  return await sdk.client
    .fetch<{ success: boolean; merged_count: number; product_ids: string[] }>(
      `/store/wishlist/merge`,
      {
        method: "POST",
        headers: { ...authHeaders },
        body: { product_ids: productIds },
      }
    )
    .catch((err: Error) => ({ success: false, error: err?.message }))
}

export async function getWishlistProducts({
  productIds,
  countryCode,
}: {
  productIds: string[]
  countryCode: string
}): Promise<HttpTypes.StoreProduct[]> {
  if (!productIds || productIds.length === 0) return []
  try {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        id: productIds,
        limit: productIds.length,
      },
    })
    return response.products || []
  } catch (err) {
    console.error("Failed to fetch wishlist products:", err)
    return []
  }
}
