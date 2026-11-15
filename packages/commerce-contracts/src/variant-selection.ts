import type { ImageView, ProductVariantView, ProductView } from "./catalog"

/**
 * Selected options are keyed by lower-cased option title (for example
 * { size: "M", color: "Bone White" }), matching ProductVariantView.options.
 */
export type SelectedOptions = Record<string, string>

function sameValue(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Returns the variant whose options exactly match the selection, or undefined.
 * Never falls back to another variant: a missing combination must not silently
 * resolve to a different size or colour.
 */
export function findVariantByOptions(
  variants: ProductVariantView[],
  selected: SelectedOptions
): ProductVariantView | undefined {
  return variants.find((variant) =>
    Object.entries(variant.options).every(([key, value]) =>
      sameValue(selected[key.toLowerCase()], value)
    )
  )
}

/**
 * Initial selection for a product page: the first purchasable variant, or the
 * first variant when everything is sold out.
 */
export function pickInitialSelection(
  variants: ProductVariantView[]
): SelectedOptions {
  const initial = variants.find((v) => v.inStock) || variants[0]
  return initial ? { ...initial.options } : {}
}

/**
 * Applies a single option change and keeps the selection valid.
 *
 * If the new combination exists it is used as is. If it does not (for example
 * size XXL does not exist in the newly chosen colour), the closest existing
 * variant that has the changed value is chosen: most other options kept, and
 * purchasable variants preferred over sold-out ones.
 */
export function applyOptionChange(
  variants: ProductVariantView[],
  current: SelectedOptions,
  optionTitle: string,
  value: string
): SelectedOptions {
  const key = optionTitle.toLowerCase()
  const next: SelectedOptions = { ...current, [key]: value }

  if (findVariantByOptions(variants, next)) {
    return next
  }

  const candidates = variants.filter((v) => sameValue(v.options[key], value))
  if (candidates.length === 0) {
    return current
  }

  let best = candidates[0]
  let bestScore = -1
  for (const candidate of candidates) {
    const matches = Object.entries(current).filter(
      ([k, v]) => k !== key && sameValue(candidate.options[k], v)
    ).length
    const score = matches * 2 + (candidate.inStock ? 1 : 0)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }

  return { ...best.options }
}

export type OptionValueAvailability = "available" | "sold_out"

/**
 * Availability of one option value (for example size "M" or colour "Bone White")
 * given the customer's other current selections.
 *
 * The value is "available" when a purchasable variant exists with that value and
 * the other selected options. If that exact combination does not exist (selecting
 * it would move the customer to the nearest variant), any purchasable variant with
 * the value counts instead.
 */
export function getOptionValueAvailability(
  variants: ProductVariantView[],
  selected: SelectedOptions,
  optionTitle: string,
  value: string
): OptionValueAvailability {
  const key = optionTitle.toLowerCase()
  const withValue = variants.filter((v) => sameValue(v.options[key], value))

  const matchingOthers = withValue.filter((v) =>
    Object.entries(selected).every(
      ([k, selectedValue]) => k === key || sameValue(v.options[k], selectedValue)
    )
  )

  const pool = matchingOthers.length > 0 ? matchingOthers : withValue
  return pool.some((v) => v.inStock) ? "available" : "sold_out"
}

/**
 * Highest quantity a customer can add for a variant, or undefined when there is
 * no stock-based limit (untracked inventory, backorders, or unknown quantity).
 */
export function getMaxPurchasableQuantity(
  variant: Pick<
    ProductVariantView,
    "manageInventory" | "allowBackorder" | "inventoryQuantity" | "inStock"
  > | undefined
): number | undefined {
  if (!variant) return undefined
  if (!variant.manageInventory || variant.allowBackorder) return undefined
  if (!variant.inStock) return 0
  if (variant.inventoryQuantity === undefined) return undefined
  return Math.max(0, variant.inventoryQuantity)
}

/**
 * Gallery for the current selection. When the product has a colour option and
 * images are linked to variants of the selected colour, only those images are
 * returned. Otherwise the selected variant's own images are used, and finally
 * the full product gallery.
 */
export function getGalleryImages(
  product: Pick<ProductView, "images" | "options" | "variants">,
  selected: SelectedOptions
): ImageView[] {
  const colorOption = product.options.find((o) => /colou?r/i.test(o.title))
  const colorKey = colorOption?.title.toLowerCase()
  const selectedColor = colorKey ? selected[colorKey] : undefined

  const relevantVariants =
    colorKey && selectedColor
      ? product.variants.filter((v) => sameValue(v.options[colorKey], selectedColor))
      : []
  const pool =
    relevantVariants.length > 0
      ? relevantVariants
      : (() => {
          const exact = findVariantByOptions(product.variants, selected)
          return exact ? [exact] : []
        })()

  const linked = new Map<string, ImageView>()
  for (const variant of pool) {
    for (const image of variant.images ?? []) {
      if (!linked.has(image.id)) linked.set(image.id, image)
    }
  }

  if (linked.size === 0) return product.images

  // Keep the order defined on the product when the image is part of it.
  const ordered = product.images.filter((img) => linked.has(img.id))
  const orderedIds = new Set(ordered.map((img) => img.id))
  const extras = Array.from(linked.values()).filter((img) => !orderedIds.has(img.id))
  return [...ordered.map((img) => linked.get(img.id) as ImageView), ...extras]
}

/**
 * Case-insensitive lookup of a variant's option value by option title.
 * Adapters key variant options by lower-cased title, while mock data and older
 * code use "Color" / "Size", so lookups must not depend on casing.
 */
export function getVariantOption(
  variant: Pick<ProductVariantView, "options">,
  optionTitle: string
): string | undefined {
  const wanted = optionTitle.toLowerCase()
  for (const [key, value] of Object.entries(variant.options)) {
    if (key.toLowerCase() === wanted) return value
  }
  return undefined
}
