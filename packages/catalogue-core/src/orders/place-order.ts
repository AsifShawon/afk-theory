/**
 * Placing an order, start to finish. Kept free of Cloudflare specifics so it
 * can be tested with fake stores and email providers.
 *
 * Order of work matters: the order is saved before any email is sent, so an
 * email problem never loses an order. If the database cannot be reached, the
 * owner gets an emergency copy by email and the customer is told to send the
 * order on WhatsApp as well.
 */
import { DEFAULT_DELIVERY_ZONES } from "../constants"
import { normalizeWhatsappNumber } from "../contact"
import type { EmailProvider } from "./email-provider"
import { customerOrderEmail, ownerOrderEmail, type OrderEmailData } from "./emails"
import { priceOrder, quoteDelivery, type OrderProblem, type PricedOrder } from "./pricing"
import { checkoutFieldErrors, checkoutInputSchema, type CheckoutCustomer, type CheckoutFieldErrors, type CheckoutInput } from "./schema"
import type { OrderEvent, OrderStore } from "./store"

export interface PlaceOrderContext {
  store: OrderStore
  email: EmailProvider | null
  /** Inbox that receives every order. */
  ownerEmail: string | null
  siteUrl: string
  /** Checks the spam puzzle answer; returns its id or null when it is wrong. */
  verifyChallenge: (payload: unknown) => Promise<string | null>
  ipHash: string | null
  now?: () => Date
  log?: (line: string) => void
}

export interface PlacedOrderSummary {
  code: string
  placedAt: string
  customer: Pick<CheckoutCustomer, "name" | "phone" | "district" | "email">
  order: PricedOrder
  /** True when a confirmation went to the customer's email. */
  customerEmailed: boolean
}

export type PlaceOrderResult =
  | { status: 201; body: { ok: true; duplicate: boolean } & PlacedOrderSummary }
  | { status: 400; body: { ok: false; error: "invalid"; message: string; fields: CheckoutFieldErrors } }
  | { status: 400; body: { ok: false; error: "challenge"; message: string } }
  | { status: 409; body: { ok: false; error: "problems"; message: string; problems: OrderProblem[] } }
  | { status: 429; body: { ok: false; error: "limited"; message: string } }
  | { status: 503; body: { ok: false; error: "unsaved"; message: string; emailed: boolean } }

const UNSAVED_MESSAGE = {
  emailed: "We could not save your order online, but a copy reached us by email. To be safe, please also send it on WhatsApp.",
  lost: "We could not take your order online right now. Please send it on WhatsApp instead. Your order is already written for you.",
}

export async function placeOrder(body: unknown, ctx: PlaceOrderContext): Promise<PlaceOrderResult> {
  const now = ctx.now ?? (() => new Date())
  const log = ctx.log ?? ((line: string) => console.log(line))

  const parsed = checkoutInputSchema.safeParse(body)
  if (!parsed.success) {
    const fields = checkoutFieldErrors(parsed.error)
    return { status: 400, body: { ok: false, error: "invalid", message: "Check the highlighted fields.", fields } }
  }
  const input = parsed.data

  const challengeId = await ctx.verifyChallenge((body as { challenge?: unknown }).challenge)
  if (!challengeId) {
    return { status: 400, body: { ok: false, error: "challenge", message: "The security check expired. Tap Place order again." } }
  }

  // Load the real prices and fees. If the database is down, fall through to
  // the emergency copy.
  let priced: ReturnType<typeof priceOrder>
  let whatsappNumber = ""
  try {
    const [products, settings] = await Promise.all([ctx.store.loadProducts(input.lines.map((l) => l.slug)), ctx.store.loadShopSettings()])
    whatsappNumber = normalizeWhatsappNumber(settings.whatsappNumber)
    priced = priceOrder({ lines: input.lines, customer: input.customer, products, deliveryZones: settings.deliveryZones })
  } catch (err) {
    log(`[order] Could not load products: ${describe(err)}`)
    return emergency(input, ctx, now(), log)
  }

  if (!priced.ok) {
    const message = priced.problems.some((p) => p.kind === "price_changed")
      ? "Some prices changed. Check your cart before ordering."
      : "Some items in your cart need a change."
    return { status: 409, body: { ok: false, error: "problems", message, problems: priced.problems } }
  }
  const order = priced.order

  let saved: Awaited<ReturnType<OrderStore["saveOrder"]>>
  try {
    saved = await ctx.store.saveOrder({ idempotencyKey: input.idempotencyKey, challengeId, ipHash: ctx.ipHash, customer: input.customer, order })
  } catch (err) {
    log(`[order] Could not save order: ${describe(err)}`)
    return emergency(input, ctx, now(), log, order)
  }

  if (saved.result === "limited") {
    return { status: 429, body: { ok: false, error: "limited", message: "Too many orders from this number in the last hour. Message us on WhatsApp and we will help." } }
  }
  if (saved.result === "replayed") {
    return { status: 400, body: { ok: false, error: "challenge", message: "The security check expired. Tap Place order again." } }
  }

  const { id, code } = saved
  const placedAt = now()
  const summary = (customerEmailed: boolean): PlacedOrderSummary => ({
    code,
    placedAt: placedAt.toISOString(),
    customer: { name: input.customer.name, phone: input.customer.phone, district: input.customer.district, email: input.customer.email },
    order,
    customerEmailed,
  })

  // A retry of an order that was already placed: same answer, no second emails.
  if (saved.result === "duplicate") {
    log(`[order] ${code} retried with the same key`)
    return { status: 201, body: { ok: true, duplicate: true, ...summary(Boolean(input.customer.email)) } }
  }

  log(`[order] ${code} placed, ${order.lines.length} lines, total ${order.totalBdt}`)
  const data: OrderEmailData = { code, placedAt, customer: input.customer, order }
  const customerEmailed = await sendOrderEmails(data, id, ctx, whatsappNumber, log)
  return { status: 201, body: { ok: true, duplicate: false, ...summary(customerEmailed) } }
}

/** Sends both emails and records the outcome. Returns whether the customer's email went out. */
async function sendOrderEmails(data: OrderEmailData, orderId: string, ctx: PlaceOrderContext, whatsappNumber: string, log: (line: string) => void): Promise<boolean> {
  const events: OrderEvent[] = []
  let failed = false
  let customerEmailed = false

  if (!ctx.email || !ctx.ownerEmail) {
    failed = true
    events.push({ kind: "email_failed", detail: "Email is not set up (RESEND_API_KEY, ORDER_EMAIL_FROM or ORDER_NOTIFY_EMAIL missing)" })
  } else {
    const owner = ownerOrderEmail(data, { saved: true })
    const jobs = [ctx.email.send({ to: ctx.ownerEmail, subject: owner.subject, html: owner.html, text: owner.text, replyTo: data.customer.email ?? undefined })]
    if (data.customer.email) {
      const confirmation = customerOrderEmail(data, { siteUrl: ctx.siteUrl, whatsappNumber })
      jobs.push(ctx.email.send({ to: data.customer.email, subject: confirmation.subject, html: confirmation.html, text: confirmation.text, replyTo: ctx.ownerEmail }))
    }
    const [ownerResult, customerResult] = await Promise.all(jobs)
    events.push(ownerResult.ok ? { kind: "email_sent", detail: "Owner copy" } : { kind: "email_failed", detail: `Owner copy: ${ownerResult.error}` })
    failed ||= !ownerResult.ok
    if (customerResult) {
      customerEmailed = customerResult.ok
      events.push(customerResult.ok ? { kind: "email_sent", detail: "Customer confirmation" } : { kind: "email_failed", detail: `Customer confirmation: ${customerResult.error}` })
      failed ||= !customerResult.ok
    }
  }

  if (failed) log(`[order] ${data.code} email problem: ${events.filter((e) => e.kind === "email_failed").map((e) => e.detail).join("; ")}`)
  try {
    await ctx.store.recordEmails(orderId, failed ? "failed" : "sent", events)
  } catch (err) {
    // The order is saved; the admin shows it as "pending" email.
    log(`[order] ${data.code} could not record email status: ${describe(err)}`)
  }
  return customerEmailed
}

/**
 * The database could not be reached. Email the owner everything we have so
 * the order is not lost, and tell the customer to send it on WhatsApp too.
 * Prices could not be checked, so the email says so.
 */
async function emergency(input: CheckoutInput, ctx: PlaceOrderContext, placedAt: Date, log: (line: string) => void, checked?: PricedOrder): Promise<PlaceOrderResult> {
  const order = checked ?? unverifiedOrder(input)
  let emailed = false
  if (order && ctx.email && ctx.ownerEmail) {
    const code = `UNSAVED-${input.idempotencyKey.slice(-6).toUpperCase()}`
    const email = ownerOrderEmail(
      { code, placedAt, customer: input.customer, order },
      {
        saved: false,
        adminHint: checked
          ? "Prices were checked. The database refused or failed to save the order."
          : "Prices could not be checked: they are what the customer's browser showed. Confirm them on the call.",
      }
    )
    const result = await ctx.email.send({ to: ctx.ownerEmail, subject: email.subject, html: email.html, text: email.text, replyTo: input.customer.email ?? undefined })
    emailed = result.ok
    log(`[order] ${code} emergency copy ${result.ok ? "emailed" : `failed: ${result.error}`}`)
  }
  return { status: 503, body: { ok: false, error: "unsaved", message: emailed ? UNSAVED_MESSAGE.emailed : UNSAVED_MESSAGE.lost, emailed } }
}

/** Builds an order from what the browser sent, for the emergency email only. */
function unverifiedOrder(input: CheckoutInput): PricedOrder | null {
  const delivery = quoteDelivery(input.customer.district, input.customer.address, DEFAULT_DELIVERY_ZONES)
  if (!delivery) return null
  const lines = input.lines.map((l) => ({
    productId: "",
    slug: l.slug,
    name: l.name || l.slug,
    color: l.color,
    design: l.design,
    size: l.size,
    quantity: l.quantity,
    unitPriceBdt: l.unitPriceBdt,
    lineTotalBdt: l.unitPriceBdt * l.quantity,
  }))
  const subtotalBdt = lines.reduce((sum, l) => sum + l.lineTotalBdt, 0)
  return { lines, subtotalBdt, delivery, totalBdt: subtotalBdt + delivery.feeBdt }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
