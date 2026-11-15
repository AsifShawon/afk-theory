"use client"

import React, { useMemo, useState, useCallback } from "react"
import {
  DEFAULT_MEDUSA_CAPABILITIES,
  ProductView,
  findMatchingVariant,
  QuickAddRequest,
  QuickAddResult,
} from "@dtc/commerce-contracts"
import { ProductDetailView } from "@dtc/storefront-ui"
import { addToCart } from "@lib/data/cart"
import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { createMedusaRoutes } from "../../../../adapters/medusa/routes"

interface MedusaProductDetailClientProps {
  product: ProductView
  countryCode: string
  children?: React.ReactNode
}

export default function MedusaProductDetailClient({
  product,
  countryCode,
  children,
}: MedusaProductDetailClientProps) {
  const { wishlistIds, isWishlisted, toggleWishlist } = useWishlist()

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    return product.variants[0]?.options || {}
  })
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const routes = createMedusaRoutes(countryCode)

  const handleSelectOption = (title: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [title.toLowerCase()]: value,
    }))
  }

  // Exact matching without incorrect fallback
  const selectedVariant = useMemo(() => {
    return findMatchingVariant(product.variants, selectedOptions, product.options)
  }, [product.variants, selectedOptions, product.options])

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    try {
      setIsAdding(true)
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
      })
    } catch (error) {
      console.error("Failed to add to bag:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuickAdd = useCallback(
    async (req: QuickAddRequest): Promise<QuickAddResult> => {
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
          message: err instanceof Error ? err.message : "Failed to add to bag.",
        }
      }
    },
    [countryCode]
  )

  return (
    <ProductDetailView
      product={product}
      selectedOptions={selectedOptions}
      onSelectOption={handleSelectOption}
      selectedVariant={selectedVariant}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAddToCart={handleAddToCart}
      onQuickAdd={handleQuickAdd}
      isAddingToCart={isAdding}
      routes={routes}
      capabilities={DEFAULT_MEDUSA_CAPABILITIES}
      linkComponent={LocalizedClientLink}
      isWishlisted={isWishlisted(product.id)}
      onToggleWishlist={toggleWishlist}
      wishlistIds={wishlistIds}
    >
      {children}
    </ProductDetailView>
  )
}

