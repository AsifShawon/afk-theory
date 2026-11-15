import test from "node:test"
import assert from "node:assert/strict"
import { resolveVariantStock, sumTrackedStock } from "../stock"

test("Variant stock is never invented", async (t) => {
  await t.test("1. Tracked variant with quantity is in stock", () => {
    assert.deepEqual(
      resolveVariantStock({ manageInventory: true, allowBackorder: false, inventoryQuantity: 7 }),
      { inStock: true, inventoryQuantity: 7 }
    )
  })

  await t.test("2. Tracked variant with zero quantity is sold out", () => {
    assert.deepEqual(
      resolveVariantStock({ manageInventory: true, allowBackorder: false, inventoryQuantity: 0 }),
      { inStock: false, inventoryQuantity: 0 }
    )
  })

  await t.test("3. Tracked variant with unknown quantity is NOT reported as in stock", () => {
    for (const missing of [undefined, null]) {
      const result = resolveVariantStock({
        manageInventory: true,
        allowBackorder: false,
        inventoryQuantity: missing,
      })
      assert.equal(result.inStock, false)
      assert.equal(result.inventoryQuantity, undefined)
    }
  })

  await t.test("4. Untracked variant is always purchasable with no quantity shown", () => {
    assert.deepEqual(
      resolveVariantStock({ manageInventory: false, allowBackorder: false, inventoryQuantity: undefined }),
      { inStock: true, inventoryQuantity: undefined }
    )
  })

  await t.test("5. Backorder keeps a zero-quantity variant purchasable", () => {
    const result = resolveVariantStock({
      manageInventory: true,
      allowBackorder: true,
      inventoryQuantity: 0,
    })
    assert.equal(result.inStock, true)
  })
})

test("Product total stock only reports trustworthy numbers", async (t) => {
  await t.test("6. Sums quantities when every variant is tracked and known", () => {
    assert.equal(
      sumTrackedStock([
        { manageInventory: true, inventoryQuantity: 3 },
        { manageInventory: true, inventoryQuantity: 2 },
      ]),
      5
    )
  })

  await t.test("7. Negative quantities do not reduce the total", () => {
    assert.equal(
      sumTrackedStock([
        { manageInventory: true, inventoryQuantity: 4 },
        { manageInventory: true, inventoryQuantity: -2 },
      ]),
      4
    )
  })

  await t.test("8. Any untracked or unknown variant makes the total undefined", () => {
    assert.equal(
      sumTrackedStock([
        { manageInventory: true, inventoryQuantity: 3 },
        { manageInventory: false, inventoryQuantity: undefined },
      ]),
      undefined
    )
    assert.equal(
      sumTrackedStock([
        { manageInventory: true, inventoryQuantity: 3 },
        { manageInventory: true, inventoryQuantity: undefined },
      ]),
      undefined
    )
  })

  await t.test("9. No variants gives undefined", () => {
    assert.equal(sumTrackedStock([]), undefined)
  })
})
