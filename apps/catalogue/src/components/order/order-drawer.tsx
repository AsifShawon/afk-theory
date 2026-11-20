"use client"

import { Link } from "next-view-transitions"
import { useEffect, useRef } from "react"
import { clsx } from "clsx"
import { formatBdt, type SiteSettings } from "@dtc/catalogue-core"
import { useLenis } from "@/components/motion/smooth-scroll"
import { CloseIcon, MessengerIcon, WhatsAppIcon } from "@/components/ui/icons"
import { describeVariant, lineTotal, MAX_QUANTITY, orderSubtotal } from "@/lib/order-message"
import { useOrder } from "./order-provider"
import { useSendOrder } from "./use-send-order"

export function OrderDrawer({ settings }: { settings: SiteSettings }) {
  const { items, drawerOpen, setDrawerOpen, setQuantity, remove, clear } = useOrder()
  const { send, channels, hasChannel } = useSendOrder(settings)
  const lenis = useLenis()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!drawerOpen) return
    lenis?.stop()
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      lenis?.start()
      window.removeEventListener("keydown", onKey)
    }
  }, [drawerOpen, lenis, setDrawerOpen])

  const subtotal = orderSubtotal(items)

  return (
    <div className={clsx("fixed inset-0 z-50", drawerOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!drawerOpen}>
      <div
        onClick={() => setDrawerOpen(false)}
        className={clsx("absolute inset-0 bg-black/60 transition-opacity duration-500", drawerOpen ? "opacity-100" : "opacity-0")}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Order list"
        inert={!drawerOpen}
        className={clsx(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-brand-bone text-brand-graphite transition-transform duration-500 ease-out-expo",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-graphite/10 px-6 py-5">
          <div>
            <h2 className="display text-3xl">Order list</h2>
            <p className="font-hud mt-1 text-[10px] text-brand-muted">Sent as one message. Pay cash on delivery.</p>
          </div>
          <button ref={closeRef} onClick={() => setDrawerOpen(false)} className="p-2 hover:text-brand-olive" aria-label="Close order list">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6" data-lenis-prevent>
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="display text-2xl">Nothing here yet</p>
              <p className="mt-2 text-sm text-brand-muted">Pick a size on any product and choose Add to order list.</p>
              <Link href="/#collection" onClick={() => setDrawerOpen(false)} className="btn-outline mt-6 h-12">
                Browse the collection
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-brand-graphite/10">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}/`} onClick={() => setDrawerOpen(false)} className="font-semibold hover:underline">
                      {item.productName}
                    </Link>
                    <p className="font-hud mt-1 text-[10px] text-brand-muted">{describeVariant(item) || "One size"}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.key, q)} label={item.productName} />
                      <button onClick={() => remove(item.key)} className="text-xs font-semibold text-brand-muted underline-offset-2 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-hud text-sm tracking-normal">{formatBdt(lineTotal(item))}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-brand-graphite/10 px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="font-hud text-[11px] text-brand-muted">Subtotal</span>
              <span className="display text-3xl tracking-normal">{formatBdt(subtotal)}</span>
            </div>
            <p className="text-xs text-brand-muted">Delivery is added by area and confirmed in the chat.</p>
            {hasChannel ? (
              <div className="grid gap-2">
                {channels.whatsapp && (
                  <button onClick={() => send("whatsapp", items)} className="btn-signal w-full">
                    <WhatsAppIcon /> Send order on WhatsApp
                  </button>
                )}
                {channels.messenger && (
                  <button onClick={() => send("messenger", items)} className="btn-outline h-12 w-full">
                    <MessengerIcon /> Send on Messenger
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold">Ordering opens soon.</p>
            )}
            <button onClick={clear} className="w-full text-center text-xs font-semibold text-brand-muted hover:underline">
              Clear order list
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

export function QuantityStepper({
  value,
  onChange,
  label,
  tone = "light",
}: {
  value: number
  onChange: (value: number) => void
  label: string
  tone?: "light" | "dark"
}) {
  const border = tone === "light" ? "border-brand-graphite/20" : "border-white/20"
  return (
    <div className={clsx("flex h-10 items-center border", border)}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} className="h-full w-10 text-lg disabled:opacity-30" aria-label={`Decrease quantity of ${label}`}>
        -
      </button>
      <span className="font-hud w-8 text-center text-sm tracking-normal" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_QUANTITY} className="h-full w-10 text-lg disabled:opacity-30" aria-label={`Increase quantity of ${label}`}>
        +
      </button>
    </div>
  )
}
