import test from "node:test"
import assert from "node:assert/strict"
import {
  HOODIES_LINE,
  LEGACY_TEE_CATEGORY_HANDLE,
  PRODUCT_LINES,
  TEES_LINE,
  getProductLine,
  getShownCategoryHandles,
  groupProductsByLine,
  lineHref,
  productBelongsToLine,
  styleHref,
} from "../catalog-structure"

const routes = {
  collection: (handle: string) => `/collections/${handle}`,
  category: (handle: string) => `/categories/${handle}`,
}

test("The catalog is two product lines", async (t) => {
  await t.test("1. Tees and hoodies, with the described colors and styles", () => {
    assert.equal(PRODUCT_LINES.length, 2)
    assert.equal(TEES_LINE.colorCount, 3)
    assert.deepEqual(
      HOODIES_LINE.styles.map((s) => [s.handle, s.colorCount]),
      [
        ["basic-hoodie", 2],
        ["drop-shoulder-hoodie", 3],
      ]
    )
  })

  await t.test("2. Handles are unique and lookup works", () => {
    const handles = PRODUCT_LINES.map((l) => l.handle)
    assert.equal(new Set(handles).size, handles.length)
    assert.equal(getProductLine("hoodies")?.title, "Hoodies")
    assert.equal(getProductLine("shirts"), undefined)
  })

  await t.test("3. Links use collection routes for lines and category routes for styles", () => {
    assert.equal(lineHref(routes, TEES_LINE), "/collections/drop-shoulder-tees")
    assert.equal(styleHref(routes, HOODIES_LINE.styles[0]), "/categories/basic-hoodie")
  })
})

test("Products are matched to their line", async (t) => {
  await t.test("4. By collection handle", () => {
    assert.equal(
      productBelongsToLine({ collectionHandle: "hoodies", categoryNames: [] }, HOODIES_LINE),
      true
    )
    assert.equal(
      productBelongsToLine({ collectionHandle: "hoodies", categoryNames: [] }, TEES_LINE),
      false
    )
  })

  await t.test("5. Existing tees in the earlier category still count as tees", () => {
    assert.equal(
      productBelongsToLine(
        { collectionHandle: "essentials", categoryNames: ["Drop Shoulder T-Shirts"] },
        TEES_LINE
      ),
      true
    )
    assert.equal(
      productBelongsToLine(
        { collectionHandle: "essentials", categoryNames: ["Drop Shoulder T-Shirts"] },
        HOODIES_LINE
      ),
      false
    )
  })

  await t.test("6. Shop filter only offers current categories", () => {
    assert.deepEqual(getShownCategoryHandles(), [
      LEGACY_TEE_CATEGORY_HANDLE,
      "basic-hoodie",
      "drop-shoulder-hoodie",
    ])
  })
})

test("Home page rails", async (t) => {
  const tee = { collectionHandle: "drop-shoulder-tees", categoryNames: [] }
  const hoodie = { collectionHandle: "hoodies", categoryNames: [] }
  const untagged = { collectionHandle: undefined, categoryNames: [] }

  await t.test("7. Products are grouped by line", () => {
    const grouped = groupProductsByLine([tee, hoodie, tee])
    assert.equal(grouped.tees.length, 2)
    assert.equal(grouped.hoodies.length, 1)
  })

  await t.test("8. A store with no tagged products still shows everything in the tees rail", () => {
    const grouped = groupProductsByLine([untagged, untagged])
    assert.equal(grouped.tees.length, 2)
    assert.equal(grouped.hoodies.length, 0)
  })

  await t.test("9. Hoodies only: the tees rail stays empty instead of repeating hoodies", () => {
    const grouped = groupProductsByLine([hoodie])
    assert.equal(grouped.tees.length, 0)
    assert.equal(grouped.hoodies.length, 1)
  })
})
