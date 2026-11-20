import assert from "node:assert/strict"
import { buildCatalogue } from "../build"
import { normalizeInstagramHandle, normalizeMessengerPage, normalizeWhatsappNumber } from "../contact"
import { formatBdt, formatBdtPlain, slugify } from "../format"
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

console.log(`catalogue-core: ${passed} tests passed`)
