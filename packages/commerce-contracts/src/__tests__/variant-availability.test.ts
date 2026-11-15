import test from "node:test"
import assert from "node:assert/strict"
import type { ImageView, ProductVariantView } from "../catalog"
import {
  getGalleryImages,
  getMaxPurchasableQuantity,
  getOptionValueAvailability,
} from "../variant-selection"

const img = (id: string): ImageView => ({ id, url: `https://cdn.test/${id}.webp` })

function variant(
  id: string,
  size: string,
  color: string,
  inStock: boolean,
  images: ImageView[] = []
): ProductVariantView {
  return {
    id,
    title: `${size} / ${color}`,
    sku: id,
    price: { amount: 1450, currencyCode: "bdt", formatted: "BDT 1,450" },
    options: { size, color },
    manageInventory: true,
    inStock,
    images,
  }
}

const front = img("front")
const back = img("back")
const blackFront = img("black-front")
const blackBack = img("black-back")
const limeFront = img("lime-front")

const variants: ProductVariantView[] = [
  variant("black-s", "S", "Black", true, [blackFront, blackBack]),
  variant("black-m", "M", "Black", false, [blackFront]),
  variant("lime-s", "S", "Lime", false, [limeFront]),
  variant("lime-m", "M", "Lime", false, [limeFront]),
]

const options = [
  { id: "o1", title: "Size", values: ["S", "M"] },
  { id: "o2", title: "Color", values: ["Black", "Lime"] },
]

test("Option value availability reflects stock for the current selection", async (t) => {
  await t.test("1. In-stock size for the selected colour is available", () => {
    assert.equal(
      getOptionValueAvailability(variants, { size: "S", color: "Black" }, "Size", "S"),
      "available"
    )
  })

  await t.test("2. Sold-out size for the selected colour is flagged", () => {
    assert.equal(
      getOptionValueAvailability(variants, { size: "S", color: "Black" }, "Size", "M"),
      "sold_out"
    )
  })

  await t.test("3. A colour with every variant sold out is flagged", () => {
    assert.equal(
      getOptionValueAvailability(variants, { size: "S", color: "Black" }, "Color", "Lime"),
      "sold_out"
    )
  })

  await t.test("4. Colour is judged against the selected size", () => {
    // Black M is sold out, so with size M selected Black reads as sold out.
    assert.equal(
      getOptionValueAvailability(variants, { size: "M", color: "Lime" }, "Color", "Black"),
      "sold_out"
    )
  })

  await t.test("5. Missing combination falls back to any purchasable variant of the value", () => {
    const list = [variant("a-s", "S", "Black", true), variant("b-m", "M", "Lime", true)]
    // Black M does not exist; Black still has a purchasable variant (S).
    assert.equal(
      getOptionValueAvailability(list, { size: "M", color: "Lime" }, "Color", "Black"),
      "available"
    )
  })
})

test("Max purchasable quantity follows inventory rules", async (t) => {
  const base = { manageInventory: true, allowBackorder: false, inStock: true }

  await t.test("6. Tracked stock caps the quantity", () => {
    assert.equal(getMaxPurchasableQuantity({ ...base, inventoryQuantity: 4 }), 4)
  })

  await t.test("7. Sold-out variant allows none", () => {
    assert.equal(
      getMaxPurchasableQuantity({ ...base, inStock: false, inventoryQuantity: 0 }),
      0
    )
  })

  await t.test("8. Untracked, backorder and unknown quantity have no stock cap", () => {
    assert.equal(
      getMaxPurchasableQuantity({ ...base, manageInventory: false, inventoryQuantity: undefined }),
      undefined
    )
    assert.equal(
      getMaxPurchasableQuantity({ ...base, allowBackorder: true, inventoryQuantity: 0 }),
      undefined
    )
    assert.equal(
      getMaxPurchasableQuantity({ ...base, inventoryQuantity: undefined }),
      undefined
    )
    assert.equal(getMaxPurchasableQuantity(undefined), undefined)
  })
})

test("Gallery follows the selected colour", async (t) => {
  const product = { images: [front, back, blackFront, blackBack, limeFront], options, variants }

  await t.test("9. Selected colour shows only its linked images, in product order", () => {
    const gallery = getGalleryImages(product, { size: "S", color: "Black" })
    assert.deepEqual(gallery.map((i) => i.id), ["black-front", "black-back"])
  })

  await t.test("10. Another colour shows its own images", () => {
    const gallery = getGalleryImages(product, { size: "S", color: "Lime" })
    assert.deepEqual(gallery.map((i) => i.id), ["lime-front"])
  })

  await t.test("11. Colour without linked images shows the full product gallery", () => {
    const unlinked = [variant("white-s", "S", "White", true)]
    const gallery = getGalleryImages(
      {
        images: [front, back],
        options: [{ id: "o2", title: "Color", values: ["White"] }, options[0]],
        variants: unlinked,
      },
      { size: "S", color: "White" }
    )
    assert.deepEqual(gallery.map((i) => i.id), ["front", "back"])
  })

  await t.test("12. Product without a colour option uses the selected variant images", () => {
    const sizeOnly = [
      variant("s", "S", "-", true, [front]),
      variant("m", "M", "-", true, [back]),
    ]
    const gallery = getGalleryImages(
      { images: [front, back], options: [options[0]], variants: sizeOnly },
      { size: "M", color: "-" }
    )
    assert.deepEqual(gallery.map((i) => i.id), ["back"])
  })
})

test("Variant option lookup ignores key casing", async (t) => {
  const { getVariantOption } = await import("../variant-selection")

  await t.test("13. Finds lower-case and capitalised keys alike", () => {
    assert.equal(getVariantOption({ options: { color: "Black" } }, "Color"), "Black")
    assert.equal(getVariantOption({ options: { Size: "M" } }, "size"), "M")
  })

  await t.test("14. Missing option returns undefined", () => {
    assert.equal(getVariantOption({ options: { size: "M" } }, "Color"), undefined)
  })
})
