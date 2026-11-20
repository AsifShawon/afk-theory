import assert from "node:assert/strict"
import { buildCatalogue } from "../build"
import { normalizeInstagramHandle, normalizeMessengerPage, normalizeWhatsappNumber } from "../contact"
import { formatBdt, formatBdtPlain, slugify } from "../format"
import { descriptionToHtml, descriptionToText, truncateText } from "../rich-text"
import { productInputSchema } from "../schema"
import { seedToRawCatalogue } from "../seed"

let passed = 0
function test(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

test("normalizes Bangladeshi WhatsApp numbers", () => {
  assert.equal(normalizeWhatsappNumber("01712-345678"), "8801712345678")
  assert.equal(normalizeWhatsappNumber("+880 1712 345678"), "8801712345678")
  assert.equal(normalizeWhatsappNumber("008801712345678"), "8801712345678")
  assert.equal(normalizeWhatsappNumber("12"), "")
})

test("normalizes Messenger and Instagram handles", () => {
  assert.equal(normalizeMessengerPage("https://m.me/afktheory?ref=x"), "afktheory")
  assert.equal(normalizeMessengerPage("https://www.facebook.com/afk.theory/"), "afk.theory")
  assert.equal(normalizeInstagramHandle("@afk.theory"), "afk.theory")
  assert.equal(normalizeInstagramHandle("https://instagram.com/afk_theory/"), "afk_theory")
})

test("formats prices and slugs", () => {
  assert.equal(formatBdt(1450), "৳1,450")
  assert.equal(formatBdtPlain(2900), "BDT 2,900")
  assert.equal(slugify("  Drop 01: Oversized Tee! "), "drop-01-oversized-tee")
})

test("rejects a compare-at price that is not higher than the price", () => {
  const base = {
    name: "Tee",
    slug: "tee",
    tagline: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    sizeGuideId: null,
    priceBdt: 1000,
    compareAtBdt: 900,
    categoryId: null,
    status: "draft",
    isFeatured: false,
    sizes: ["M"],
    soldOutSizes: [],
    details: {},
    sizeChart: { columns: [], rows: [] },
  }
  assert.equal(productInputSchema.safeParse(base).success, false)
  assert.equal(productInputSchema.safeParse({ ...base, compareAtBdt: 1200 }).success, true)
})

test("builds the seed catalogue with images and stock flags", () => {
  const raw = seedToRawCatalogue()
  const { catalogue, skipped } = buildCatalogue(raw, (img, w) => `/media/${img.path}-${w}.webp`, "fixture")
  assert.equal(skipped.length, 0)
  assert.equal(catalogue.products.length, 1)
  const product = catalogue.products[0]
  assert.equal(product.images[0].role, "front")
  assert.equal(product.images[0].sources[0].src, "/media/seed/drop-01-tee-front-1122.webp")
  assert.equal(product.soldOut, false)
  assert.equal(catalogue.categories.length, 1)
})

test("drops drafts and products without images, and flags sold out products", () => {
  const raw = seedToRawCatalogue()
  const id = raw.products[0].id
  const draft = { ...raw, products: raw.products.map((p) => ({ ...p, status: "draft" as const })) }
  assert.equal(buildCatalogue(draft, () => "", "fixture").catalogue.products.length, 0)

  const noImages = { ...raw, images: [] }
  const built = buildCatalogue(noImages, () => "", "fixture")
  assert.equal(built.catalogue.products.length, 0)
  assert.equal(built.skipped.length, 1)

  const allSoldOut = {
    ...raw,
    products: raw.products.map((p) => (p.id === id ? { ...p, sold_out_sizes: p.sizes } : p)),
  }
  assert.equal(buildCatalogue(allSoldOut, () => "", "fixture").catalogue.products[0].soldOut, true)
})

test("sanitizes description HTML and keeps the formatting tags", () => {
  const html = descriptionToHtml(
    '<h1>Fit</h1><p onclick="x()">Soft <b>heavy</b> <i>cotton</i></p><script>alert(1)</script><blockquote>Quote</blockquote><a href="javascript:alert(1)">bad</a><a href="https://afktheory.com">good</a><p></p>'
  )
  assert.equal(
    html,
    '<h2>Fit</h2><p>Soft <strong>heavy</strong> <em>cotton</em></p><blockquote>Quote</blockquote><a>bad</a><a href="https://afktheory.com" target="_blank" rel="noopener noreferrer">good</a>'
  )
})

test("turns older plain-text descriptions into paragraphs", () => {
  assert.equal(descriptionToHtml("Line one\nline two\n\nNext <para>"), "<p>Line one<br>line two</p><p>Next &lt;para&gt;</p>")
  assert.equal(descriptionToText("<h2>Fit</h2><p>Boxy &amp; <strong>soft</strong></p><ul><li>240 GSM</li></ul>"), "Fit Boxy & soft 240 GSM")
  assert.equal(truncateText("one two three four", 12), "one two…")
})

test("uses the linked shared size guide over the product's own chart", () => {
  const raw = seedToRawCatalogue()
  const guide = {
    id: "00000000-0000-4000-8000-0000000009aa",
    name: "Oversized tee",
    unit: "inches",
    columns: ["Chest", "Length"],
    rows: [{ size: "M", values: ["23", "29"] }],
    note: "Measured flat",
    sort_order: 0,
  }
  const linked = {
    ...raw,
    sizeGuides: [guide],
    products: raw.products.map((p) => ({ ...p, size_guide_id: guide.id, seo_title: " Tee | AFK ", seo_description: "Heavy tee" })),
  }
  const product = buildCatalogue(linked, () => "", "fixture").catalogue.products[0]
  assert.deepEqual(product.sizeChart, { columns: ["Chest", "Length"], rows: guide.rows, unit: "inches", note: "Measured flat" })
  assert.equal(product.seoTitle, "Tee | AFK")
  assert.equal(product.seoDescription, "Heavy tee")

  const missingGuide = { ...linked, sizeGuides: [] }
  assert.deepEqual(buildCatalogue(missingGuide, () => "", "fixture").catalogue.products[0].sizeChart, raw.products[0].size_chart)
})

console.log(`catalogue-core: ${passed} tests passed`)
