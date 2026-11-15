"use client"

import React, { useCallback } from "react"
import { ProductCard as SharedProductCard, ProductCardProps } from "@dtc/storefront-ui"
import { useWishlist } from "@lib/context/wishlist-context"
import { addToCart } from "@lib/data/cart"
import { QuickAddRequest, QuickAddResult } from "@dtc/commerce-contracts"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export interface StorefrontProductCardProps extends Partial<ProductCardProps> {
  product: ProductCardProps["product"]
  href: string
  countryCode?: string
}

export default function StorefrontProductCard({
  product,
  href,
  countryCode = "bd",
  capabilities,
  isWishlisted: propIsWishlisted,
  onToggleWishlist: propOnToggleWishlist,
  onQuickAdd: propOnQuickAdd,
  linkComponent: propLinkComponent,
}: StorefrontProductCardProps) {
  const { isWishlisted: contextIsWishlisted, toggleWishlist: contextToggleWishlist } = useWishlist()

  const handleQuickAdd = useCallback(
    async (req: QuickAddRequest): Promise<QuickAddResult> => {
      if (propOnQuickAdd) {
        return propOnQuickAdd(req)
      }
      try {
        await addToCart({
          variantId: req.variantId,
          quantity: req.quantity || 1,
          countryCode,
        })
        return { success: true }
      } catch (err: unknown) {
        return {
          success: false,
          message: err instanceof Error ? err.message : "Failed to add to bag. Please try again.",
        }
      }
    },
    [countryCode, propOnQuickAdd]
  )

  const activeIsWishlisted =
    propIsWishlisted !== undefined ? propIsWishlisted : contextIsWishlisted(product.id)
  const activeToggleWishlist = propOnToggleWishlist || contextToggleWishlist

  return (
    <SharedProductCard
      product={product}
      href={href}
      capabilities={capabilities}
      onQuickAdd={handleQuickAdd}
      linkComponent={propLinkComponent || LocalizedClientLink}
      isWishlisted={activeIsWishlisted}
      onToggleWishlist={activeToggleWishlist}
    />
  )
}
