"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { clsx } from "clsx"
import { CUSTOM_HOODIE_CONFIG, CUSTOM_PLACEMENTS, formatBdt, formatDimension, getCustomGarmentConfig, type SiteSettings } from "@dtc/catalogue-core"
import {
  CHECKOUT_DISTRICTS,
  checkoutCustomerSchema,
  quoteDelivery,
  type OrderProblem,
  type PlacedOrderSummary,
} from "@dtc/catalogue-core/orders"
import { QuantityStepper } from "@/components/order/order-drawer"
import { useOrder, type OrderItem } from "@/components/order/order-provider"
import { MessengerIcon, WhatsAppIcon } from "@/components/ui/icons"
import { LAST_ORDER_KEY, newIdempotencyKey } from "@/lib/checkout"
import { buildOrderMessage, createOrderCode, describeVariant, lineTotal, messengerUrl, whatsappUrl } from "@/lib/order-message"
import { useSpamCheck } from "./use-spam-check"

type Field = "name" | "phone" | "email" | "district" | "address" | "note"
type FormState = Record<Field, string> & { website: string }

const EMPTY: FormState = { name: "", phone: "", email: "", district: "", address: "", note: "", website: "" }
const FIELD_ORDER: Field[] = ["name", "phone", "district", "address", "email", "note"]

type Outcome =
  | { kind: "idle" }
  | { kind: "placing" }
  | { kind: "done" }
  | { kind: "problems"; message: string; problems: OrderProblem[] }
  | { kind: "limited"; message: string }
  | { kind: "fallback"; message: string }

type ApiResponse =
  | ({ ok: true; duplicate: boolean } & PlacedOrderSummary)
  | { ok: false; error: "invalid"; message: string; fields: Record<string, string> }
  | { ok: false; error: "challenge" | "limited" | "unavailable" | "forbidden"; message?: string }
  | { ok: false; error: "problems"; message: string; problems: OrderProblem[] }
  | { ok: false; error: "unsaved"; message: string; emailed: boolean }

const FALLBACK_MESSAGE = "We could not reach our order system. Send this order on WhatsApp instead: it is already written for you."

async function postOrder(body: unknown): Promise<ApiResponse | null> {
  // One retry on a dropped connection. The same idempotency key means the
  // retry can never create a second order.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const type = response.headers.get("Content-Type") ?? ""
      if (!type.includes("application/json")) return null
      return (await response.json()) as ApiResponse
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500))
    }
  }
  return null
}

export function CheckoutView({ settings, privacyHref }: { settings: SiteSettings; privacyHref: string | null }) {
  const { items, loaded, prices, setQuantity, remove, clear } = useOrder()
  const router = useRouter()
  const spamCheck = useSpamCheck()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" })
  const [priceUpdates, setPriceUpdates] = useState<Record<string, number>>({})
  const statusRef = useRef<HTMLDivElement>(null)

  const lines: OrderItem[] = useMemo(
    () => items.map((item) => (priceUpdates[item.slug] !== undefined ? { ...item, unitPriceBdt: priceUpdates[item.slug] } : item)),
    [items, priceUpdates]
  )

  // A new key whenever the cart changes: the same cart retried is one order,
  // a changed cart is a new one.
  const cartSignature = JSON.stringify(lines.map((l) => [l.key, l.quantity, l.unitPriceBdt]))
  const idempotencyKey = useMemo(() => (cartSignature ? newIdempotencyKey() : ""), [cartSignature])

  const quote = form.district ? quoteDelivery(form.district, form.address, settings.deliveryZones) : null
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0)
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0)

  useEffect(() => {
    if (outcome.kind === "problems" || outcome.kind === "limited" || outcome.kind === "fallback") {
      statusRef.current?.focus()
    }
  }, [outcome])

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const showErrors = (next: Partial<Record<Field, string>>) => {
    setErrors(next)
    const first = FIELD_ORDER.find((f) => next[f])
    if (first) document.getElementById(`co-${first}`)?.focus()
  }

  const whatsappFallback = () => {
    const message = buildOrderMessage({
      code: createOrderCode(),
      lines,
      deliveryZones: settings.deliveryZones,
      customer: { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), district: form.district, note: form.note.trim() },
      delivery: quote ? { label: quote.label, feeBdt: quote.feeBdt } : undefined,
    })
    return whatsappUrl(settings.whatsappNumber, message)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (outcome.kind === "placing" || lines.length === 0) return

    const parsed = checkoutCustomerSchema.safeParse({ ...form, email: form.email || undefined })
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field
        if (!next[field]) next[field] = issue.message
      }
      showErrors(next)
      return
    }

    setOutcome({ kind: "placing" })
    const body = {
      idempotencyKey,
      customer: { ...form, email: form.email.trim() },
      website: form.website,
      lines: lines.map((l) => ({
        slug: l.slug,
        name: l.productName,
        color: l.colorName,
        design: l.designName ?? null,
        size: l.size,
        quantity: l.quantity,
        unitPriceBdt: l.unitPriceBdt,
        ...(l.customDtf
          ? {
              customDtf: {
                placements: l.customDtf.placements.map((p) => ({
                  id: p.id,
                  preset: p.preset,
                  widthIn: p.widthIn,
                  heightIn: p.heightIn,
                })),
                ...(l.customDtf.artworkNote ? { artworkNote: l.customDtf.artworkNote } : {}),
              },
            }
          : {}),
      })),
    }

    let challenge = await spamCheck.get()
    let result = challenge ? await postOrder({ ...body, challenge }) : null
    // An expired puzzle (the page was open a long time): solve a fresh one once.
    if (result && !result.ok && result.error === "challenge") {
      challenge = await spamCheck.refresh()
      result = challenge ? await postOrder({ ...body, challenge }) : null
    }

    if (!result) {
      setOutcome({ kind: "fallback", message: FALLBACK_MESSAGE })
      return
    }
    if (result.ok) {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(result))
      setOutcome({ kind: "done" })
      clear()
      router.replace("/order/confirmed/")
      return
    }
    switch (result.error) {
      case "invalid": {
        const next: Partial<Record<Field, string>> = {}
        for (const [key, message] of Object.entries(result.fields)) {
          const field = key.replace(/^customer\./, "") as Field
          if (FIELD_ORDER.includes(field)) next[field] = message
        }
        setOutcome({ kind: "idle" })
        if (Object.keys(next).length) showErrors(next)
        else setOutcome({ kind: "problems", message: result.message, problems: [] })
        return
      }
      case "problems": {
        const changed = result.problems.filter((p): p is Extract<OrderProblem, { kind: "price_changed" }> => p.kind === "price_changed")
        if (changed.length) setPriceUpdates((prev) => ({ ...prev, ...Object.fromEntries(changed.map((p) => [p.slug, p.priceBdt])) }))
        setOutcome({ kind: "problems", message: result.message, problems: result.problems })
        return
      }
      case "limited":
        setOutcome({ kind: "limited", message: result.message ?? "Too many orders in a short time." })
        return
      case "unsaved":
        setOutcome({ kind: "fallback", message: result.message })
        return
      default:
        setOutcome({ kind: "fallback", message: FALLBACK_MESSAGE })
    }
  }

  if (outcome.kind === "done") {
    return (
      <Shell>
        <p className="font-hud text-[11px] text-brand-bone/60" role="status">
          Order placed. Opening your confirmation...
        </p>
      </Shell>
    )
  }

  if (!loaded) {
    return (
      <Shell>
        <p className="font-hud text-[11px] text-brand-bone/50">Loading your cart...</p>
      </Shell>
    )
  }

  if (lines.length === 0) {
    return (
      <Shell>
        <div className="max-w-md">
          <p className="display text-3xl">Your cart is empty</p>
          <p className="mt-3 text-brand-bone/60">Pick a size on any product and tap Add to cart.</p>
          <Link href="/shop/" className="btn-signal mt-8">
            Shop the collection
          </Link>
        </div>
      </Shell>
    )
  }

  const placing = outcome.kind === "placing"
  const fallbackUrl = outcome.kind === "fallback" || outcome.kind === "limited" ? whatsappFallback() : null
  const messenger = messengerUrl(settings.messengerPage, "checkout")

  return (
    <Shell>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <form onSubmit={submit} noValidate aria-describedby="co-status" className="min-w-0">
          <section aria-labelledby="co-h-contact">
            <h2 id="co-h-contact" className="font-hud text-[11px] text-brand-bone/60">
              1 / Who is it for
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField id="name" label="Full name" autoComplete="name" value={form.name} onChange={update("name")} error={errors.name} />
              <TextField
                id="phone"
                label="Mobile number"
                hint="We call this number to confirm"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={update("phone")}
                error={errors.phone}
              />
            </div>
          </section>

          <section aria-labelledby="co-h-address" className="mt-10">
            <h2 id="co-h-address" className="font-hud text-[11px] text-brand-bone/60">
              2 / Where to deliver
            </h2>
            <div className="mt-4 grid gap-4">
              <div>
                <FieldLabel id="district" label="District" />
                <select
                  id="co-district"
                  value={form.district}
                  onChange={update("district")}
                  autoComplete="address-level1"
                  aria-invalid={Boolean(errors.district)}
                  aria-describedby={errors.district ? "co-district-error" : "co-district-hint"}
                  className={inputClass(Boolean(errors.district))}
                >
                  <option value="">Choose your district</option>
                  {CHECKOUT_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FieldMessage id="district" error={errors.district}>
                  {quote ? (
                    <>
                      {quote.label}: {formatBdt(quote.feeBdt)} delivery{quote.eta ? `, usually ${quote.eta}` : ""}
                    </>
                  ) : (
                    "The delivery fee depends on the district."
                  )}
                </FieldMessage>
              </div>
              <div>
                <FieldLabel id="address" label="Full address" />
                <textarea
                  id="co-address"
                  rows={3}
                  value={form.address}
                  onChange={update("address")}
                  autoComplete="street-address"
                  placeholder="House, road, area, thana"
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? "co-address-error" : "co-address-hint"}
                  className={clsx(inputClass(Boolean(errors.address)), "h-auto py-3")}
                />
                <FieldMessage id="address" error={errors.address}>
                  {form.district === "Dhaka"
                    ? "Savar, Keraniganj, Ashulia, Dhamrai and Tongi count as Dhaka suburbs. Include your area so the fee is right."
                    : "The courier uses this address, so include landmarks if it helps."}
                </FieldMessage>
              </div>
            </div>
          </section>

          <section aria-labelledby="co-h-extra" className="mt-10">
            <h2 id="co-h-extra" className="font-hud text-[11px] text-brand-bone/60">
              3 / Optional
            </h2>
            <div className="mt-4 grid gap-4">
              <TextField
                id="email"
                label="Email"
                hint="For an order confirmation. Leave it empty if you like."
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                error={errors.email}
              />
              <div>
                <FieldLabel id="note" label="Note for us" />
                <textarea
                  id="co-note"
                  rows={2}
                  value={form.note}
                  onChange={update("note")}
                  placeholder="For example: call after 5 pm"
                  aria-invalid={Boolean(errors.note)}
                  aria-describedby={errors.note ? "co-note-error" : undefined}
                  className={clsx(inputClass(Boolean(errors.note)), "h-auto py-3")}
                />
                <FieldMessage id="note" error={errors.note} />
              </div>
              {/* People never see this field; bots fill it in. */}
              <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="co-website">Website</label>
                <input id="co-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
              </div>
            </div>
          </section>

          <section aria-labelledby="co-h-payment" className="mt-10">
            <h2 id="co-h-payment" className="font-hud text-[11px] text-brand-bone/60">
              4 / Payment
            </h2>
            <div className="mt-4 flex items-start gap-4 border border-brand-accent/60 bg-brand-accent/5 p-4">
              <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-full border-[3px] border-brand-accent" />
              <div>
                <p className="font-semibold">Cash on delivery</p>
                <p className="mt-1 text-sm text-brand-bone/60">Pay the courier in cash when your parcel arrives. Nothing to pay now.</p>
              </div>
            </div>
          </section>

          <div className="mt-10 lg:hidden">
            <Totals subtotal={subtotal} quote={quote} />
          </div>

          <div id="co-status" ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
            {(outcome.kind === "problems" || outcome.kind === "limited" || outcome.kind === "fallback") && (
              <div className={clsx("mt-8 border p-4", outcome.kind === "problems" ? "border-brand-accent/60" : "border-red-400/60")}>
                <p className="font-semibold">{outcome.message}</p>
                {outcome.kind === "problems" && outcome.problems.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-bone/75">
                    {outcome.problems.map((p, i) => (
                      <li key={i}>{p.kind === "price_changed" ? `${prices[p.slug]?.name ?? p.slug} is now ${formatBdt(p.priceBdt)}. The total below is updated.` : p.message}</li>
                    ))}
                  </ul>
                )}
                {fallbackUrl && (
                  <a href={fallbackUrl} target="_blank" rel="noopener" className="btn-signal mt-4 w-full sm:w-auto">
                    <WhatsAppIcon /> Send this order on WhatsApp
                  </a>
                )}
                {outcome.kind === "fallback" && !fallbackUrl && messenger && (
                  <a href={messenger} target="_blank" rel="noopener" className="btn-outline mt-4 h-12 w-full sm:w-auto">
                    <MessengerIcon /> Message us on Messenger
                  </a>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={placing} className="btn-signal mt-8 w-full disabled:opacity-60">
            {placing ? "Placing your order..." : `Place order${quote ? `, ${formatBdt(subtotal + quote.feeBdt)}` : ""}`}
          </button>
          <p className="mt-3 text-center text-xs text-brand-bone/50">
            We use your details only to deliver this order and to contact you about it.
            {privacyHref && (
              <>
                {" "}
                <Link href={privacyHref} className="underline underline-offset-2 hover:text-brand-bone">
                  Privacy
                </Link>
              </>
            )}
          </p>
        </form>

        <aside aria-labelledby="co-h-summary" className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-white/10 p-5 md:p-6">
            <div className="flex items-baseline justify-between">
              <h2 id="co-h-summary" className="font-hud text-[11px] text-brand-bone/60">
                Your order
              </h2>
              <span className="font-hud text-[11px] text-brand-bone/50">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-white/10">
              {lines.map((line) => {
                const customGarment = getCustomGarmentConfig(line.slug)
                const thumb =
                  prices[line.slug]?.image ??
                  (customGarment ? prices[customGarment.baseProductSlug]?.image : undefined)
                return (
                <li key={line.key} className="flex gap-4 py-4">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" width={64} height={80} className="h-20 w-16 shrink-0 bg-white/5 object-cover" />
                  ) : (
                    <span aria-hidden className="h-20 w-16 shrink-0 bg-white/5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{line.productName}</p>
                    <p className="font-hud mt-1 text-[10px] text-brand-bone/50">{describeVariant(line) || "One size"}</p>
                    {line.customDtf && (
                      <div className="mt-1.5 space-y-0.5 text-[11px] text-brand-bone/65">
                        <p>
                          Base {customGarment?.shortTitle ?? "Custom"}: {formatBdt(customGarment?.customBasePriceBdt ?? CUSTOM_HOODIE_CONFIG.customBasePriceBdt)}
                        </p>
                        {line.customDtf.placements.map((p) => (
                          <p key={p.id}>
                            {CUSTOM_PLACEMENTS[p.id].breakdownLabel} ({formatDimension(p.widthIn)}&quot; × {formatDimension(p.heightIn)}&quot;): +{formatBdt(p.priceBdt)}
                          </p>
                        ))}
                        {line.customDtf.artworkNote && <p className="truncate">Artwork: {line.customDtf.artworkNote}</p>}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <QuantityStepper value={line.quantity} onChange={(q) => setQuantity(line.key, q)} label={line.productName} tone="dark" />
                      <button type="button" onClick={() => remove(line.key)} className="text-xs text-brand-bone/50 underline-offset-2 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-hud text-sm tracking-normal">{formatBdt(lineTotal(line))}</p>
                </li>
                )
              })}
            </ul>
            <div className="hidden border-t border-white/10 pt-4 lg:block">
              <Totals subtotal={subtotal} quote={quote} />
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-editorial px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <nav aria-label="Breadcrumb" className="font-hud text-[11px] text-brand-bone/50">
        <Link href="/" className="hover:text-brand-accent">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-brand-bone">Checkout</span>
      </nav>
      <h1 className="display mt-6 text-5xl md:text-7xl">Checkout</h1>
      <div className="mt-10">{children}</div>
    </div>
  )
}

function Totals({ subtotal, quote }: { subtotal: number; quote: ReturnType<typeof quoteDelivery> }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-brand-bone/60">Subtotal</dt>
        <dd className="font-hud tracking-normal">{formatBdt(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-brand-bone/60">Delivery{quote ? ` (${quote.label})` : ""}</dt>
        <dd className="font-hud tracking-normal">{quote ? formatBdt(quote.feeBdt) : "Choose district"}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
        <dt className="font-semibold">Total to pay on delivery</dt>
        <dd className="display text-3xl tracking-normal">{formatBdt(subtotal + (quote?.feeBdt ?? 0))}</dd>
      </div>
    </dl>
  )
}

const inputClass = (invalid: boolean) =>
  clsx(
    "h-12 w-full border bg-white/[0.03] px-4 text-base text-brand-bone outline-none transition-colors placeholder:text-brand-bone/30 focus:border-brand-accent",
    invalid ? "border-red-400" : "border-white/15 hover:border-white/30"
  )

function FieldLabel({ id, label }: { id: Field; label: string }) {
  return (
    <label htmlFor={`co-${id}`} className="mb-2 block text-sm font-semibold">
      {label}
    </label>
  )
}

function FieldMessage({ id, error, children }: { id: Field; error?: string; children?: ReactNode }) {
  if (error) {
    return (
      <p id={`co-${id}-error`} className="mt-2 text-sm text-red-300">
        {error}
      </p>
    )
  }
  return children ? (
    <p id={`co-${id}-hint`} className="mt-2 text-xs text-brand-bone/50">
      {children}
    </p>
  ) : null
}

function TextField({
  id,
  label,
  hint,
  error,
  ...input
}: { id: Field; label: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <FieldLabel id={id} label={label} />
      <input
        id={`co-${id}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `co-${id}-error` : hint ? `co-${id}-hint` : undefined}
        className={inputClass(Boolean(error))}
        {...input}
      />
      <FieldMessage id={id} error={error}>
        {hint}
      </FieldMessage>
    </div>
  )
}
