import assert from "node:assert/strict"
import { DEFAULT_DELIVERY_ZONES } from "../constants"
import {
  createChallenge,
  handleChallengeRequest,
  handleOrderRequest,
  solveChallenge,
  supabaseOrderStore,
  verifySolution,
  type EmailMessage,
  type EmailProvider,
  type NewOrderRecord,
  type OrderEvent,
  type OrderStore,
  type OrderableProduct,
  type SaveResult,
} from "../orders"

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  await fn()
  passed++
  console.log(`  ok - ${name}`)
}

const SECRET = "test-secret-0123456789"
const SITE = "https://afktheory.com"
const env = { ORDER_SECRET: SECRET, ORDER_NOTIFY_EMAIL: "owner@afktheory.com", SUPABASE_URL: "https://x.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_x" }

const tee: OrderableProduct = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "drop-01-tee",
  name: "Drop 01 Tee",
  priceBdt: 1250,
  published: true,
  sizes: ["M", "L"],
  soldOutSizes: [],
  colors: [{ name: "Bone", inStock: true }],
  designs: [],
}

/** In-memory store that behaves like place_catalogue_order(). */
function fakeStore(options: { failLoad?: boolean; failSave?: boolean; limited?: boolean } = {}) {
  const orders = new Map<string, { id: string; code: string; challenge: string | null }>()
  const emailStatus = new Map<string, { status: string; events: OrderEvent[] }>()
  let seq = 1000
  const store: OrderStore = {
    async loadProducts(slugs) {
      if (options.failLoad) throw new Error("Supabase timed out")
      return [tee].filter((p) => slugs.includes(p.slug))
    },
    async loadShopSettings() {
      return { deliveryZones: DEFAULT_DELIVERY_ZONES, whatsappNumber: "01700000000" }
    },
    async saveOrder(record: NewOrderRecord): Promise<SaveResult> {
      if (options.failSave) throw new Error("Supabase HTTP 500")
      const existing = orders.get(record.idempotencyKey)
      if (existing) return { result: "duplicate", id: existing.id, code: existing.code }
      if ([...orders.values()].some((o) => o.challenge && o.challenge === record.challengeId)) return { result: "replayed", id: null, code: null }
      if (options.limited) return { result: "limited", id: null, code: null }
      const order = { id: `order-${++seq}`, code: `AFK-${seq}`, challenge: record.challengeId }
      orders.set(record.idempotencyKey, order)
      return { result: "created", id: order.id, code: order.code }
    },
    async recordEmails(orderId, status, events) {
      emailStatus.set(orderId, { status, events })
    },
  }
  return { store, orders, emailStatus }
}

function fakeEmail(options: { fail?: boolean } = {}) {
  const sent: EmailMessage[] = []
  const provider: EmailProvider = {
    name: "fake",
    async send(message) {
      if (options.fail) return { ok: false, error: "Resend HTTP 429: daily quota" }
      sent.push(message)
      return { ok: true, id: `em-${sent.length}` }
    },
  }
  return { provider, sent }
}

async function solved() {
  const challenge = await createChallenge(SECRET, { maxNumber: 200 })
  const solution = await solveChallenge(challenge)
  assert.ok(solution)
  return btoa(JSON.stringify(solution))
}

async function orderBody(over: Record<string, unknown> = {}) {
  return {
    idempotencyKey: `key_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    challenge: await solved(),
    customer: { name: "Rahim Uddin", phone: "01712345678", email: "rahim@example.com", district: "Dhaka", address: "House 12, Road 5, Dhanmondi", note: "" },
    lines: [{ slug: "drop-01-tee", name: "Drop 01 Tee", color: "Bone", size: "M", quantity: 2, unitPriceBdt: 1250 }],
    ...over,
  }
}

function post(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body)
  return new Request(`${SITE}/api/order`, {
    method: "POST",
    headers: { Origin: SITE, "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.7", ...headers },
    body: text,
  })
}

const quiet = () => {}

;(async () => {
  console.log("order endpoint")

  /* ------------------------------------------------------------ spam check */

  await test("a solved puzzle verifies; tampered or expired ones do not", async () => {
    const challenge = await createChallenge(SECRET, { maxNumber: 300 })
    const solution = await solveChallenge(challenge)
    assert.ok(solution)
    assert.deepEqual(await verifySolution(SECRET, solution), { ok: true, id: solution.signature })
    assert.equal((await verifySolution(SECRET, btoa(JSON.stringify(solution)))).ok, true, "base64 form")
    assert.deepEqual(await verifySolution(SECRET, { ...solution, number: solution.number + 1 }), { ok: false, reason: "wrong" })
    assert.deepEqual(await verifySolution("other-secret", solution), { ok: false, reason: "wrong" })
    const later = new Date(Date.now() + 21 * 60 * 1000)
    assert.deepEqual(await verifySolution(SECRET, solution, later), { ok: false, reason: "expired" })
    assert.deepEqual(await verifySolution(SECRET, "not base64 json"), { ok: false, reason: "malformed" })
    assert.deepEqual(await verifySolution(SECRET, undefined), { ok: false, reason: "malformed" })
  })

  await test("challenge endpoint hands out puzzles and refuses other sites", async () => {
    const ok = await handleChallengeRequest(new Request(`${SITE}/api/challenge`), env)
    assert.equal(ok.status, 200)
    assert.equal(ok.headers.get("Cache-Control"), "no-store")
    const body = (await ok.json()) as { algorithm: string; maxnumber: number }
    assert.equal(body.algorithm, "SHA-256")
    const cross = await handleChallengeRequest(new Request(`${SITE}/api/challenge`, { headers: { Origin: "https://evil.example" } }), env)
    assert.equal(cross.status, 403)
    assert.equal((await handleChallengeRequest(new Request(`${SITE}/api/challenge`), {})).status, 503)
  })

  /* ------------------------------------------------------------ placing orders */

  await test("places an order: saves it, emails owner and customer, records the result", async () => {
    const { store, orders, emailStatus } = fakeStore()
    const { provider, sent } = fakeEmail()
    const res = await handleOrderRequest(post(await orderBody()), env, { store, email: provider, log: quiet })
    assert.equal(res.status, 201)
    const body = (await res.json()) as { ok: boolean; code: string; order: { totalBdt: number }; customerEmailed: boolean }
    assert.equal(body.code, "AFK-1001")
    assert.equal(body.order.totalBdt, 2560)
    assert.equal(body.customerEmailed, true)
    assert.equal(orders.size, 1)
    assert.deepEqual(sent.map((m) => m.to), ["owner@afktheory.com", "rahim@example.com"])
    assert.equal(sent[0].replyTo, "rahim@example.com", "owner can reply straight to the customer")
    assert.equal(sent[1].replyTo, "owner@afktheory.com")
    assert.equal(emailStatus.get("order-1001")?.status, "sent")
  })

  await test("a second tap with the same key returns the same order and sends no more email", async () => {
    const { store, orders } = fakeStore()
    const { provider, sent } = fakeEmail()
    const body = await orderBody()
    const first = (await (await handleOrderRequest(post(body), env, { store, email: provider, log: quiet })).json()) as { code: string }
    const again = await handleOrderRequest(post(body), env, { store, email: provider, log: quiet })
    const second = (await again.json()) as { code: string; duplicate: boolean }
    assert.equal(again.status, 201)
    assert.equal(second.code, first.code)
    assert.equal(second.duplicate, true)
    assert.equal(orders.size, 1)
    assert.equal(sent.length, 2)
  })

  await test("one solved puzzle cannot place two different orders", async () => {
    const { store } = fakeStore()
    const { provider } = fakeEmail()
    const challenge = await solved()
    await handleOrderRequest(post(await orderBody({ challenge })), env, { store, email: provider, log: quiet })
    const res = await handleOrderRequest(post(await orderBody({ challenge })), env, { store, email: provider, log: quiet })
    assert.equal(res.status, 400)
    assert.equal(((await res.json()) as { error: string }).error, "challenge")
  })

  await test("customer without an email still gets an order; only the owner is emailed", async () => {
    const { store } = fakeStore()
    const { provider, sent } = fakeEmail()
    const body = await orderBody()
    const res = await handleOrderRequest(post({ ...body, customer: { ...body.customer, email: "" } }), env, { store, email: provider, log: quiet })
    assert.equal(res.status, 201)
    assert.equal(((await res.json()) as { customerEmailed: boolean }).customerEmailed, false)
    assert.deepEqual(sent.map((m) => m.to), ["owner@afktheory.com"])
  })

  await test("a changed price is refused and nothing is saved", async () => {
    const { store, orders } = fakeStore()
    const body = await orderBody({ lines: [{ slug: "drop-01-tee", color: "Bone", size: "M", quantity: 1, unitPriceBdt: 999 }] })
    const res = await handleOrderRequest(post(body), env, { store, email: fakeEmail().provider, log: quiet })
    assert.equal(res.status, 409)
    const json = (await res.json()) as { problems: { kind: string; priceBdt: number }[] }
    assert.deepEqual([json.problems[0].kind, json.problems[0].priceBdt], ["price_changed", 1250])
    assert.equal(orders.size, 0)
  })

  await test("missing or wrong spam check and invalid fields are refused", async () => {
    const { store, orders } = fakeStore()
    const noChallenge = await handleOrderRequest(post(await orderBody({ challenge: undefined })), env, { store, log: quiet })
    assert.equal(noChallenge.status, 400)
    const body = await orderBody()
    const bad = await handleOrderRequest(post({ ...body, customer: { ...body.customer, phone: "123" } }), env, { store, log: quiet })
    assert.equal(bad.status, 400)
    assert.ok(((await bad.json()) as { fields: Record<string, string> }).fields["customer.phone"])
    const bot = await handleOrderRequest(post({ ...body, website: "spam" }), env, { store, log: quiet })
    assert.equal(bot.status, 400)
    assert.equal(orders.size, 0)
  })

  await test("rate limit answers 429", async () => {
    const { store } = fakeStore({ limited: true })
    const res = await handleOrderRequest(post(await orderBody()), env, { store, email: fakeEmail().provider, log: quiet })
    assert.equal(res.status, 429)
  })

  /* ------------------------------------------------------------ failures */

  await test("email down: the order is still saved and marked for a resend", async () => {
    const { store, orders, emailStatus } = fakeStore()
    const logs: string[] = []
    const res = await handleOrderRequest(post(await orderBody()), env, { store, email: fakeEmail({ fail: true }).provider, log: (l) => logs.push(l) })
    assert.equal(res.status, 201)
    assert.equal(((await res.json()) as { customerEmailed: boolean }).customerEmailed, false)
    assert.equal(orders.size, 1)
    assert.equal(emailStatus.get("order-1001")?.status, "failed")
    assert.ok(emailStatus.get("order-1001")?.events.every((e) => e.kind === "email_failed"))
    assert.ok(!logs.join("\n").includes("01712345678"), "logs never hold the phone number")
  })

  await test("email not set up: the order is saved and the problem recorded", async () => {
    const { store, emailStatus } = fakeStore()
    const res = await handleOrderRequest(post(await orderBody()), env, { store, email: null, log: quiet })
    assert.equal(res.status, 201)
    assert.equal(emailStatus.get("order-1001")?.status, "failed")
  })

  await test("database down: the owner gets an emergency copy and the customer is sent to WhatsApp", async () => {
    for (const failure of [{ failLoad: true }, { failSave: true }]) {
      const { store } = fakeStore(failure)
      const { provider, sent } = fakeEmail()
      const res = await handleOrderRequest(post(await orderBody()), env, { store, email: provider, log: quiet })
      assert.equal(res.status, 503)
      const body = (await res.json()) as { error: string; emailed: boolean; message: string }
      assert.deepEqual([body.error, body.emailed], ["unsaved", true])
      assert.match(body.message, /WhatsApp/)
      assert.equal(sent.length, 1)
      assert.equal(sent[0].to, "owner@afktheory.com")
      assert.ok(sent[0].subject.startsWith("[NOT SAVED]"))
      assert.ok(sent[0].text.includes("Drop 01 Tee"))
    }
  })

  await test("database and email both down: the customer is told to use WhatsApp", async () => {
    const { store } = fakeStore({ failLoad: true })
    const res = await handleOrderRequest(post(await orderBody()), env, { store, email: fakeEmail({ fail: true }).provider, log: quiet })
    assert.equal(res.status, 503)
    assert.equal(((await res.json()) as { emailed: boolean }).emailed, false)
  })

  /* ------------------------------------------------------------ request checks */

  await test("refuses other sites, wrong content types, big bodies and missing settings", async () => {
    const { store } = fakeStore()
    assert.equal((await handleOrderRequest(post({}, { Origin: "https://evil.example" }), env, { store })).status, 403)
    const noOrigin = new Request(`${SITE}/api/order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    assert.equal((await handleOrderRequest(noOrigin, env, { store })).status, 403)
    assert.equal((await handleOrderRequest(post("a=b", { "Content-Type": "application/x-www-form-urlencoded" }), env, { store })).status, 415)
    assert.equal((await handleOrderRequest(post("x".repeat(17 * 1024)), env, { store })).status, 413)
    assert.equal((await handleOrderRequest(post("{not json"), env, { store, log: quiet })).status, 400)
    assert.equal((await handleOrderRequest(post({}), {}, {})).status, 503)
  })

  /* ------------------------------------------------------------ Supabase REST */

  await test("Supabase store sends the secret key only in the right header and keeps row details out of errors", async () => {
    const calls: { url: string; method: string; headers: Record<string, string>; body?: string }[] = []
    let reply: { status: number; body: string } = { status: 200, body: "[]" }
    const fetch = async (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) => {
      calls.push({ url, method: init.method ?? "GET", headers: init.headers ?? {}, body: init.body })
      return { ok: reply.status < 400, status: reply.status, json: async () => JSON.parse(reply.body), text: async () => reply.body }
    }
    const store = supabaseOrderStore({ url: "https://x.supabase.co/", secretKey: "sb_secret_abc", fetch })
    await store.loadProducts(["drop-01-tee", "bad slug)", "drop-01-tee"])
    assert.equal(calls[0].headers.apikey, "sb_secret_abc")
    assert.equal(calls[0].headers.Authorization, undefined)
    assert.ok(calls[0].url.startsWith("https://x.supabase.co/rest/v1/products?select="))
    assert.ok(calls[0].url.endsWith("&slug=in.(drop-01-tee)"), "unsafe and repeated slugs are dropped")

    const legacy = supabaseOrderStore({ url: "https://x.supabase.co", secretKey: "eyJhbGciOi.legacy", fetch })
    await legacy.loadShopSettings()
    assert.equal(calls[1].headers.Authorization, "Bearer eyJhbGciOi.legacy")

    reply = { status: 400, body: JSON.stringify({ code: "23514", message: "violates check constraint", details: "Failing row contains (Rahim, 01712345678)" }) }
    await assert.rejects(() => store.loadShopSettings(), (err: Error) => err.message.includes("23514") && !err.message.includes("01712345678"))

    reply = { status: 200, body: JSON.stringify([{ result: "created", order_id: "o1", order_code: "AFK-1001" }]) }
    const saved = await store.saveOrder({
      idempotencyKey: "k",
      challengeId: "c",
      ipHash: "h",
      customer: { name: "R", phone: "01712345678", email: null, district: "Dhaka", address: "addr", note: "" },
      order: { lines: [], subtotalBdt: 0, delivery: { zone: "inside_dhaka", label: "Inside Dhaka", feeBdt: 60, eta: "" }, totalBdt: 60 },
    })
    assert.deepEqual(saved, { result: "created", id: "o1", code: "AFK-1001" })
    const rpc = calls[calls.length - 1]
    assert.equal(rpc.url, "https://x.supabase.co/rest/v1/rpc/place_catalogue_order")
    assert.equal(JSON.parse(rpc.body!).p_order.zone, "inside_dhaka")
  })

  console.log(`${passed} passed`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
