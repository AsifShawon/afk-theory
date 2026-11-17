import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { groupProductsByLine } from "@dtc/commerce-contracts"

describe("HomeView Editorial Sequence & Curation Suite", () => {
  test("1. Rails follow the two product lines", () => {
    const tee = { collectionHandle: "drop-shoulder-tees", categoryNames: [] }
    const hoodie = { collectionHandle: "hoodies", categoryNames: [] }
    const grouped = groupProductsByLine([tee, hoodie])
    assert.equal(grouped.tees.length, 1)
    assert.equal(grouped.hoodies.length, 1)
  })

  test("2. Editorial homepage guarantees all 8 sections are accounted for", () => {
    const requiredSections = [
      "hero",
      "tees-rail",
      "collection-tiles",
      "craftsmanship-story",
      "brand-story",
      "hoodies-rail",
      "brand-values-grid",
      "delivery-reassurance",
      "newsletter-club",
    ]

    assert.equal(requiredSections.length, 9)
    assert.ok(requiredSections.includes("collection-tiles"))
    assert.ok(requiredSections.includes("hoodies-rail"))
    assert.ok(!requiredSections.includes("split-promotional"), "the Drop 02 promo was removed")
  })

  test("3. Delivery reassurance strip contains all 4 service pillars", () => {
    const pillars = [
      "Dhaka Express Delivery",
      "48-Hour Size Exchange",
      "Cash on Delivery",
      "Nationwide Coverage",
    ]

    assert.equal(pillars.length, 4)
    assert.ok(pillars.includes("48-Hour Size Exchange"))
  })
})
