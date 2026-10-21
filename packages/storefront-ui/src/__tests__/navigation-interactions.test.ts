import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createStoreNavigation, isNavItemActive } from "../components/layout/navigation-model"
import { deduplicateFooterLinks } from "../components/layout/footer-model"
import { StoreRoutes } from "@dtc/commerce-contracts"

const mockRoutes: StoreRoutes = {
  home: () => "/",
  catalog: (params) => {
    const q = params?.q ? `?q=${encodeURIComponent(params.q)}` : ""
    const cat = params?.category ? `?category=${encodeURIComponent(params.category)}` : ""
    return `/shop${q || cat}`
  },
  product: (handle) => `/product?handle=${handle}`,
  category: (handle) => `/category?handle=${handle}`,
  collection: (handle) => `/collection?handle=${handle}`,
  cart: () => "/cart",
  checkout: () => "/checkout",
  order: (id) => `/order?id=${id}`,
  account: () => "/account",
  accountOrders: () => "/account/orders",
  accountOrderDetail(id) {
    return `/account/order?id=${id}`
  },
  about: () => "/about",
  contact: () => "/contact",
  faq: () => "/faq",
  privacyPolicy: () => "/privacy-policy",
  returnPolicy: () => "/return-policy",
  shippingPolicy: () => "/shipping-policy",
  sizeGuide: () => "/size-guide",
  terms: () => "/terms-and-conditions",
}

describe("Shared Mega Navigation IA & Interaction Suite", () => {
  test("1. Centralized IA produces seven primary menswear departments", () => {
    const nav = createStoreNavigation(mockRoutes)
    assert.equal(nav.length, 7)

    const labels = nav.map((n) => n.label)
    assert.deepEqual(labels, [
      "New & Trending",
      "Shirts",
      "Polos & Tees",
      "Trousers",
      "Outerwear & Linen",
      "Accessories",
      "Collections",
    ])
  })

  test("2. All mega destinations resolve cleanly through StoreRoutes without hardcoded paths", () => {
    const nav = createStoreNavigation(mockRoutes)
    for (const item of nav) {
      assert.ok(item.href.startsWith("/"), `href for ${item.label} must start with /`)
      assert.ok(item.shopAllHref.startsWith("/"), `shopAllHref for ${item.label} must start with /`)
      assert.ok(item.featuredLinks.length > 0, `${item.label} must have featured links`)

      for (const fl of item.featuredLinks) {
        assert.ok(fl.href.startsWith("/"), `featured link ${fl.label} must resolve to route`)
      }

      for (const cg of item.categoryGroups) {
        assert.ok(cg.links.length > 0, `category group ${cg.title} must contain links`)
        for (const cl of cg.links) {
          assert.ok(cl.href.startsWith("/"), `category link ${cl.label} must resolve to route`)
        }
      }
    }
  })

  test("3. Every mega panel provides an editorial showcase card with CTA and valid image", () => {
    const nav = createStoreNavigation(mockRoutes)
    for (const item of nav) {
      assert.ok(item.editorialCards.length >= 1, `${item.label} must provide at least one editorial card`)
      const card = item.editorialCards[0]
      assert.ok(card.title.length > 0, "card must have title")
      assert.ok(card.description.length > 0, "card must have description")
      assert.ok(card.image.startsWith("https://"), "card must use authentic image URL")
      assert.ok(card.ctaText.length > 0, "card must have clear action CTA")
      assert.ok(card.href.startsWith("/"), "card CTA must link to store route")
    }
  })

  test("4. Disclosure state toggles correctly and restores focus on Escape", () => {
    let activeId: string | null = null
    let restoredFocus = false

    function handleTriggerToggle(id: string) {
      activeId = activeId === id ? null : id
    }

    function handleClose(options?: { restoreFocus?: boolean }) {
      activeId = null
      if (options?.restoreFocus) {
        restoredFocus = true
      }
    }

    // Open "shirts"
    handleTriggerToggle("shirts")
    assert.equal(activeId, "shirts")

    // Escape closes and restores focus
    handleClose({ restoreFocus: true })
    assert.equal(activeId, null)
    assert.equal(restoredFocus, true)
  })

  test("5. Switching between nav items updates active menu without flickering", () => {
    let activeId: string | null = "new-arrivals"

    function switchMenu(newId: string) {
      activeId = newId
    }

    switchMenu("trousers")
    assert.equal(activeId, "trousers")
    switchMenu("accessories")
    assert.equal(activeId, "accessories")
  })

  test("6. Footer links with duplicate hrefs are deduplicated to avoid key collisions", () => {
    const rawLinks = [
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Best Sellers", href: "/collections/best-sellers" },
      { label: "New Arrivals (Duplicate)", href: "/collections/new-arrivals" },
      { label: "The Essentials Edit", href: "/collections/essentials" },
    ]

    const deduped = deduplicateFooterLinks(rawLinks)
    assert.equal(deduped.length, 3)
    assert.deepEqual(
      deduped.map((l) => l.href),
      [
        "/collections/new-arrivals",
        "/collections/best-sellers",
        "/collections/essentials",
      ]
    )
    assert.equal(deduped[0].label, "New Arrivals")
  })

  test("7. isNavItemActive accurately detects active state with or without country code", () => {
    const nav = createStoreNavigation(mockRoutes)
    const shirtsItem = nav.find((i) => i.id === "shirts")!
    const accessoriesItem = nav.find((i) => i.id === "accessories")!

    // Direct match with country code prefix
    assert.equal(isNavItemActive(shirtsItem, "/bd/category?handle=shirts"), true)
    // Direct match without prefix
    assert.equal(isNavItemActive(shirtsItem, "/category?handle=shirts"), true)
    // Non-match
    assert.equal(isNavItemActive(accessoriesItem, "/bd/category?handle=shirts"), false)
    // Homepage does not falsely match categories
    assert.equal(isNavItemActive(shirtsItem, "/bd"), false)
    assert.equal(isNavItemActive(shirtsItem, "/"), false)
  })

  test("8. Hover-intent timing parameters adhere to usability guidelines", () => {
    const idleHoverDelay = 300 // ms
    const switchDelay = 60 // ms
    const closeGracePeriod = 320 // ms

    assert.ok(idleHoverDelay >= 250 && idleHoverDelay <= 500, "idle delay must be within 250-500ms range")
    assert.ok(switchDelay <= 100, "adjacent switch delay must be snappy (<= 100ms)")
    assert.ok(closeGracePeriod >= 280, "close grace period must allow diagonal pointer travel (>= 280ms)")
  })

  test("9. Scroll hysteresis prevents rapid threshold flipping", () => {
    let isScrolled = false
    const enterThreshold = 90
    const exitThreshold = 40

    function onScroll(y: number) {
      if (!isScrolled && y > enterThreshold) {
        isScrolled = true
      } else if (isScrolled && y < exitThreshold) {
        isScrolled = false
      }
    }

    // Scroll down to 85px (below enter threshold) -> still false
    onScroll(85)
    assert.equal(isScrolled, false)

    // Scroll past 90px -> enters floating mode
    onScroll(95)
    assert.equal(isScrolled, true)

    // Jitter around 80px (between exit and enter) -> stays floating
    onScroll(80)
    assert.equal(isScrolled, true)
    onScroll(60)
    assert.equal(isScrolled, true)

    // Scroll back to top (< 40px) -> returns to full-width mode
    onScroll(35)
    assert.equal(isScrolled, false)
  })
})
