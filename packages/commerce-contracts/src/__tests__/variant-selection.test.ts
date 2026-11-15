import test from "node:test"
import assert from "node:assert/strict"
import type { ProductVariantView } from "../catalog"
import {
  applyOptionChange,
  findVariantByOptions,
  pickInitialSelection,
} from "../variant-selection"

function variant(
  id: string,
  size: string,
  color: string,
  inStock = true
): ProductVariantView {
  return {
    id,
    title: `${size} / ${color}`,
    sku: id,
    price: { amount: 1450, currencyCode: "bdt", formatted: "BDT 1,450" },
    options: { size, color },
    manageInventory: true,
    inStock,
  }
}

// Black has S, M, L; White has only S and M (no L); Chartreuse is sold out in S.
const variants: ProductVariantView[] = [
  variant("black-s", "S", "Black"),
  variant("black-m", "M", "Black"),
  variant("black-l", "L", "Black"),
  variant("white-s", "S", "White"),
  variant("white-m", "M", "White"),
  variant("lime-s", "S", "Lime", false),
  variant("lime-m", "M", "Lime"),
]

test("Variant selection resolves exact combinations only", async (t) => {
  await t.test("1. Exact match is found, case-insensitively", () => {
    const found = findVariantByOptions(variants, { size: "m", color: "WHITE" })
    assert.equal(found?.id, "white-m")
  })

  await t.test("2. A missing combination never falls back to another variant", () => {
    assert.equal(
      findVariantByOptions(variants, { size: "L", color: "White" }),
      undefined
    )
  })

  await t.test("3. Empty variant list resolves to nothing", () => {
    assert.equal(findVariantByOptions([], { size: "M" }), undefined)
  })
})

test("Initial selection prefers a purchasable variant", async (t) => {
  await t.test("4. Skips a sold-out first variant", () => {
    const list = [variant("a", "S", "Lime", false), variant("b", "M", "Lime")]
    assert.deepEqual(pickInitialSelection(list), { size: "M", color: "Lime" })
  })

  await t.test("5. Uses the first variant when everything is sold out", () => {
    const list = [variant("a", "S", "Lime", false), variant("b", "M", "Lime", false)]
    assert.deepEqual(pickInitialSelection(list), { size: "S", color: "Lime" })
  })

  await t.test("6. No variants gives an empty selection", () => {
    assert.deepEqual(pickInitialSelection([]), {})
  })
})

test("Option changes always land on a real variant", async (t) => {
  await t.test("7. Valid change keeps the other option", () => {
    const next = applyOptionChange(variants, { size: "M", color: "Black" }, "Color", "White")
    assert.deepEqual(next, { size: "M", color: "White" })
  })

  await t.test("8. Invalid combination is repaired to an existing variant", () => {
    // Black L selected, switch to White: White has no L.
    const next = applyOptionChange(variants, { size: "L", color: "Black" }, "Color", "White")
    const resolved = findVariantByOptions(variants, next)
    assert.ok(resolved, "selection must resolve to an existing variant")
    assert.equal(resolved?.options.color, "White")
  })

  await t.test("9. Repair prefers a purchasable variant over a sold-out one", () => {
    // Switching to Lime with size S selected: Lime S exists but is sold out,
    // and size is an exact match, so it is kept (customer sees Sold Out).
    const keep = applyOptionChange(variants, { size: "S", color: "Black" }, "Color", "Lime")
    assert.deepEqual(keep, { size: "S", color: "Lime" })

    // Size L has no Lime variant: repair must pick Lime M (in stock) over Lime S (sold out).
    const repaired = applyOptionChange(variants, { size: "L", color: "Black" }, "Color", "Lime")
    assert.equal(findVariantByOptions(variants, repaired)?.id, "lime-m")
  })

  await t.test("10. Unknown value leaves the selection unchanged", () => {
    const current = { size: "M", color: "Black" }
    assert.deepEqual(applyOptionChange(variants, current, "Color", "Purple"), current)
  })
})
