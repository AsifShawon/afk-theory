import assert from "node:assert/strict"
import { DEFAULT_DELIVERY_ZONES } from "../constants"
import {
  CHECKOUT_DISTRICTS,
  checkoutFieldErrors,
  checkoutInputSchema,
  consoleEmailProvider,
  customerOrderEmail,
  normalizeCheckoutPhone,
  orderStatusEmail,
  ordersToCsv,
  ownerOrderEmail,
  pricedOrderFromRows,
  priceOrder,
  quoteDelivery,
  resendEmailProvider,
  statusHasEmail,
  type CheckoutCustomer,
  type OrderableProduct,
  type OrderItemRow,
  type OrderRow,
} from "../orders"

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  await fn()
  passed++
  console.log(`  ok - ${name}`)
}

const tee: OrderableProduct = {
  id: "p1",
  slug: "drop-01-tee",
  name: "Drop 01 Tee",
  priceBdt: 1250,
  published: true,
  sizes: ["S", "M", "L"],
  soldOutSizes: ["S"],
  colors: [
    { name: "Bone", inStock: true },
    { name: "Graphite", inStock: false },
  ],
  designs: [],
}
const cap: OrderableProduct = {
  id: "p2",
  slug: "afk-cap",
  name: "AFK Cap",
  priceBdt: 650,
  published: true,
  sizes: [],
  soldOutSizes: [],
  colors: [{ name: "Black", inStock: true }],
  designs: [
    { name: "Front logo", inStock: true },
    { name: "Back logo", inStock: true },
  ],
}

const validInput = {
  idempotencyKey: "k_0123456789abcdef",
  customer: {
    name: "  Rahim   Uddin ",
    phone: "+880 1712-345678",
    email: " Rahim@Example.com ",
    district: "dhaka",
    address: "House 12, Road 5, Dhanmondi",
    note: "",
  },
  lines: [{ slug: "drop-01-tee", color: "Bone", size: "M", quantity: 2, unitPriceBdt: 1250 }],
}

const customer = (over: Partial<CheckoutCustomer> = {}): CheckoutCustomer => ({
  name: "Rahim Uddin",
  phone: "01712345678",
  email: null,
  district: "Dhaka",
  address: "House 12, Road 5, Dhanmondi",
  note: "",
  ...over,
})

;(async () => {
  console.log("orders")

  /* ------------------------------------------------------------ validation */

  await test("normalises Bangladeshi mobile numbers", () => {
    for (const raw of ["01712345678", "+8801712345678", "8801712345678", "+880 1712-345678", "1712345678", "017 1234 5678"]) {
      assert.equal(normalizeCheckoutPhone(raw), "01712345678", raw)
    }
    for (const raw of ["0171234567", "01212345678", "123", "", "+1 202 555 0100", "017123456789"]) {
      assert.equal(normalizeCheckoutPhone(raw), null, raw)
    }
  })

  await test("parses and cleans a valid checkout", () => {
    const parsed = checkoutInputSchema.parse(validInput)
    assert.equal(parsed.customer.name, "Rahim Uddin")
    assert.equal(parsed.customer.phone, "01712345678")
    assert.equal(parsed.customer.email, "rahim@example.com")
    assert.equal(parsed.customer.district, "Dhaka")
    assert.equal(parsed.lines[0].design, null)
  })

  await test("email is optional", () => {
    const { email: _email, ...rest } = validInput.customer
    assert.equal(checkoutInputSchema.parse({ ...validInput, customer: rest }).customer.email, null)
    assert.equal(checkoutInputSchema.parse({ ...validInput, customer: { ...rest, email: "" } }).customer.email, null)
  })

  await test("names each invalid field", () => {
    const result = checkoutInputSchema.safeParse({
      ...validInput,
      customer: { ...validInput.customer, phone: "12345", district: "Atlantis", address: "x", email: "not-an-email" },
    })
    assert.equal(result.success, false)
    const errors = checkoutFieldErrors(result.error!)
    assert.match(errors["customer.phone"], /mobile number/)
    assert.match(errors["customer.district"], /district/)
    assert.match(errors["customer.address"], /courier/)
    assert.match(errors["customer.email"], /email/)
  })

  await test("rejects bots, empty carts, too many lines and too many of one item", () => {
    assert.equal(checkoutInputSchema.safeParse({ ...validInput, website: "http://spam" }).success, false)
    assert.equal(checkoutInputSchema.safeParse({ ...validInput, lines: [] }).success, false)
    assert.equal(checkoutInputSchema.safeParse({ ...validInput, lines: Array(21).fill(validInput.lines[0]) }).success, false)
    assert.equal(checkoutInputSchema.safeParse({ ...validInput, lines: [{ ...validInput.lines[0], quantity: 11 }] }).success, false)
    assert.equal(checkoutInputSchema.safeParse({ ...validInput, lines: [{ ...validInput.lines[0], quantity: 1.5 }] }).success, false)
    assert.equal(checkoutInputSchema.safeParse({ ...validInput, idempotencyKey: "short" }).success, false)
  })

  await test("strips control characters from typed text", () => {
    const parsed = checkoutInputSchema.parse({
      ...validInput,
      customer: { ...validInput.customer, name: "Rahim\u0000\u0007 Uddin", address: "House 12\nRoad 5\u001b, Dhanmondi" },
    })
    assert.equal(parsed.customer.name, "Rahim Uddin")
    assert.equal(parsed.customer.address, "House 12\nRoad 5, Dhanmondi")
  })

  await test("offers all 64 districts", () => {
    assert.equal(CHECKOUT_DISTRICTS.length, 64)
    assert.ok(CHECKOUT_DISTRICTS.includes("Dhaka") && CHECKOUT_DISTRICTS.includes("Cox's Bazar"))
  })

  /* ------------------------------------------------------------ delivery */

  await test("delivery fee follows the district and the zones in Settings", () => {
    assert.deepEqual(
      [quoteDelivery("Dhaka", "Dhanmondi", DEFAULT_DELIVERY_ZONES)?.feeBdt, quoteDelivery("Gazipur", "Tongi", DEFAULT_DELIVERY_ZONES)?.feeBdt, quoteDelivery("Sylhet", "Zindabazar", DEFAULT_DELIVERY_ZONES)?.feeBdt],
      [60, 100, 130]
    )
    assert.equal(quoteDelivery("Dhaka", "Savar, Hemayetpur", DEFAULT_DELIVERY_ZONES)?.zone, "dhaka_suburban")
    const custom = DEFAULT_DELIVERY_ZONES.map((z) => ({ ...z, feeBdt: z.feeBdt + 10 }))
    assert.equal(quoteDelivery("Dhaka", "Gulshan", custom)?.feeBdt, 70)
    assert.equal(quoteDelivery("Dhaka", "Gulshan", custom)?.label, "Inside Dhaka")
  })

  await test("falls back to the standard courier rate when Settings has no matching zone", () => {
    assert.equal(quoteDelivery("Khulna", "Sonadanga", [])?.feeBdt, 130)
    assert.equal(quoteDelivery("Atlantis", "Nowhere", DEFAULT_DELIVERY_ZONES), null)
  })

  /* ------------------------------------------------------------ pricing */

  const price = (lines: Parameters<typeof priceOrder>[0]["lines"], over: Partial<CheckoutCustomer> = {}) =>
    priceOrder({ lines, customer: customer(over), products: [tee, cap], deliveryZones: DEFAULT_DELIVERY_ZONES })

  await test("prices an order from server data", () => {
    const result = price([
      { slug: "drop-01-tee", color: "bone", design: null, size: "m", quantity: 2, unitPriceBdt: 1250 },
      { slug: "afk-cap", color: null, design: "Back logo", size: null, quantity: 1, unitPriceBdt: 650 },
    ])
    assert.ok(result.ok)
    assert.equal(result.order.subtotalBdt, 3150)
    assert.equal(result.order.delivery.feeBdt, 60)
    assert.equal(result.order.totalBdt, 3210)
    // Names come back in the shop's spelling, and the only color is filled in.
    assert.deepEqual([result.order.lines[0].color, result.order.lines[0].size], ["Bone", "M"])
    assert.equal(result.order.lines[1].color, "Black")
  })

  await test("never charges the price sent by the browser", () => {
    const result = price([{ slug: "drop-01-tee", color: "Bone", design: null, size: "M", quantity: 1, unitPriceBdt: 1 }])
    assert.equal(result.ok, false)
    assert.ok(!result.ok && result.problems[0].kind === "price_changed" && result.problems[0].priceBdt === 1250)
  })

  await test("rejects unknown, unpublished, sold out and unpicked options", () => {
    const kinds = (lines: Parameters<typeof price>[0], products = [tee, cap]) => {
      const r = priceOrder({ lines, customer: customer(), products, deliveryZones: DEFAULT_DELIVERY_ZONES })
      return r.ok ? [] : r.problems.map((p) => p.kind)
    }
    const line = { slug: "drop-01-tee", color: "Bone", design: null, size: "M", quantity: 1, unitPriceBdt: 1250 }
    assert.deepEqual(kinds([{ ...line, slug: "nope" }]), ["unavailable"])
    assert.deepEqual(kinds([line], [{ ...tee, published: false }]), ["unavailable"])
    assert.deepEqual(kinds([{ ...line, size: "S" }]), ["sold_out"])
    assert.deepEqual(kinds([{ ...line, color: "Graphite" }]), ["sold_out"])
    assert.deepEqual(kinds([{ ...line, color: "Neon" }]), ["invalid_option"])
    assert.deepEqual(kinds([{ ...line, size: null }]), ["invalid_option"])
    assert.deepEqual(kinds([{ slug: "afk-cap", color: null, design: null, size: null, quantity: 1, unitPriceBdt: 650 }]), ["invalid_option"])
    assert.deepEqual(kinds([{ slug: "afk-cap", color: null, design: "Front logo", size: "M", quantity: 1, unitPriceBdt: 650 }]), ["invalid_option"])
  })

  await test("merges repeated lines and keeps the per-item limit", () => {
    const line = { slug: "drop-01-tee", color: "Bone", design: null, size: "M", quantity: 6, unitPriceBdt: 1250 }
    const merged = price([{ ...line, quantity: 3 }, { ...line, color: "BONE", quantity: 4 }])
    assert.ok(merged.ok && merged.order.lines.length === 1 && merged.order.lines[0].quantity === 7)
    const over = price([line, line])
    assert.ok(!over.ok && over.problems[0].kind === "too_many")
  })

  await test("rejects an unknown district", () => {
    const result = price([{ slug: "afk-cap", color: null, design: "Front logo", size: null, quantity: 1, unitPriceBdt: 650 }], { district: "Atlantis" })
    assert.ok(!result.ok && result.problems.some((p) => p.kind === "delivery"))
  })

  /* ------------------------------------------------------------ emails */

  const priced = price([{ slug: "drop-01-tee", color: "Bone", design: null, size: "M", quantity: 2, unitPriceBdt: 1250 }])
  assert.ok(priced.ok)
  const hostile = customer({
    name: `<script>alert("x")</script> Rahim`,
    address: `<img src=x onerror=alert(1)>\nRoad 5`,
    note: `"><a href="javascript:alert(1)">click</a>`,
    email: "rahim@example.com",
  })
  const data = { code: "AFK-1042", placedAt: new Date("2026-11-22T09:30:00Z"), customer: hostile, order: priced.order }

  await test("owner email has the order, totals and contact links, with customer text escaped", () => {
    const email = ownerOrderEmail(data)
    assert.equal(email.subject, "New order AFK-1042: 2 items, BDT 2,560")
    for (const html of [email.html]) {
      assert.ok(!html.includes("<script>") && !html.includes("<img") && !html.includes('href="javascript'))
      assert.ok(html.includes("&lt;script&gt;") && html.includes("&lt;img src=x"))
    }
    assert.ok(email.html.includes('href="tel:+8801712345678"') && email.html.includes('href="https://wa.me/8801712345678"'))
    assert.ok(email.html.includes("BDT 2,500") && email.html.includes("BDT 60") && email.html.includes("BDT 2,560"))
    assert.ok(email.html.includes("22 Nov 2026, 15:30"), "time is shown in Bangladesh time")
    assert.ok(email.text.includes("1) Drop 01 Tee (Bone / M) x 2 = BDT 2,500"))
  })

  await test("emergency owner email says the order was not saved", () => {
    const email = ownerOrderEmail(data, { saved: false })
    assert.ok(email.subject.startsWith("[NOT SAVED] "))
    assert.ok(email.html.includes("could not be saved") && email.text.startsWith("NOT SAVED"))
  })

  await test("customer email confirms the order and escapes their text", () => {
    const email = customerOrderEmail(data, { siteUrl: "https://afktheory.com", whatsappNumber: "8801700000000" })
    assert.equal(email.subject, "Your AFK THEORY order AFK-1042")
    assert.ok(!email.html.includes("<script>") && !email.html.includes("<img"))
    assert.ok(email.html.includes("BDT 2,560") && email.html.includes("01712345678"))
    assert.ok(email.html.includes("https://wa.me/8801700000000?text=Hi%20AFK%20THEORY%2C%20about%20my%20order%20AFK-1042"))
    const noWhatsapp = customerOrderEmail(data, { siteUrl: "https://afktheory.com", whatsappNumber: "" })
    assert.ok(!noWhatsapp.html.includes("wa.me"))
  })

  /* ------------------------------------------------------------ email providers */

  await test("Resend provider sends the right request and reports failures", async () => {
    const calls: { url: string; body: Record<string, unknown>; auth: string }[] = []
    const ok = resendEmailProvider({
      apiKey: "re_test",
      from: "AFK THEORY <orders@afktheory.com>",
      fetch: async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization })
        return { ok: true, status: 200, json: async () => ({ id: "em_1" }), text: async () => "" }
      },
    })
    assert.deepEqual(await ok.send({ to: "a@b.co", subject: "s", html: "<p>h</p>", text: "t", replyTo: "c@d.co" }), { ok: true, id: "em_1" })
    assert.equal(calls[0].url, "https://api.resend.com/emails")
    assert.equal(calls[0].auth, "Bearer re_test")
    assert.deepEqual(calls[0].body.to, ["a@b.co"])
    assert.equal(calls[0].body.reply_to, "c@d.co")

    const rejected = resendEmailProvider({
      apiKey: "re_test",
      from: "x@y.co",
      fetch: async () => ({ ok: false, status: 403, json: async () => ({}), text: async () => "domain is not verified" }),
    })
    const r = await rejected.send({ to: "a@b.co", subject: "s", html: "h", text: "t" })
    assert.ok(!r.ok && r.error.includes("403") && r.error.includes("not verified"))

    const down = resendEmailProvider({
      apiKey: "re_test",
      from: "x@y.co",
      fetch: async () => {
        throw new Error("network down")
      },
    })
    const d = await down.send({ to: "a@b.co", subject: "s", html: "h", text: "t" })
    assert.ok(!d.ok && d.error.includes("network down"))
  })

  await test("console provider prints instead of sending", async () => {
    const lines: string[] = []
    const provider = consoleEmailProvider((l) => lines.push(l))
    const r = await provider.send({ to: "a@b.co", subject: "Hello", html: "<p>x</p>", text: "Body" })
    assert.ok(r.ok)
    assert.ok(lines[0].includes("Subject: Hello") && lines[0].includes("Body"))
  })

  /* ------------------------------------------------------------ admin helpers */

  const row: OrderRow = {
    id: "o1",
    code: "AFK-1042",
    status: "new",
    name: "=HYPERLINK(\"http://evil\")",
    phone: "01712345678",
    email: "rahim@example.com",
    district: "Dhaka",
    zone: "inside_dhaka",
    address: "House 12\nRoad 5, \"Dhanmondi\"",
    note: "",
    subtotal_bdt: 2500,
    delivery_bdt: 60,
    total_bdt: 2560,
    payment_method: "cod",
    email_status: "failed",
    anonymised_at: null,
    created_at: "2026-11-22T09:30:00Z",
    updated_at: "2026-11-22T09:30:00Z",
  }
  const items: OrderItemRow[] = [
    { id: "i2", order_id: "o1", product_id: null, product_slug: "cap", product_name: "Cap", color: null, design: null, size: null, quantity: 1, unit_price_bdt: 0, line_total_bdt: 0, sort_order: 1 },
    { id: "i1", order_id: "o1", product_id: "p1", product_slug: "drop-01-tee", product_name: "Drop 01 Tee", color: "Bone", design: null, size: "M", quantity: 2, unit_price_bdt: 1250, line_total_bdt: 2500, sort_order: 0 },
  ]

  await test("CSV export quotes text and blocks spreadsheet formulas", () => {
    const csv = ordersToCsv([{ ...row, items }])
    assert.ok(csv.startsWith("﻿Order,"))
    const lines = csv.trim().split("\r\n")
    assert.equal(lines.length, 3, "one row per item")
    assert.ok(lines[1].includes(`"'=HYPERLINK(""http://evil"")"`), "formula is neutralised and quotes escaped")
    assert.ok(lines[1].includes(`"House 12, Road 5, ""Dhanmondi"""`))
    assert.ok(lines[1].endsWith(",60,2560") && lines[2].endsWith(",,"), "order totals only on the first line")
  })

  await test("rebuilds an order from saved rows, keeping the saved fee", () => {
    const priced = pricedOrderFromRows(row, items, DEFAULT_DELIVERY_ZONES.map((z) => ({ ...z, feeBdt: 999 })))
    assert.deepEqual(priced.lines.map((l) => l.slug), ["drop-01-tee", "cap"])
    assert.equal(priced.delivery.feeBdt, 60)
    assert.equal(priced.delivery.label, "Inside Dhaka")
    assert.equal(priced.totalBdt, 2560)
  })

  await test("status emails exist for customer-facing statuses and escape names", () => {
    assert.equal(statusHasEmail("shipped"), true)
    assert.equal(statusHasEmail("returned"), false)
    const email = orderStatusEmail({ code: "AFK-1042", name: "<b>Rahim</b> Uddin", status: "shipped", totalBdt: 2560 }, { siteUrl: "", whatsappNumber: "" })
    assert.ok(email)
    assert.equal(email.subject, "Your AFK THEORY order AFK-1042 is on its way")
    assert.ok(!email.html.includes("<b>Rahim") && email.html.includes("&lt;b&gt;Rahim"))
    assert.ok(email.text.includes("BDT 2,560 ready in cash"))
    assert.equal(orderStatusEmail({ code: "A", name: "R", status: "returned", totalBdt: 1 }, { siteUrl: "", whatsappNumber: "" }), null)
  })

  console.log(`${passed} passed`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
