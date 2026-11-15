"use client"

import React from "react"
import { useParams } from "next/navigation"
import {
  DEFAULT_MEDUSA_CAPABILITIES,
  ProductView,
  QuickAddRequest,
} from "@dtc/commerce-contracts"
import { ProductCard } from "@dtc/storefront-ui"
import { quickAddToCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Product card with Quick Add enabled. Used by server-rendered grids
 * (store listing, related products), which cannot pass functions to the card.
 */
export default function QuickAddProductCard({
  product,
  href,
}: {
  product: ProductView
  href: string
}) {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "bd"

  return (
    <ProductCard
      product={product}
      href={href}
      capabilities={DEFAULT_MEDUSA_CAPABILITIES}
      linkComponent={LocalizedClientLink}
      onQuickAdd={(request: QuickAddRequest) => quickAddToCart(countryCode, request)}
    />
  )
}
