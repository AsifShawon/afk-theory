import assert from "node:assert/strict"
import type { CatalogueProduct } from "@dtc/catalogue-core"
import {
  hasReturnPolicyPage,
  productJsonLd,
  returnPolicyId,
  returnPolicyJsonLd,
  siteJsonLd,
} from "../../components/seo/json-ld"

let passed = 0
function test(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

const mockProduct: CatalogueProduct = {
  id: "prod-1",
  slug: "test-tee",
  name: "Test Drop Shoulder Tee",
  tagline: "Oversized silhouette",
  description: "Heavyweight cotton tee designed in Bangladesh.",
  descriptionHtml: "<p>Heavyweight cotton tee designed in Bangladesh.</p>",
  seoTitle: "Test Tee | AFK THEORY",
  seoDescription: "Shop the Test Tee.",
  priceBdt: 650,
  compareAtBdt: null,
  category: { id: "cat-1", slug: "tees", name: "Tees", parentId: null, trail: ["cat-1"], href: "/c/tees/" },
  isFeatured: false,
  sizes: ["M", "L", "XL"],
  soldOutSizes: [],
  details: { fabric: "100% Cotton", gsm: "240" },
  sizeChart: { columns: ["Size", "Chest"], rows: [{ size: "M", values: ["42"] }] },
  colors: [{ id: "c-1", name: "Black", hex: "#000000", inStock: true }],
  designs: [],
  images: [
    {
      id: "img-1",
      colorId: "c-1",
      designId: null,
      role: "front",
      alt: "Front view of Test Tee",
      width: 1200,
      height: 1600,
      sources: [
        { width: 640, src: "/media/test-640.webp" },
        { width: 1200, src: "/media/test-1200.webp" },
      ],
    },
  ],
  soldOut: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  isNew: false,
  badges: [],
  collectionSlugs: [],
  moreDesigns: [],
  metaContentId: null,
}

test("hasReturnPolicyPage detects published non-empty policy page", () => {
  assert.equal(
    hasReturnPolicyPage([
      { slug: "about", html: "<p>About us</p>" },
      { slug: "delivery-returns", html: "<p>48-hour size exchange policy.</p>" },
    ]),
    true
  )
})

test("hasReturnPolicyPage returns false when delivery-returns is missing", () => {
  assert.equal(hasReturnPolicyPage([{ slug: "about", html: "<p>About us</p>" }]), false)
  assert.equal(hasReturnPolicyPage([]), false)
  assert.equal(hasReturnPolicyPage(undefined), false)
})

test("hasReturnPolicyPage returns false when policy page has empty html", () => {
  assert.equal(hasReturnPolicyPage([{ slug: "delivery-returns", html: "" }]), false)
  assert.equal(hasReturnPolicyPage([{ slug: "delivery-returns", html: "   " }]), false)
  assert.equal(hasReturnPolicyPage([{ slug: "delivery-returns", html: "<p>   </p>" }]), false)
})

test("returnPolicyId and returnPolicyJsonLd use canonical link and stable absolute ID", () => {
  const id = returnPolicyId()
  const policy = returnPolicyJsonLd()
  assert.equal(id, policy["@id"])
  assert.match(id, /\/delivery-returns\/#return-policy$/)
  assert.match(policy.merchantReturnLink, /\/delivery-returns\/$/)
  assert.equal(policy["@type"], "MerchantReturnPolicy")
  assert.equal(policy.applicableCountry, "BD")

  // Ensure no structured refund promises or inferred fees are emitted
  const record = policy as Record<string, unknown>
  assert.equal(record.returnFees, undefined)
  assert.equal(record.returnPolicyCategory, undefined)
  assert.equal(record.merchantReturnDays, undefined)
})

test("siteJsonLd includes return policy on Organization only when non-empty page exists", () => {
  const settings = { instagramHandle: "afktheory", whatsappNumber: "01610689040" }
  const withPolicy = siteJsonLd(settings, [{ slug: "delivery-returns", html: "<p>Exchange terms</p>" }])
  const orgWith = withPolicy.find((item) => (item as Record<string, unknown>)["@type"] === "Organization") as Record<string, unknown>
  assert.ok(orgWith)
  assert.equal(orgWith["@id"], "http://localhost:8100/#organization")
  const policy = orgWith.hasMerchantReturnPolicy as Record<string, unknown>
  assert.ok(policy)
  assert.equal(policy["@type"], "MerchantReturnPolicy")
  assert.equal(policy["@id"], returnPolicyId())

  // When policy is missing or empty
  const withoutPolicy = siteJsonLd(settings, [{ slug: "delivery-returns", html: "<p></p>" }])
  const orgWithout = withoutPolicy.find((item) => (item as Record<string, unknown>)["@type"] === "Organization") as Record<string, unknown>
  assert.equal(orgWithout.hasMerchantReturnPolicy, undefined)
})

test("productJsonLd references policy @id when policy exists, with no dangling ref when absent", () => {
  const policyId = returnPolicyId()
  const withPolicy = productJsonLd(mockProduct, policyId)
  assert.equal(withPolicy["@type"], "Product")
  assert.equal(withPolicy.name, mockProduct.name)
  assert.equal(withPolicy.offers.price, 650)
  assert.equal(withPolicy.offers.priceCurrency, "BDT")
  assert.equal(withPolicy.offers.availability, "https://schema.org/InStock")
  assert.match(withPolicy.offers.url, /\/products\/test-tee\/$/)
  assert.deepEqual(withPolicy.offers.hasMerchantReturnPolicy, { "@id": policyId })

  // When policyId is null, hasMerchantReturnPolicy must be omitted
  const withoutPolicy = productJsonLd(mockProduct, null)
  assert.equal((withoutPolicy.offers as Record<string, unknown>).hasMerchantReturnPolicy, undefined)
})

test("productJsonLd omits shippingDetails, review, and aggregateRating", () => {
  const data = productJsonLd(mockProduct, returnPolicyId()) as Record<string, unknown>
  const offer = data.offers as Record<string, unknown>
  assert.equal(offer.shippingDetails, undefined)
  assert.equal(data.review, undefined)
  assert.equal(data.aggregateRating, undefined)
})

console.log(`json-ld: ${passed} tests passed`)
