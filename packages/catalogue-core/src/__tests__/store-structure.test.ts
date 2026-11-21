import assert from "node:assert/strict"
import { buildCatalogue, usedImageObjects } from "../build"
import { buildCategoryTree, categoryAndDescendantIds, flattenTree, resolveParents } from "../category-tree"
import { applyListing, filterProducts, listingFacets, sortProducts, type ListingProduct } from "../listing"
import { newestFirst, pickMenuProducts, type MenuCandidate } from "../menu"
import { homeSectionsInputSchema, productInputSchema } from "../schema"
import { editDistance, matchWord, scoreSearchEntry, searchCatalogue } from "../search"
import { seedToRawCatalogue } from "../seed"
import { normalizeHomeSections } from "../store-defaults"
import type { CategoryRow, ProductRow, RawCatalogue, SearchIndexEntry } from "../types"

let passed = 0
function test(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`
const cat = (n: number, slug: string, parent: number | null, sort = 0): CategoryRow => ({
  id: uuid(n),
  slug,
  name: slug.replace(/-/g, " "),
  sort_order: sort,
  parent_id: parent === null ? null : uuid(parent),
})

/* ------------------------------------------------------------ category tree */

test("builds a category tree with full paths in sort order", () => {
  const rows = [cat(1, "tees", null, 1), cat(2, "hoodies", null, 0), cat(3, "drop-shoulder", 1, 1), cat(4, "boxy", 1, 0), cat(5, "zip", 2)]
  const tree = buildCategoryTree(rows)
  assert.deepEqual(
    tree.map((n) => n.row.slug),
    ["hoodies", "tees"]
  )
  const tees = tree[1]
  assert.deepEqual(
    tees.children.map((n) => n.href),
    ["/c/tees/boxy/", "/c/tees/drop-shoulder/"]
  )
  assert.deepEqual(tees.children[1].trail, [uuid(1), uuid(3)])
  assert.equal(tees.children[1].depth, 1)
  assert.deepEqual(
    flattenTree(tree).map((n) => n.row.slug),
    ["hoodies", "zip", "tees", "boxy", "drop-shoulder"]
  )
  assert.deepEqual([...categoryAndDescendantIds(rows, uuid(1))].sort(), [uuid(1), uuid(3), uuid(4)].sort())
})

test("treats missing parents and loops as top-level", () => {
  const rows = [cat(1, "a", 2, 0), cat(2, "b", 1, 1), cat(3, "c", 99), cat(4, "d", 4)]
  const parents = resolveParents(rows)
  assert.equal(parents.get(uuid(1)), null, "first loop member in sort order is cut")
  assert.equal(parents.get(uuid(2)), uuid(1))
  assert.equal(parents.get(uuid(3)), null)
  assert.equal(parents.get(uuid(4)), null)
  const tree = buildCategoryTree(rows)
  assert.equal(flattenTree(tree).length, 4)
  assert.equal(tree.find((n) => n.row.slug === "a")?.children[0].href, "/c/a/b/")
})

/* ------------------------------------------------------------ menu */

test("menu uses valid picks in order, else the newest products of the category", () => {
  const products: MenuCandidate[] = [
    { id: "p1", slug: "old", createdAt: "2026-01-01T00:00:00Z", categoryTrail: ["tees"] },
    { id: "p2", slug: "newest", createdAt: "2026-11-01T00:00:00Z", categoryTrail: ["tees", "boxy"] },
    { id: "p3", slug: "middle", createdAt: "2026-06-01T00:00:00Z", categoryTrail: ["tees"] },
    { id: "p4", slug: "hoodie", createdAt: "2026-11-10T00:00:00Z", categoryTrail: ["hoodies"] },
  ]
  assert.deepEqual(pickMenuProducts("tees", ["p3", "p1"], products), ["middle", "old"])
  assert.deepEqual(pickMenuProducts("tees", [], products), ["newest", "middle"])
  // A pick that moved to another category, or is no longer published, is ignored.
  assert.deepEqual(pickMenuProducts("tees", ["p4", "gone"], products), ["newest", "middle"])
  assert.deepEqual(pickMenuProducts("tees", ["p4", "p1"], products), ["old"])
  assert.deepEqual(pickMenuProducts("boxy", [], products), ["newest"])
  assert.deepEqual(pickMenuProducts("caps", [], products), [])
  assert.deepEqual(
    newestFirst([
      { createdAt: "2026-01-01T00:00:00Z", n: 1 },
      { createdAt: "2026-01-01T00:00:00Z", n: 2 },
    ]).map((x) => x.n),
    [1, 2]
  )
})

/* ------------------------------------------------------------ listing */

const item = (over: Partial<ListingProduct> & { name: string }): ListingProduct & { name: string } => ({
  priceBdt: 1000,
  isFeatured: false,
  soldOut: false,
  createdAt: "2026-01-01T00:00:00Z",
  sizes: ["S", "M", "L"],
  soldOutSizes: [],
  colors: [{ name: "Graphite Black", hex: "#20241F", inStock: true }],
  category: { trail: ["tees"] },
  ...over,
})

const listing = [
  item({ name: "a", priceBdt: 1450 }),
  item({ name: "b", priceBdt: 990, isFeatured: true, createdAt: "2026-10-01T00:00:00Z", colors: [{ name: "Bone White", hex: "#F5F3ED", inStock: true }] }),
  item({ name: "c", priceBdt: 2200, category: { trail: ["hoodies"] }, sizes: ["M", "XL"], soldOutSizes: ["M"] }),
  item({ name: "d", priceBdt: 1200, soldOut: true, isFeatured: true, category: { trail: ["tees", "boxy"] } }),
  item({ name: "e", priceBdt: 1450, createdAt: "2026-11-01T00:00:00Z", category: null }),
]
const names = (list: { name: string }[]) => list.map((p) => p.name).join("")

test("filters by category including subcategories, color, size, price and stock", () => {
  assert.equal(names(filterProducts(listing, { categoryIds: ["tees"] })), "abd")
  assert.equal(names(filterProducts(listing, { categoryIds: ["boxy", "hoodies"] })), "cd")
  assert.equal(names(filterProducts(listing, { colors: ["bone white"] })), "b")
  assert.equal(names(filterProducts(listing, { sizes: ["m"] })), "abde", "M is sold out on c")
  assert.equal(names(filterProducts(listing, { sizes: ["XL"] })), "c")
  assert.equal(names(filterProducts(listing, { minPrice: 1000, maxPrice: 1450 })), "ade")
  assert.equal(names(filterProducts(listing, { inStockOnly: true })), "abce")
  assert.equal(names(filterProducts(listing, { colors: [], sizes: [], minPrice: null })), "abcde")
})

test("sorts featured, newest and by price with sold-out products last", () => {
  assert.equal(names(sortProducts(listing, "featured")), "baced")
  assert.equal(names(sortProducts(listing, "newest")), "ebacd")
  assert.equal(names(sortProducts(listing, "price-asc")), "baecd")
  assert.equal(names(sortProducts(listing, "price-desc")), "caebd")
  assert.equal(names(applyListing(listing, { categoryIds: ["tees"] }, "price-asc")), "bad")
  assert.equal(names(listing), "abcde", "sorting does not change the input")
})

test("lists facets with counts", () => {
  const facets = listingFacets(listing)
  assert.deepEqual(
    facets.colors.map((c) => [c.name, c.count]),
    [
      ["Graphite Black", 4],
      ["Bone White", 1],
    ]
  )
  assert.deepEqual(
    facets.sizes.map((s) => s.size),
    ["S", "M", "L", "XL"]
  )
  assert.deepEqual(facets.price, { min: 990, max: 2200 })
  assert.equal(facets.inStockCount, 4)
  assert.equal(listingFacets([]).price, null)
})

/* ------------------------------------------------------------ search */

const entry = (over: Partial<SearchIndexEntry> & { slug: string; name: string }): SearchIndexEntry => ({
  category: "",
  colors: [],
  designs: [],
  priceBdt: 1000,
  soldOut: false,
  image: null,
  ...over,
})

const index = [
  entry({ slug: "tee", name: "Drop 01 Oversized Tee", category: "T-Shirts", colors: ["Graphite Black", "Bone White"] }),
  entry({ slug: "hoodie", name: "Heavyweight Hoodie", category: "Hoodies", colors: ["Electric Chartreuse"] }),
  entry({ slug: "back", name: "Pause Graphic Tee", category: "T-Shirts / Graphic", designs: ["Back design"] }),
]

test("measures edit distance with swaps", () => {
  assert.equal(editDistance("hodie", "hoodie"), 1)
  assert.equal(editDistance("blakc", "black"), 1)
  assert.equal(editDistance("abc", "abc"), 0)
  assert.equal(editDistance("kitten", "sitting", 2), 3, "stops once the limit is passed")
})

test("matches words exactly, by prefix and with small typos", () => {
  assert.equal(matchWord("tee", "tee"), 1)
  assert.ok(matchWord("hood", "hoodie") > matchWord("hodie", "hoodie"))
  assert.ok(matchWord("hodie", "hoodie") > 0)
  assert.ok(matchWord("hodi", "hoodie") > 0, "typo while still typing")
  assert.equal(matchWord("tea", "tee"), 0, "short words need an exact or prefix match")
})

test("scores search results by name, then category, colors and designs", () => {
  assert.deepEqual(
    searchCatalogue(index, "tee").map((e) => e.slug),
    ["tee", "back"]
  )
  assert.deepEqual(
    searchCatalogue(index, "hodie").map((e) => e.slug),
    ["hoodie"]
  )
  assert.deepEqual(
    searchCatalogue(index, "blak tee").map((e) => e.slug),
    ["tee"]
  )
  assert.deepEqual(
    searchCatalogue(index, "back design").map((e) => e.slug),
    ["back"]
  )
  assert.deepEqual(
    searchCatalogue(index, "graphic").map((e) => e.slug),
    ["back", "tee"],
    "name beats a color match"
  )
  assert.deepEqual(searchCatalogue(index, "xyz"), [])
  assert.deepEqual(searchCatalogue(index, "   "), [])
  assert.ok(scoreSearchEntry(index[0], "Drop 01") > scoreSearchEntry(index[2], "Drop 01"))
})

/* ------------------------------------------------------------ home sections and schemas */

test("normalizes homepage sections and appends new ones", () => {
  const sections = normalizeHomeSections([
    { id: "faq", enabled: false },
    { id: "lookbook", enabled: true },
    { id: "faq", enabled: true },
    { id: "unknown", enabled: true },
    "junk",
  ])
  assert.deepEqual(sections.slice(0, 2), [
    { id: "faq", enabled: false },
    { id: "lookbook", enabled: true },
  ])
  assert.equal(sections.length, 9)
  assert.ok(sections.slice(2).every((s) => s.enabled))
  assert.equal(normalizeHomeSections(null)[0].id, "categories")
  assert.equal(homeSectionsInputSchema.safeParse([{ id: "faq", enabled: true }, { id: "faq", enabled: false }]).success, false)
})

test("product input defaults the new store fields", () => {
  const parsed = productInputSchema.parse({
    name: "Tee",
    slug: "tee",
    tagline: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    sizeGuideId: null,
    priceBdt: 1000,
    compareAtBdt: null,
    categoryId: null,
    status: "draft",
    isFeatured: false,
    sizes: ["M"],
    soldOutSizes: [],
    details: {},
    sizeChart: { columns: [], rows: [] },
  })
  assert.equal(parsed.badge, "none")
  assert.equal(parsed.designGroup, "")
  assert.deepEqual(parsed.collectionIds, [])
})

/* ------------------------------------------------------------ buildCatalogue */

const NOW = new Date("2026-11-21T00:00:00Z")

/** Seed plus a child category, a second product with designs, collections, picks and pages. */
function storeFixture(): RawCatalogue {
  const raw = seedToRawCatalogue()
  const tees = raw.categories[0]
  const boxy: CategoryRow = { id: uuid(901), slug: "boxy", name: "Boxy", sort_order: 1, parent_id: tees.id, show_in_menu: true }
  const caps: CategoryRow = { id: uuid(902), slug: "caps", name: "Caps", sort_order: 2, image_path: "categories/caps/x", image_widths: [640], image_width: 640, image_height: 800 }
  const base = raw.products[0]
  const second: ProductRow = {
    ...base,
    id: uuid(910),
    slug: "pause-graphic-tee",
    name: "Pause Graphic Tee",
    category_id: boxy.id,
    sort_order: 1,
    compare_at_bdt: 1800,
    badge: "bestseller",
    design_group: "Pause",
    created_at: "2026-11-10T00:00:00Z",
  }
  const draft: ProductRow = { ...base, id: uuid(911), slug: "draft-tee", status: "draft", design_group: "pause", sort_order: 2 }
  const third: ProductRow = { ...base, id: uuid(912), slug: "pause-back-tee", name: "Pause Back Tee", design_group: " PAUSE ", sort_order: 3, badge: "new" }
  const image = raw.images[0]
  return {
    ...raw,
    categories: [...raw.categories, boxy, caps],
    products: [{ ...base, design_group: "" }, second, draft, third],
    images: [
      ...raw.images,
      { ...image, id: uuid(920), product_id: second.id, color_id: null, design_id: uuid(930), sort_order: 0 },
      { ...image, id: uuid(921), product_id: second.id, color_id: null, design_id: uuid(999), sort_order: 1 },
      { ...image, id: uuid(922), product_id: draft.id },
      { ...image, id: uuid(923), product_id: third.id },
    ],
    designs: [
      { id: uuid(931), product_id: second.id, name: "Back design", in_stock: false, sort_order: 1 },
      { id: uuid(930), product_id: second.id, name: "Front design", in_stock: true, sort_order: 0 },
    ],
    collections: [
      ...raw.collections,
      {
        ...raw.collections[0],
        id: uuid(940),
        slug: "empty",
        name: "Empty",
        sort_order: 5,
        image_path: "collections/empty/x",
        image_widths: [640],
        image_width: 640,
        image_height: 800,
      },
      { ...raw.collections[0], id: uuid(941), slug: "pause", name: "Pause", sort_order: 1, image_path: "collections/pause/y", image_widths: [1080, 640], image_width: 1080, image_height: 1350 },
    ],
    productCollections: [
      ...raw.productCollections,
      { product_id: second.id, collection_id: uuid(941), sort_order: 1 },
      { product_id: third.id, collection_id: uuid(941), sort_order: 0 },
      { product_id: draft.id, collection_id: uuid(941), sort_order: 2 },
    ],
    menuProducts: [{ category_id: tees.id, product_id: third.id, sort_order: 0 }],
    pages: [
      { id: uuid(950), slug: "terms", title: "Terms", html: "<p>Be kind</p><script>x</script>", seo_title: "", seo_description: "", created_at: "", updated_at: "2026-11-20T00:00:00Z" },
      { id: uuid(951), slug: "about", title: "About", html: "<h1>Us</h1>", seo_title: " About us ", seo_description: "", created_at: "", updated_at: "" },
      { id: uuid(952), slug: "privacy", title: "Privacy", html: "", seo_title: "", seo_description: "", created_at: "", updated_at: "" },
    ],
    settings: raw.settings ? { ...raw.settings, home_sections: [{ id: "faq", enabled: false }] } : null,
  }
}

test("builds the tree, collections, menu, designs, badges and pages", () => {
  const raw = storeFixture()
  const { catalogue } = buildCatalogue(raw, (img, w) => `/media/${img.path}-${w}.webp`, "fixture", { now: NOW })
  assert.deepEqual(
    catalogue.products.map((p) => p.slug),
    ["drop-01-oversized-tee", "pause-graphic-tee", "pause-back-tee"]
  )

  // Category tree: caps has no products and is left out.
  assert.equal(catalogue.categoryTree.length, 1)
  const tees = catalogue.categoryTree[0]
  assert.equal(tees.productCount, 3)
  assert.equal(tees.children[0].href, "/c/t-shirts/boxy/")
  assert.equal(tees.children[0].productCount, 1)
  assert.deepEqual(
    catalogue.categories.map((c) => c.slug),
    ["t-shirts", "boxy"]
  )

  const graphic = catalogue.products.find((p) => p.slug === "pause-graphic-tee")!
  assert.deepEqual(graphic.category?.trail, [raw.categories[0].id, uuid(901)])
  assert.deepEqual(
    graphic.designs.map((d) => d.name),
    ["Front design", "Back design"]
  )
  assert.equal(graphic.images[0].designId, uuid(930))
  assert.equal(graphic.images[1].designId, null, "unknown design ids are dropped")
  assert.deepEqual(graphic.badges, ["sale", "new", "bestseller"])
  assert.equal(graphic.isNew, true)
  assert.deepEqual(graphic.moreDesigns, ["pause-back-tee"], "drafts are not linked; group match ignores case and spaces")
  assert.deepEqual(graphic.collectionSlugs, ["pause"])

  const seedTee = catalogue.products[0]
  assert.deepEqual(seedTee.badges, [])
  assert.deepEqual(seedTee.designs, [])
  assert.equal(seedTee.images[0].designId, null)
  assert.deepEqual(seedTee.moreDesigns, [])

  // Collections: in sort order, empty ones dropped, products in admin order, drafts skipped.
  assert.deepEqual(
    catalogue.collections.map((c) => [c.slug, c.productSlugs]),
    [
      ["drop-01", ["drop-01-oversized-tee"]],
      ["pause", ["pause-back-tee", "pause-graphic-tee"]],
    ]
  )
  assert.equal(catalogue.collections[1].href, "/collections/pause/")
  assert.deepEqual(
    catalogue.collections[1].image?.sources.map((s) => s.src),
    ["/media/collections/pause/y-640.webp", "/media/collections/pause/y-1080.webp"]
  )
  assert.deepEqual(catalogue.autoCollections, { new: ["pause-graphic-tee", "pause-back-tee"], sale: ["pause-graphic-tee"] })

  // Menu: the pick wins; children listed.
  assert.deepEqual(catalogue.menu, [
    {
      id: tees.id,
      name: "T-Shirts",
      href: "/c/t-shirts/",
      children: [{ id: uuid(901), name: "Boxy", href: "/c/t-shirts/boxy/" }],
      productSlugs: ["pause-back-tee"],
    },
  ])

  // Pages: sanitized, empty ones dropped, in the admin's fixed order.
  assert.deepEqual(
    catalogue.pages.map((p) => [p.slug, p.html, p.seoTitle]),
    [
      ["about", "<h2>Us</h2>", "About us"],
      ["terms", "<p>Be kind</p>", ""],
    ]
  )
  assert.deepEqual(catalogue.homeSections[0], { id: "faq", enabled: false })

  // Search index.
  const indexed = catalogue.searchIndex.find((e) => e.slug === "pause-graphic-tee")!
  assert.equal(indexed.category, "T-Shirts / Boxy")
  assert.deepEqual(indexed.designs, ["Front design", "Back design"])
  assert.equal(indexed.image, "/media/seed/drop-01-tee-front-1122.webp")
})

test("menu falls back to the newest products and hides categories switched off", () => {
  const raw = storeFixture()
  const noPicks = { ...raw, menuProducts: [] }
  assert.deepEqual(buildCatalogue(noPicks, () => "", "fixture", { now: NOW }).catalogue.menu[0].productSlugs, ["pause-graphic-tee", "drop-01-oversized-tee"])
  const hidden = { ...raw, categories: raw.categories.map((c) => ({ ...c, show_in_menu: false })) }
  assert.deepEqual(buildCatalogue(hidden, () => "", "fixture", { now: NOW }).catalogue.menu, [])
})

test("a product whose designs are all out of stock is sold out", () => {
  const raw = storeFixture()
  const allOut = { ...raw, designs: raw.designs.map((d) => ({ ...d, in_stock: false })) }
  const graphic = buildCatalogue(allOut, () => "", "fixture", { now: NOW }).catalogue.products.find((p) => p.slug === "pause-graphic-tee")!
  assert.equal(graphic.soldOut, true)
  assert.equal(graphic.badges[0], "sold-out")
})

test("lists the images the site must download", () => {
  const raw = storeFixture()
  const { catalogue } = buildCatalogue(raw, () => "", "fixture", { now: NOW })
  const paths = usedImageObjects(raw, catalogue).map((i) => i.path)
  assert.ok(paths.includes("collections/pause/y"))
  assert.ok(!paths.includes("collections/empty/x"), "empty collection is not built")
  assert.ok(!paths.includes("categories/caps/x"), "category without products is not built")
  assert.equal(paths.filter((p) => p.startsWith("seed/")).length, raw.images.length - 1, "the draft's image is skipped")
})

test("the seed catalogue still builds with the new tables empty", () => {
  const raw = seedToRawCatalogue()
  const empty = { ...raw, collections: [], productCollections: [], menuProducts: [], designs: [], pages: [] }
  const { catalogue } = buildCatalogue(empty, () => "", "fixture")
  assert.equal(catalogue.products.length, 1)
  assert.equal(catalogue.collections.length, 0)
  assert.equal(catalogue.menu.length, 1)
  assert.equal(catalogue.homeSections.length, 9)
  assert.equal(catalogue.pages.length, 0)
})

console.log(`store-structure: ${passed} tests passed`)
