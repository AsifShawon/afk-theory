import { CurrencyCode, MoneyView, createMoneyView } from "./money"

export interface PriceDisplay {
  currentPrice: MoneyView
  originalPrice?: MoneyView
  hasDiscount: boolean
  discountPercentage?: number
  discountFormatted?: string
  isFree: boolean
}

/**
 * Resolves accurate price presentation and discount logic.
 *
 * Rules:
 * - A genuine compare-at discount exists IF AND ONLY IF:
 *   1. A valid current price exists.
 *   2. A valid original price exists.
 *   3. originalPrice.amount > currentPrice.amount (STRICTLY GREATER).
 *   4. Both amounts are positive valid numbers.
 * - If originalPrice <= currentPrice (e.g. 500 and 500), hasDiscount is FALSE and originalPrice is undefined.
 * - Zero amount is legitimate free product (isFree: true).
 */
export function resolvePriceDisplay(
  current: MoneyView | number | null | undefined,
  original?: MoneyView | number | null | undefined,
  currencyCode: CurrencyCode = "bdt"
): PriceDisplay {
  const currentAmount =
    typeof current === "number"
      ? current
      : current && typeof current === "object"
        ? current.amount
        : 0

  const originalAmount =
    typeof original === "number"
      ? original
      : original && typeof original === "object"
        ? original.amount
        : undefined

  const isFree = currentAmount === 0

  const currentPrice: MoneyView =
    typeof current === "object" && current?.formatted
      ? current
      : createMoneyView(currentAmount, currencyCode)

  const hasDiscount = Boolean(
    originalAmount !== undefined &&
      !Number.isNaN(originalAmount) &&
      originalAmount > currentAmount &&
      currentAmount >= 0
  )

  if (hasDiscount && originalAmount !== undefined) {
    const diff = originalAmount - currentAmount
    const pct = Math.round((diff / originalAmount) * 100)
    const originalPriceView: MoneyView =
      typeof original === "object" && original?.formatted
        ? original
        : createMoneyView(originalAmount, currencyCode)

    return {
      currentPrice,
      originalPrice: originalPriceView,
      hasDiscount: true,
      discountPercentage: pct,
      discountFormatted: `${pct}% OFF`,
      isFree,
    }
  }

  return {
    currentPrice,
    originalPrice: undefined,
    hasDiscount: false,
    discountPercentage: undefined,
    discountFormatted: undefined,
    isFree,
  }
}
