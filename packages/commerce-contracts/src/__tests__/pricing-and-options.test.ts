import test from "node:test"
import assert from "node:assert/strict"
import {
  resolvePriceDisplay,
  createMoneyView,
  normalizeOptionKey,
  getVariantOptionValue,
  findMatchingVariant,
  ProductVariantView,
  MoneyView,
} from "../index"

test("Pricing & Discount Precision Test Suite", async (t) => {
  await t.test("Case A: Current == Original (500 BDT == 500 BDT) -> Strictly NO discount", () => {
    const current: MoneyView = { amount: 500, currencyCode: "bdt", formatted: "৳500" }
    const original: MoneyView = { amount: 500, currencyCode: "bdt", formatted: "৳500" }

    const result = resolvePriceDisplay(current, original)

    assert.equal(result.hasDiscount, false)
    assert.equal(result.currentPrice.amount, 500)
    assert.equal(result.originalPrice, undefined, "originalPrice must be undefined when equal to current")
    assert.equal(result.discountPercentage, undefined)
    assert.equal(result.discountFormatted, undefined)
  })

  await t.test("Case B: Current < Original (450 BDT < 500 BDT) -> 10% OFF discount", () => {
    const current: MoneyView = { amount: 450, currencyCode: "bdt", formatted: "৳450" }
    const original: MoneyView = { amount: 500, currencyCode: "bdt", formatted: "৳500" }

    const result = resolvePriceDisplay(current, original)

    assert.equal(result.hasDiscount, true)
    assert.equal(result.currentPrice.amount, 450)
    assert.notEqual(result.originalPrice, undefined)
    assert.equal(result.originalPrice?.amount, 500)
    assert.equal(result.discountPercentage, 10)
    assert.equal(result.discountFormatted, "10% OFF")
  })

  await t.test("Case C: Null or Undefined Original Price -> Strictly NO discount", () => {
    const current: MoneyView = { amount: 500, currencyCode: "bdt", formatted: "৳500" }

    const resultWithNull = resolvePriceDisplay(current, null)
    assert.equal(resultWithNull.hasDiscount, false)
    assert.equal(resultWithNull.originalPrice, undefined)

    const resultWithUndefined = resolvePriceDisplay(current, undefined)
    assert.equal(resultWithUndefined.hasDiscount, false)
    assert.equal(resultWithUndefined.originalPrice, undefined)
  })

  await t.test("Case D: Inverted Price (Current > Original, e.g. price increase) -> Strictly NO discount", () => {
    const current: MoneyView = { amount: 600, currencyCode: "bdt", formatted: "৳600" }
    const original: MoneyView = { amount: 500, currencyCode: "bdt", formatted: "৳500" }

    const result = resolvePriceDisplay(current, original)

    assert.equal(result.hasDiscount, false)
    assert.equal(result.originalPrice, undefined)
    assert.equal(result.discountPercentage, undefined)
  })

  await t.test("Case E: Free Product (Amount == 0) -> Formatted correctly, NO discount", () => {
    const current: MoneyView = { amount: 0, currencyCode: "bdt", formatted: "৳0" }
    const original: MoneyView = { amount: 0, currencyCode: "bdt", formatted: "৳0" }

    const result = resolvePriceDisplay(current, original)

    assert.equal(result.hasDiscount, false)
    assert.equal(result.currentPrice.amount, 0)
    assert.equal(result.currentPrice.formatted, "৳0")
    assert.equal(result.originalPrice, undefined)
  })

  await t.test("BDT Currency Never Produces approxUsd", () => {
    const money = createMoneyView(1250, "bdt")
    assert.equal(money.currencyCode, "bdt")
    assert.equal(money.formatted, "৳1,250")
    assert.equal(money.approxUsd, undefined, "approxUsd must strictly be disabled for BDT")
  })
})

test("Option Normalization & Exact Variant Matching Test Suite", async (t) => {
  const sampleVariants: ProductVariantView[] = [
    {
      id: "var_black_s",
      title: "Black / S",
      options: { color: "Black", size: "S" },
      price: { amount: 500, currencyCode: "bdt", formatted: "৳500" },
      inStock: true,
      inventoryQuantity: 5,
    },
    {
      id: "var_black_m",
      title: "Black / M",
      options: { color: "Black", size: "M" },
      price: { amount: 500, currencyCode: "bdt", formatted: "৳500" },
      inStock: true,
      inventoryQuantity: 10,
    },
    {
      id: "var_beige_s",
      title: "Beige / S",
      options: { color: "Beige", size: "S" },
      price: { amount: 500, currencyCode: "bdt", formatted: "৳500" },
      inStock: true,
      inventoryQuantity: 3,
    },
    {
      id: "var_beige_l",
      title: "Beige / L",
      options: { color: "Beige", size: "L" },
      price: { amount: 500, currencyCode: "bdt", formatted: "৳500" },
      inStock: false,
      inventoryQuantity: 0,
    },
  ]

  await t.test("1. normalizeOptionKey lowercases and trims keys", () => {
    assert.equal(normalizeOptionKey("Color"), "color")
    assert.equal(normalizeOptionKey(" SIZE "), "size")
    assert.equal(normalizeOptionKey("Material"), "material")
  })

  await t.test("2. getVariantOptionValue resolves options regardless of casing", () => {
    const variant = sampleVariants[0]
    assert.equal(getVariantOptionValue(variant, "color"), "Black")
    assert.equal(getVariantOptionValue(variant, "COLOR"), "Black")
    assert.equal(getVariantOptionValue(variant, "Color"), "Black")
    assert.equal(getVariantOptionValue(variant, "size"), "S")
    assert.equal(getVariantOptionValue(variant, "Size"), "S")
  })

  await t.test("3. findMatchingVariant finds exact combination (Beige / S)", () => {
    const matched = findMatchingVariant(sampleVariants, {
      color: "Beige",
      size: "S",
    })
    assert.notEqual(matched, undefined)
    assert.equal(matched?.id, "var_beige_s")
  })

  await t.test("4. Missing combination (Beige / M) MUST return undefined (NO silent fallback to variants[0])", () => {
    const matched = findMatchingVariant(sampleVariants, {
      color: "Beige",
      size: "M",
    })
    assert.equal(matched, undefined, "Missing combination must return undefined, never fallback to first variant")
  })

  await t.test("5. Case insensitive matching works for option values as well", () => {
    const matched = findMatchingVariant(sampleVariants, {
      Color: "black",
      Size: "m",
    })
    assert.notEqual(matched, undefined)
    assert.equal(matched?.id, "var_black_m")
  })

  await t.test("6. Partial selections do not falsely match when multiple options exist", () => {
    // Only specifying color when variant requires color and size
    const matched = findMatchingVariant(sampleVariants, {
      color: "Black",
    })
    assert.equal(matched, undefined)
  })
})
