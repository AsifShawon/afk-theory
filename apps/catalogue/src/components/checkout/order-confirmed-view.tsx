"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { formatBdt, normalizeWhatsappNumber } from "@dtc/catalogue-core"
import type { PlacedOrderSummary } from "@dtc/catalogue-core/orders"
import { WhatsAppIcon } from "@/components/ui/icons"
import { LAST_ORDER_KEY } from "@/lib/checkout"
import { describeVariant } from "@/lib/order-message"

/**
 * Shown after checkout. A static site has no per-order pages, so the order
 * comes from sessionStorage: it is visible in this tab only, and gone when
 * the tab closes.
 */
export function OrderConfirmedView({ whatsappNumber }: { whatsappNumber: string }) {
  const [order, setOrder] = useState<PlacedOrderSummary | null | undefined>(undefined)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY)
      setOrder(raw ? (JSON.parse(raw) as PlacedOrderSummary) : null)
    } catch {
      setOrder(null)
    }
  }, [])

  if (order === undefined) {
    return <p className="font-hud text-[11px] text-brand-bone/50">Loading...</p>
  }

  if (order === null) {
    return (
      <div className="max-w-md">
        <h1 className="display text-5xl">No recent order</h1>
        <p className="mt-4 text-brand-bone/60">Orders show here right after checkout, in the same browser tab. If you placed one, we will call you to confirm it.</p>
        <Link href="/shop/" className="btn-signal mt-8">
          Shop the collection
        </Link>
      </div>
    )
  }

  const digits = normalizeWhatsappNumber(whatsappNumber)
  const whatsapp = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi AFK THEORY, about my order ${order.code}`)}` : null
  const firstName = order.customer.name.split(" ")[0]
  const { delivery } = order.order

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
      <div>
        <p className="font-hud text-[11px] text-brand-accent">Order placed</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">Thanks, {firstName}</h1>
        <p className="mt-6 text-lg text-brand-bone/75">
          Your order number is <strong className="font-hud tracking-normal text-brand-bone">{order.code}</strong>.
        </p>

        <ol className="mt-10 space-y-6">
          <Step n={1} title="We call to confirm">
            We call <strong>{order.customer.phone}</strong> soon to confirm your order. Please pick up.
          </Step>
          <Step n={2} title="We ship it">
            The courier delivers to {order.customer.district}
            {delivery.eta ? `, usually in ${delivery.eta}` : ""}.
          </Step>
          <Step n={3} title="Pay on delivery">
            Pay <strong>{formatBdt(order.order.totalBdt)}</strong> in cash when the parcel arrives.
          </Step>
        </ol>

        <p className="mt-10 text-sm text-brand-bone/60">
          {order.customerEmailed && order.customer.email
            ? `A confirmation is on its way to ${order.customer.email}. Check spam if it does not arrive.`
            : "Keep your order number. Mention it if you contact us."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener" className="btn-outline h-12">
              <WhatsAppIcon /> Questions? Message us
            </a>
          )}
          <Link href="/shop/" className="btn-signal h-12">
            Keep shopping
          </Link>
        </div>
      </div>

      <aside aria-labelledby="oc-summary" className="border border-white/10 p-5 md:p-6 lg:self-start">
        <h2 id="oc-summary" className="font-hud text-[11px] text-brand-bone/60">
          Order {order.code}
        </h2>
        <ul className="mt-4 divide-y divide-white/10">
          {order.order.lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="font-semibold">{line.name}</span>
                <span className="font-hud mt-1 block text-[10px] text-brand-bone/50">
                  {describeVariant({ designName: line.design, colorName: line.color, size: line.size }) || "One size"} x {line.quantity}
                </span>
              </span>
              <span className="font-hud tracking-normal">{formatBdt(line.lineTotalBdt)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-brand-bone/60">Subtotal</dt>
            <dd className="font-hud tracking-normal">{formatBdt(order.order.subtotalBdt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-brand-bone/60">Delivery ({delivery.label})</dt>
            <dd className="font-hud tracking-normal">{formatBdt(delivery.feeBdt)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
            <dt className="font-semibold">Cash on delivery</dt>
            <dd className="display text-3xl tracking-normal">{formatBdt(order.order.totalBdt)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="font-hud flex h-9 w-9 shrink-0 items-center justify-center border border-brand-accent text-sm tracking-normal text-brand-accent">{n}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-brand-bone/65">{children}</p>
      </div>
    </li>
  )
}
