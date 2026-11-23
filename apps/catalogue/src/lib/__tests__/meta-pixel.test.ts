import assert from "node:assert/strict"
import {
  initMetaPixel,
  isTrackingAllowed,
  resetLastTrackedPath,
  trackAddToCart,
  trackChatClick,
  trackPageView,
  trackPurchase,
  trackViewContent,
} from "../meta-pixel"

let passed = 0
function test(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

// Set up mock window and event store for testing
const recordedEvents: Array<{ event: string; params?: unknown; options?: unknown }> = []
const mockSessionStorage: Record<string, string> = {}
const mockLocalStorage: Record<string, string> = {}

function setupMockEnvironment(hostname = "afktheory.com") {
  recordedEvents.length = 0
  for (const k of Object.keys(mockSessionStorage)) delete mockSessionStorage[k]
  for (const k of Object.keys(mockLocalStorage)) delete mockLocalStorage[k]
  resetLastTrackedPath()

  const mockWindow = {
    location: { hostname, pathname: "/" },
    localStorage: {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockLocalStorage[key] = val
      },
    },
    sessionStorage: {
      getItem: (key: string) => mockSessionStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockSessionStorage[key] = val
      },
    },
    __META_PIXEL_EVENTS__: recordedEvents,
    fbq: function (action: string, eventName: string, params?: unknown, options?: unknown) {
      if (action === "track" || action === "trackCustom") {
        recordedEvents.push({ event: eventName, params, options })
      }
    },
  }

  // @ts-expect-error Mocking global window for testing
  globalThis.window = mockWindow
}

test("isTrackingAllowed requires pixelId, production hostname, and respect for consent", () => {
  // Missing pixel ID
  assert.equal(isTrackingAllowed({ pixelId: "", hostname: "afktheory.com" }), false)
  assert.equal(isTrackingAllowed({ pixelId: "   ", hostname: "afktheory.com" }), false)

  // Non-production hostname without test mode
  assert.equal(isTrackingAllowed({ pixelId: "123456", hostname: "localhost" }), false)
  assert.equal(isTrackingAllowed({ pixelId: "123456", hostname: "preview.pages.dev" }), false)

  // Do Not Track enabled
  assert.equal(isTrackingAllowed({ pixelId: "123456", hostname: "afktheory.com", doNotTrack: true }), false)

  // Explicit consent denied
  assert.equal(isTrackingAllowed({ pixelId: "123456", hostname: "afktheory.com", consentDenied: true }), false)

  // Production host with consent
  assert.equal(isTrackingAllowed({ pixelId: "123456", hostname: "afktheory.com", doNotTrack: false }), true)
  assert.equal(isTrackingAllowed({ pixelId: "123456", hostname: "www.afktheory.com", doNotTrack: false }), true)

  // initMetaPixel respects tracking permission
  setupMockEnvironment("afktheory.com")
  assert.equal(initMetaPixel({ pixelId: "", hostname: "afktheory.com" }), false)
  assert.equal(initMetaPixel({ pixelId: "123456", hostname: "localhost" }), false)
  assert.equal(initMetaPixel({ pixelId: "123456", hostname: "afktheory.com", doNotTrack: false, testMode: true }), true)
})

test("trackPageView records on initial load and route changes, deduplicating identical paths", () => {
  setupMockEnvironment("afktheory.com")
  const opts = { pixelId: "123456", hostname: "afktheory.com", testMode: true }

  assert.equal(trackPageView("/", opts), true)
  assert.equal(recordedEvents.length, 1)
  assert.equal(recordedEvents[0].event, "PageView")

  // Identical path deduplication
  assert.equal(trackPageView("/", opts), false)
  assert.equal(recordedEvents.length, 1)

  // Route transition to /shop/
  assert.equal(trackPageView("/shop/", opts), true)
  assert.equal(recordedEvents.length, 2)
  assert.equal(recordedEvents[1].event, "PageView")
})

test("trackViewContent only emits for mapped products and never for unmapped products", () => {
  setupMockEnvironment("afktheory.com")
  const opts = { pixelId: "123456", hostname: "afktheory.com", testMode: true }

  // Unmapped product (null or empty ID) - MUST NOT emit
  assert.equal(trackViewContent({ metaContentId: null, name: "Unmapped Tee", priceBdt: 600 }, opts), false)
  assert.equal(trackViewContent({ metaContentId: "", name: "Unmapped Tee", priceBdt: 600 }, opts), false)
  assert.equal(trackViewContent({ metaContentId: "   ", name: "Unmapped Tee", priceBdt: 600 }, opts), false)
  assert.equal(recordedEvents.length, 0)

  // Mapped product with verified Meta Content ID
  assert.equal(trackViewContent({ metaContentId: "AFK-TEE-SIG-01", name: "Signature Tee", priceBdt: 600 }, opts), true)
  assert.equal(recordedEvents.length, 1)
  assert.equal(recordedEvents[0].event, "ViewContent")
  assert.deepEqual(recordedEvents[0].params, {
    content_ids: ["AFK-TEE-SIG-01"],
    content_type: "product",
    content_name: "Signature Tee",
    value: 600,
    currency: "BDT",
  })
})

test("trackAddToCart emits on cart add and buy now for mapped products, skips unmapped", () => {
  setupMockEnvironment("afktheory.com")
  const opts = { pixelId: "123456", hostname: "afktheory.com", testMode: true }

  // Unmapped product - skips
  assert.equal(trackAddToCart({ metaContentId: null, name: "Tee", unitPriceBdt: 600, quantity: 1 }, opts), false)
  assert.equal(recordedEvents.length, 0)

  // Mapped product (quantity = 2)
  assert.equal(
    trackAddToCart({ metaContentId: "AFK-TEE-SIG-01", name: "Signature Tee", unitPriceBdt: 600, quantity: 2 }, opts),
    true
  )
  assert.equal(recordedEvents.length, 1)
  assert.equal(recordedEvents[0].event, "AddToCart")
  assert.deepEqual(recordedEvents[0].params, {
    content_ids: ["AFK-TEE-SIG-01"],
    content_type: "product",
    content_name: "Signature Tee",
    value: 1200,
    currency: "BDT",
  })
})

test("trackPurchase uses server-priced order, deduplicates by code, and excludes customer PII", () => {
  setupMockEnvironment("afktheory.com")
  const opts = { pixelId: "123456", hostname: "afktheory.com", testMode: true }

  const order = {
    code: "AFK-261120-K7Q",
    order: {
      totalBdt: 1330,
      lines: [
        { slug: "signature-tee", quantity: 2, unitPriceBdt: 600 },
        { slug: "unmapped-hoodie", quantity: 1, unitPriceBdt: 850 },
      ],
    },
    // Sensitive customer contact info that MUST be excluded
    customer: {
      name: "John Doe",
      phone: "01700000000",
      address: "Dhanmondi, Dhaka",
    },
  }

  const metaIdMap = {
    "signature-tee": "AFK-TEE-SIG-01",
    "unmapped-hoodie": null, // Unmapped product
  }

  // First purchase event
  assert.equal(trackPurchase(order, metaIdMap, opts), true)
  assert.equal(recordedEvents.length, 1)
  const purchaseEvent = recordedEvents[0]
  assert.equal(purchaseEvent.event, "Purchase")
  assert.deepEqual(purchaseEvent.options, { eventID: "AFK-261120-K7Q" })

  const params = purchaseEvent.params as Record<string, unknown>
  assert.equal(params.value, 1330)
  assert.equal(params.currency, "BDT")
  assert.equal(params.content_type, "product")
  assert.equal(params.num_items, 3)
  assert.deepEqual(params.content_ids, ["AFK-TEE-SIG-01"])
  assert.deepEqual(params.contents, [{ id: "AFK-TEE-SIG-01", quantity: 2, item_price: 600 }])

  // Verify NO customer contact information leaked into payload
  assert.equal(params.customer, undefined)
  assert.equal(params.name, undefined)
  assert.equal(params.phone, undefined)
  assert.equal(params.address, undefined)

  // Duplicate response / page refresh deduplication
  assert.equal(trackPurchase(order, metaIdMap, opts), false)
  assert.equal(recordedEvents.length, 1, "Duplicate order code must not fire second Purchase event")
})

test("trackChatClick treats chat orders separately and excludes customer details", () => {
  setupMockEnvironment("afktheory.com")
  const opts = { pixelId: "123456", hostname: "afktheory.com", testMode: true }

  assert.equal(trackChatClick("whatsapp", opts), true)
  assert.equal(trackChatClick("messenger", opts), true)
  assert.equal(recordedEvents.length, 2)
  assert.equal(recordedEvents[0].event, "ChatOrderClick")
  assert.deepEqual(recordedEvents[0].params, { channel: "whatsapp" })
  assert.equal(recordedEvents[1].event, "ChatOrderClick")
  assert.deepEqual(recordedEvents[1].params, { channel: "messenger" })
})

console.log(`meta-pixel: ${passed} tests passed`)
