/**
 * Custom DTF garment pricing rules, placement bounds, and presets.
 * Keep all adjustable rates, base prices, and limits in this module.
 */

export const CUSTOM_HOODIE_CONFIG = {
  /** Base product slug in Supabase for garment images, colors, sizes, and FK linking. */
  baseProductSlug: "premium-drop-shoulder-hoodie-solid",
  /** Product slug used in cart and checkout payloads for Custom DTF Hoodie orders. */
  customProductSlug: "custom-dtf-hoodie",
  customProductName: "Custom DTF Hoodie",
  route: "/custom-hoodie/",
  /** Standard solid unprinted hoodie price in BDT (remains unchanged on the standard product page). */
  solidHoodiePriceBdt: 850,
  /** Base unprinted hoodie price when ordering a Custom DTF Hoodie (BDT). */
  customBasePriceBdt: 870,
  /** Reference DTF sheet size and cost: 39" × 22.5" (877.5 sq in) = 350 BDT. */
  dtfSheetWidthIn: 39,
  dtfSheetHeightIn: 22.5,
  dtfSheetCostBdt: 350,
  /**
   * DTF rate per square inch: 350 / (39 * 22.5) = 350 / 877.5 ≈ 0.39886 BDT/sq in.
   * Note: Increase to 0.55–0.60 if adding a waste or heat-press buffer.
   */
  DTF_RATE_PER_SQ_IN: 350 / (39 * 22.5),
  /** Minimum DTF print fee (BDT) when a placement is active. Set to 0 to disable. */
  MIN_PRINT_FEE: 20,
  /** Step size (in inches) for custom numeric width/height controls. */
  dimensionStepIn: 0.25,
  minDimensionIn: 1,
} as const

export const CUSTOM_TEE_CONFIG = {
  /** Base product slug in Supabase for drop-shoulder tee images, colors, sizes, and FK linking. */
  baseProductSlug: "heavyeight-drop-shoulder-afk-theory-signature-tee",
  customProductSlug: "custom-dtf-tee",
  customProductName: "Custom DTF Drop-Shoulder Tee",
  route: "/custom-tee/",
  /** Standard drop-shoulder tee prices remain unchanged on their regular product pages. */
  solidTeePriceBdt: 600,
  /** Custom Drop-Shoulder Tee base price (BDT). */
  customBasePriceBdt: 580,
} as const

export interface CustomGarmentConfig {
  customProductSlug: string
  customProductName: string
  baseProductSlug: string
  customBasePriceBdt: number
  route: string
  standardLabel: string
  standardPriceBdt: number
  shortTitle: string
  galleryCategoryHref: string
}

export const CUSTOM_GARMENTS: Record<string, CustomGarmentConfig> = {
  [CUSTOM_HOODIE_CONFIG.customProductSlug]: {
    customProductSlug: CUSTOM_HOODIE_CONFIG.customProductSlug,
    customProductName: CUSTOM_HOODIE_CONFIG.customProductName,
    baseProductSlug: CUSTOM_HOODIE_CONFIG.baseProductSlug,
    customBasePriceBdt: CUSTOM_HOODIE_CONFIG.customBasePriceBdt,
    route: CUSTOM_HOODIE_CONFIG.route,
    standardLabel: "Shop Solid Hoodie",
    standardPriceBdt: CUSTOM_HOODIE_CONFIG.solidHoodiePriceBdt,
    shortTitle: "Custom Hoodie",
    galleryCategoryHref: "/c/hoodies/",
  },
  [CUSTOM_TEE_CONFIG.customProductSlug]: {
    customProductSlug: CUSTOM_TEE_CONFIG.customProductSlug,
    customProductName: CUSTOM_TEE_CONFIG.customProductName,
    baseProductSlug: CUSTOM_TEE_CONFIG.baseProductSlug,
    customBasePriceBdt: CUSTOM_TEE_CONFIG.customBasePriceBdt,
    route: CUSTOM_TEE_CONFIG.route,
    standardLabel: "Shop Drop-Shoulder Tees",
    standardPriceBdt: CUSTOM_TEE_CONFIG.solidTeePriceBdt,
    shortTitle: "Custom Tee",
    galleryCategoryHref: "/c/drop-shoulder-tees/",
  },
}

export function getCustomGarmentConfig(slug: string): CustomGarmentConfig | null {
  return CUSTOM_GARMENTS[slug] ?? null
}

export const CUSTOM_PLACEMENT_IDS = ["front", "back", "left_sleeve", "right_sleeve"] as const
export type CustomPlacementId = (typeof CUSTOM_PLACEMENT_IDS)[number]

export interface PlacementDefinition {
  id: CustomPlacementId
  label: string
  breakdownLabel: string
  maxWidthIn: number
  maxHeightIn: number
  defaultPreset: CustomPresetId
}

export const CUSTOM_PLACEMENTS: Record<CustomPlacementId, PlacementDefinition> = {
  front: {
    id: "front",
    label: "Front",
    breakdownLabel: "Front Print",
    maxWidthIn: 14,
    maxHeightIn: 16,
    defaultPreset: "4x4",
  },
  back: {
    id: "back",
    label: "Back",
    breakdownLabel: "Back Print",
    maxWidthIn: 14,
    maxHeightIn: 18,
    defaultPreset: "14x10",
  },
  left_sleeve: {
    id: "left_sleeve",
    label: "Left Sleeve",
    breakdownLabel: "Left Sleeve Print",
    maxWidthIn: 4,
    maxHeightIn: 14,
    defaultPreset: "4x4",
  },
  right_sleeve: {
    id: "right_sleeve",
    label: "Right Sleeve",
    breakdownLabel: "Right Sleeve Print",
    maxWidthIn: 4,
    maxHeightIn: 14,
    defaultPreset: "4x4",
  },
}

export const CUSTOM_PRESET_IDS = ["4x4", "a4", "14x10", "a3", "custom"] as const
export type CustomPresetId = (typeof CUSTOM_PRESET_IDS)[number]

export interface SizePresetDefinition {
  id: Exclude<CustomPresetId, "custom">
  label: string
  widthIn: number
  heightIn: number
}

export const CUSTOM_SIZE_PRESETS: SizePresetDefinition[] = [
  { id: "4x4", label: '4×4"', widthIn: 4, heightIn: 4 },
  { id: "a4", label: "A4", widthIn: 8.27, heightIn: 11.69 },
  { id: "14x10", label: '14×10"', widthIn: 14, heightIn: 10 },
  { id: "a3", label: "A3", widthIn: 11.69, heightIn: 16.54 },
]

export interface CustomDtfPlacementInput {
  id: CustomPlacementId
  preset?: CustomPresetId
  widthIn: number
  heightIn: number
}

export interface PricedPlacement extends CustomDtfPlacementInput {
  label: string
  breakdownLabel: string
  rawPriceBdt: number
  priceBdt: number
}

export interface CustomDtfConfig {
  placements: {
    id: CustomPlacementId
    preset: CustomPresetId
    widthIn: number
    heightIn: number
    priceBdt: number
  }[]
  artworkNote?: string
}

/** Nearest-5 BDT rounding helper (e.g., 84 -> 85, 82 -> 80, 82.5 -> 85). */
export function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5
}

export function isPresetAllowedForPlacement(preset: SizePresetDefinition, placementId: CustomPlacementId): boolean {
  const bounds = CUSTOM_PLACEMENTS[placementId]
  return preset.widthIn <= bounds.maxWidthIn && preset.heightIn <= bounds.maxHeightIn
}

export function clampDimension(value: number, maxIn: number): number {
  if (!Number.isFinite(value)) return CUSTOM_HOODIE_CONFIG.minDimensionIn
  const clamped = Math.max(CUSTOM_HOODIE_CONFIG.minDimensionIn, Math.min(maxIn, value))
  return Math.round(clamped * 100) / 100
}

export function isValidPlacementDimensions(placementId: CustomPlacementId, widthIn: number, heightIn: number): boolean {
  const bounds = CUSTOM_PLACEMENTS[placementId]
  return (
    Number.isFinite(widthIn) &&
    Number.isFinite(heightIn) &&
    widthIn >= CUSTOM_HOODIE_CONFIG.minDimensionIn &&
    heightIn >= CUSTOM_HOODIE_CONFIG.minDimensionIn &&
    widthIn <= bounds.maxWidthIn &&
    heightIn <= bounds.maxHeightIn
  )
}

export function calculatePlacementPriceBdt(widthIn: number, heightIn: number): { rawPriceBdt: number; priceBdt: number } {
  const rawPriceBdt = widthIn * heightIn * CUSTOM_HOODIE_CONFIG.DTF_RATE_PER_SQ_IN
  const floored = Math.max(CUSTOM_HOODIE_CONFIG.MIN_PRINT_FEE, rawPriceBdt)
  return {
    rawPriceBdt,
    priceBdt: roundToNearest5(floored),
  }
}

export function priceCustomDtfItem(
  placements: CustomDtfPlacementInput[],
  basePriceBdt: number = CUSTOM_HOODIE_CONFIG.customBasePriceBdt
): {
  basePriceBdt: number
  printsTotalBdt: number
  unitPriceBdt: number
  itemized: PricedPlacement[]
} {
  const itemized: PricedPlacement[] = placements.map((p) => {
    const def = CUSTOM_PLACEMENTS[p.id]
    const widthIn = clampDimension(p.widthIn, def.maxWidthIn)
    const heightIn = clampDimension(p.heightIn, def.maxHeightIn)
    const { rawPriceBdt, priceBdt } = calculatePlacementPriceBdt(widthIn, heightIn)
    return {
      id: p.id,
      preset: p.preset ?? "custom",
      widthIn,
      heightIn,
      label: def.label,
      breakdownLabel: def.breakdownLabel,
      rawPriceBdt,
      priceBdt,
    }
  })

  const printsTotalBdt = itemized.reduce((sum, p) => sum + p.priceBdt, 0)
  return {
    basePriceBdt,
    printsTotalBdt,
    unitPriceBdt: basePriceBdt + printsTotalBdt,
    itemized,
  }
}

export function priceCustomDtfHoodie(placements: CustomDtfPlacementInput[]) {
  return priceCustomDtfItem(placements, CUSTOM_HOODIE_CONFIG.customBasePriceBdt)
}

export function priceCustomDtfTee(placements: CustomDtfPlacementInput[]) {
  return priceCustomDtfItem(placements, CUSTOM_TEE_CONFIG.customBasePriceBdt)
}

export function formatDimension(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))
}

/** Concise plain-text summary for database `order_items.design`, emails, and order confirmation. */
export function formatCustomDtfDesignSummary(placements: CustomDtfPlacementInput[], artworkNote?: string): string {
  const { itemized } = priceCustomDtfItem(placements, 0)
  const parts = itemized.map(
    (p) => `${p.label} ${formatDimension(p.widthIn)}"×${formatDimension(p.heightIn)}" (+BDT ${p.priceBdt})`
  )
  const note = artworkNote?.trim()
  const printText = parts.length > 0 ? `DTF: ${parts.join(", ")}` : "DTF Custom (No print)"
  return note ? `${printText} | Artwork: ${note}` : printText
}
