"use client"

import React, { useMemo, useState } from "react"
import {
  DEFAULT_MEDUSA_CAPABILITIES,
  ProductView,
  applyOptionChange,
  findVariantByOptions,
  getMaxPurchasableQuantity,
  pickInitialSelection,
} from "@dtc/commerce-contracts"
import { ProductDetailView } from "@dtc/storefront-ui"
import { addToCartWithResult } from "@lib/data/cart"
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    pickInitialSelection(product.variants)
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [addToCartError, setAddToCartError] = useState<string | null>(null)

  const routes = createMedusaRoutes(countryCode)

  const handleSelectOption = (title: string, value: string) => {
    setAddToCartError(null)
    setSelectedOptions((prev) => applyOptionChange(product.variants, prev, title, value))
  }

  // Exact match only. A missing combination must never resolve to another variant.
  const selectedVariant = useMemo(
    () => findVariantByOptions(product.variants, selectedOptions),
    [product.variants, selectedOptions]
  )

  // Keep the quantity within stock when the customer switches to a variant with less of it.
  const maxQuantity = getMaxPurchasableQuantity(selectedVariant)
  const effectiveQuantity =
    maxQuantity !== undefined && maxQuantity > 0 ? Math.min(quantity, maxQuantity) : quantity

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setAddToCartError("Please choose an available size and colour.")
      return
    }

    setAddToCartError(null)
    setIsAdding(true)

    try {
      const result = await addToCartWithResult({
        variantId: selectedVariant.id,
        quantity: effectiveQuantity,
        countryCode,
      })

      if (!result.success) {
        setAddToCartError(result.message)
      }
    } catch (error) {
      console.error("Failed to add to bag:", error)
      setAddToCartError("We couldn't add this item to your bag. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <ProductDetailView
      product={product}
      selectedOptions={selectedOptions}
      onSelectOption={handleSelectOption}
      selectedVariant={selectedVariant}
      quantity={effectiveQuantity}
      onQuantityChange={setQuantity}
      onAddToCart={handleAddToCart}
      isAddingToCart={isAdding}
      addToCartError={addToCartError}
      routes={routes}
      capabilities={DEFAULT_MEDUSA_CAPABILITIES}
      linkComponent={LocalizedClientLink}
    >
      {children}
    </ProductDetailView>
  )
}
