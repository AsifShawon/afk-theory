import assert from "node:assert/strict"
import { DEFAULT_DELIVERY_ZONES } from "@dtc/catalogue-core"
import { buildCustomDesignMessage, buildOrderMessage, createOrderCode, messengerUrl, orderSubtotal, whatsappUrl, type OrderLine } from "../order-message"

let passed = 0
function test(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

const tee: OrderLine = {
  slug: "drop-01-oversized-tee",
  productName: "Drop 01 Oversized Tee",
  colorName: "Graphite Black",
  size: "L",
  quantity: 2,
  unitPriceBdt: 1450,
}

test("creates readable order codes from the date", () => {
  const code = createOrderCode(new Date(2026, 10, 20), () => 0)
  assert.equal(code, "AFK-261120-AAA")
  assert.match(createOrderCode(), /^AFK-\d{6}-[A-HJKMNP-Z2-9]{3}$/)
})

test("builds a single-item message", () => {
  const message = buildOrderMessage({ code: "AFK-261120-K7Q", lines: [tee], deliveryZones: DEFAULT_DELIVERY_ZONES })
  assert.equal(
    message,
    [
      "Hi AFK THEORY, I would like to order:",
      "",
      "Order AFK-261120-K7Q",
      "1) Drop 01 Oversized Tee",
      "   Graphite Black / L x 2 = BDT 2,900",
      "",
      "Subtotal: BDT 2,900",
      "Delivery: Inside Dhaka BDT 60 / Dhaka Suburbs BDT 100 / Outside Dhaka BDT 130",
      "Payment: Cash on delivery",
      "",
      "Name:",
      "Phone:",
      "Full address:",
      "District:",
    ].join("\n")
  )
})

test("fills in the customer's details and fee when checkout falls back to WhatsApp", () => {
  const message = buildOrderMessage({
    code: "AFK-261120-K7Q",
    lines: [tee],
    deliveryZones: DEFAULT_DELIVERY_ZONES,
    customer: { name: "Rahim Uddin", phone: "01712345678", address: "House 12\nRoad 5", district: "Dhaka", note: "After 5pm" },
    delivery: { label: "Inside Dhaka", feeBdt: 60 },
  })
  assert.ok(message.includes("Delivery (Inside Dhaka): BDT 60\nTotal: BDT 2,960"))
  assert.ok(message.includes("Name: Rahim Uddin\nPhone: 01712345678\nFull address: House 12, Road 5\nDistrict: Dhaka\nNote: After 5pm"))
})

test("builds a multi-item message with a subtotal", () => {
  const cap: OrderLine = { slug: "cap", productName: "Pause Cap", colorName: null, size: null, quantity: 1, unitPriceBdt: 650 }
  const message = buildOrderMessage({ code: "AFK-261120-K7Q", lines: [tee, cap], deliveryZones: [] })
  assert.ok(message.includes("2) Pause Cap\n   x 1 = BDT 650"))
  assert.ok(message.includes("Subtotal: BDT 3,550"))
  assert.ok(message.includes("Delivery: charge depends on your area"))
  assert.equal(orderSubtotal([tee, cap]), 3550)
})

test("puts the design before the color when a product has designs", () => {
  const message = buildOrderMessage({
    code: "AFK-261120-K7Q",
    lines: [{ ...tee, designName: "Back design", quantity: 1 }],
    deliveryZones: [],
  })
  assert.ok(message.includes("1) Drop 01 Oversized Tee\n   Back design / Graphite Black / L x 1 = BDT 1,450"))
})

test("encodes the WhatsApp link so the decoded text matches exactly", () => {
  const message = buildOrderMessage({ code: "AFK-261120-K7Q", lines: [tee], deliveryZones: DEFAULT_DELIVERY_ZONES })
  const url = whatsappUrl("01712-345678", message)
  assert.ok(url)
  const parsed = new URL(url as string)
  assert.equal(parsed.origin + parsed.pathname, "https://wa.me/8801712345678")
  assert.equal(parsed.searchParams.get("text"), message)
  assert.equal(whatsappUrl("", message), null)
})

test("builds the Messenger link with the order code as ref", () => {
  assert.equal(messengerUrl("https://facebook.com/afktheory", "AFK-261120-K7Q"), "https://m.me/afktheory?ref=AFK-261120-K7Q")
  assert.equal(messengerUrl("", "AFK-261120-K7Q"), null)
})

test("builds custom design WhatsApp message with and without a gallery reference", () => {
  const plain = buildCustomDesignMessage()
  assert.equal(
    plain,
    [
      "Hi AFK THEORY, I'd like to request a custom design.",
      "Garment type:",
      "Size and colour:",
      "Quantity:",
      "Print placement:",
      "I'll attach my design or reference image in this chat.",
    ].join("\n")
  )
  assert.ok(!plain.includes("Reference from your gallery:"))

  const withRef = buildCustomDesignMessage({ referenceTitle: "  Lantern Back Print  " })
  assert.equal(
    withRef,
    [
      "Hi AFK THEORY, I'd like to request a custom design.",
      "Reference from your gallery: Lantern Back Print",
      "Garment type:",
      "Size and colour:",
      "Quantity:",
      "Print placement:",
      "I'll attach my design or reference image in this chat.",
    ].join("\n")
  )

  const urlPlain = whatsappUrl("8801610689040", plain)
  const urlRef = whatsappUrl("8801610689040", withRef)
  assert.ok(urlPlain && urlRef)
  assert.equal(new URL(urlPlain as string).searchParams.get("text"), plain)
  assert.equal(new URL(urlRef as string).searchParams.get("text"), withRef)
  assert.equal(whatsappUrl("", withRef), null)
})

console.log(`order-message: ${passed} tests passed`)
