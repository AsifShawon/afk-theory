import { ProductOptionView, ProductVariantView } from "./catalog"

export function normalizeOptionKey(key: string): string {
  return (key || "").trim().toLowerCase()
}

/**
 * Retrieves the value of an option on a variant by case-insensitive key.
 */
export function getVariantOptionValue(
  variant: ProductVariantView | undefined,
  optionTitle: string
): string | undefined {
  if (!variant?.options || !optionTitle) return undefined
  const target = normalizeOptionKey(optionTitle)

  // Direct match
  if (variant.options[optionTitle] !== undefined) {
    return variant.options[optionTitle]
  }

  // Lowercase match
  if (variant.options[target] !== undefined) {
    return variant.options[target]
  }

  // Iterate all keys case-insensitively
  for (const [key, val] of Object.entries(variant.options)) {
    if (normalizeOptionKey(key) === target) {
      return val
    }
  }

  return undefined
}

/**
 * Finds a specific variant matching the given selected options dictionary.
 * NEVER falls back to variants[0] when the combination doesn't exist.
 */
export function findMatchingVariant(
  variants: ProductVariantView[],
  selectedOptions: Record<string, string>,
  options?: ProductOptionView[]
): ProductVariantView | undefined {
  if (!variants || variants.length === 0) return undefined

  // Normalize all keys in selectedOptions
  const normalizedSelected: Record<string, string> = {}
  for (const [k, v] of Object.entries(selectedOptions || {})) {
    if (v !== undefined && v !== null && String(v).trim().length > 0) {
      normalizedSelected[normalizeOptionKey(k)] = String(v).trim()
    }
  }

  // Filter out empty option definitions
  const activeOptions = (options || []).filter(
    (opt) => opt && opt.values && opt.values.length > 0
  )

  // Single variant with no active options
  if (activeOptions.length === 0 && variants.length === 1) {
    return variants[0]
  }

  // Single variant whose options are empty
  if (variants.length === 1 && Object.keys(variants[0].options || {}).length === 0) {
    return variants[0]
  }

  return variants.find((variant) => {
    // If active options are specified, verify every option has a match
    if (activeOptions.length > 0) {
      for (const optDef of activeOptions) {
        const normKey = normalizeOptionKey(optDef.title)
        const selectedVal = normalizedSelected[normKey]

        if (!selectedVal) {
          // Option is required but not selected
          return false
        }

        const variantVal = getVariantOptionValue(variant, optDef.title)
        if (!variantVal || variantVal.toLowerCase() !== selectedVal.toLowerCase()) {
          return false
        }
      }
    } else {
      // If options were not explicitly provided, infer required options from variant's own options
      const variantOptionKeys = Object.keys(variant.options || {})
      for (const key of variantOptionKeys) {
        const normKey = normalizeOptionKey(key)
        const selectedVal = normalizedSelected[normKey]

        if (!selectedVal) {
          return false
        }

        const variantVal = variant.options[key]
        if (!variantVal || variantVal.toLowerCase() !== selectedVal.toLowerCase()) {
          return false
        }
      }
    }

    // Also check any extra keys in normalizedSelected
    for (const [normKey, selectedVal] of Object.entries(normalizedSelected)) {
      if (!selectedVal) continue
      const variantVal = getVariantOptionValue(variant, normKey)
      if (variantVal && variantVal.toLowerCase() !== selectedVal.toLowerCase()) {
        return false
      }
    }

    return true
  })
}

/**
 * Checks if a specific option combination exists in the product's variant list.
 */
export function isCombinationAvailable(
  variants: ProductVariantView[],
  selectedOptions: Record<string, string>,
  options?: ProductOptionView[]
): {
  exists: boolean
  variant?: ProductVariantView
  inStock: boolean
} {
  const variant = findMatchingVariant(variants, selectedOptions, options)
  if (!variant) {
    return { exists: false, variant: undefined, inStock: false }
  }
  return {
    exists: true,
    variant,
    inStock: Boolean(variant.inStock),
  }
}
