"use client"

import { Link } from "next-view-transitions"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clsx } from "clsx"
import { CUSTOM_HOODIE_CONFIG, CUSTOM_TEE_CONFIG, formatBdt, type CatalogueProduct, type SiteSettings } from "@dtc/catalogue-core"
import { QuantityStepper } from "@/components/order/order-drawer"
import { useOrder } from "@/components/order/order-provider"
import { useSendOrder } from "@/components/order/use-send-order"
import { MessengerIcon, WhatsAppIcon } from "@/components/ui/icons"
import { CART_LABEL, CHECKOUT_ENABLED } from "@/lib/checkout"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { findByParam, optionParam } from "@/lib/gallery"
import { trackAddToCart, trackChatClick, trackViewContent } from "@/lib/meta-pixel"
import type { OrderLine } from "@/lib/order-message"
import { ProductGallery, type GalleryJump } from "./product-gallery"
import { SizeGuide } from "./size-guide"

const DETAIL_LABEL: Record<string, string> = {
  fabric: "Fabric",
  gsm: "Weight",
  fit: "Fit",
  origin: "Origin",
  care: "Care",
}

export function ProductView({ product, settings }: { product: CatalogueProduct; settings: SiteSettings }) {
  const root = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const sizesRef = useRef<HTMLFieldSetElement>(null)
  const { add, setDrawerOpen, showToast } = useOrder()
  const router = useRouter()
  const { send, channels, hasChannel } = useSendOrder(settings)

  // Default: the first in-stock color that has photos.
  const initialColor = useMemo(() => {
    const withPhotos = new Set(product.images.map((img) => img.colorId).filter(Boolean))
    return (
      product.colors.find((c) => c.inStock && withPhotos.has(c.id)) ??
      product.colors.find((c) => c.inStock) ??
      product.colors[0] ??
      null
    )
  }, [product.colors, product.images])
  const [colorId, setColorId] = useState<string | null>(initialColor?.id ?? null)
  const [jump, setJump] = useState<GalleryJump | null>(null)
  const colorChanged = useRef(false)
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 && !product.soldOutSizes.includes(product.sizes[0]) ? product.sizes[0] : null)
  const [quantity, setQuantity] = useState(1)
  const [needSize, setNeedSize] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [actionsVisible, setActionsVisible] = useState(true)

  const color = product.colors.find((c) => c.id === colorId) ?? null
  const colorAvailable = !color || color.inStock
  const needsSize = product.sizes.length > 0
  const canOrder = !product.soldOut && colorAvailable

  const details = Object.entries(product.details).filter(([key, value]) => DETAIL_LABEL[key] && key !== "care" && value)
  const hasChart = product.sizeChart.columns.length > 0 && product.sizeChart.rows.length > 0

  /** A swatch was tapped: select it and show its photos. */
  const pickColor = (id: string) => {
    colorChanged.current = true
    setColorId(id)
    setJump({ colorId: id, nonce: Date.now() })
  }

  /** Swiping reached another color's photos. */
  const spyColor = useCallback((id: string) => {
    colorChanged.current = true
    setColorId(id)
  }, [])

  // A shared link such as ?color=maroon opens on that color.
  useEffect(() => {
    const match = findByParam(product.colors, new URLSearchParams(window.location.search).get("color"))
    if (match) {
      setColorId(match.id)
      setJump({ colorId: match.id, nonce: Date.now(), instant: true })
    }
  }, [product.colors])

  // Keep the address in step with the chosen color, so the link can be shared.
  useEffect(() => {
    if (!colorChanged.current || !color || product.colors.length < 2) return
    const url = new URL(window.location.href)
    url.searchParams.set("color", optionParam(color.name))
    window.history.replaceState(window.history.state, "", url)
  }, [color, product.colors.length])

  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setActionsVisible(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from("[data-pdp]", { y: 40, opacity: 0, duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.15 })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  useEffect(() => {
    trackViewContent(product)
  }, [product])

  /** Returns the order line, or null after asking for a size. */
  const currentLine = (): OrderLine | null => {
    if (needsSize && !size) {
      setNeedSize(true)
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return null
    }
    return {
      slug: product.slug,
      productName: product.name,
      colorName: color?.name ?? null,
      size,
      quantity,
      unitPriceBdt: product.priceBdt,
    }
  }

  const orderNow = (channel: "whatsapp" | "messenger") => {
    const line = currentLine()
    if (line) {
      trackChatClick(channel)
      send(channel, [line])
    }
  }

  const addToList = () => {
    const line = currentLine()
    if (!line) return
    add(line)
    trackAddToCart({
      metaContentId: product.metaContentId,
      name: product.name,
      unitPriceBdt: product.priceBdt,
      quantity,
    })
    showToast(`Added ${product.name}${size ? `, size ${size}` : ""} to your ${CART_LABEL.toLowerCase()}.`)
    setDrawerOpen(true)
  }

  const buyNow = () => {
    const line = currentLine()
    if (!line) return
    add(line)
    trackAddToCart({
      metaContentId: product.metaContentId,
      name: product.name,
      unitPriceBdt: product.priceBdt,
      quantity,
    })
    router.push("/checkout/")
  }

  return (
    <div ref={root} className="mx-auto grid max-w-editorial gap-8 px-0 pb-24 pt-16 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-14 md:px-10 md:pt-24">
      <ProductGallery
        images={product.images}
        colors={product.colors}
        selectedColorId={colorId}
        jump={jump}
        onSpyColor={spyColor}
        onPickColor={pickColor}
        slug={product.slug}
        name={product.name}
      />

      <div className="px-5 md:px-0">
        <div className="md:sticky md:top-24">
          <nav data-pdp aria-label="Breadcrumb" className="font-hud text-[11px] text-brand-bone/50">
            <Link href="/" className="hover:text-brand-accent">Home</Link>
            <span aria-hidden> / </span>
            <Link href="/#collection" className="hover:text-brand-accent">{product.category?.name ?? "Collection"}</Link>
          </nav>
          <h1 data-pdp className="display mt-3 text-5xl md:text-6xl lg:text-7xl">
            {product.name}
          </h1>
          {product.tagline && (
            <p data-pdp className="mt-4 text-lg text-brand-bone/75">
              {product.tagline}
            </p>
          )}
          <p data-pdp className="mt-6 flex items-baseline gap-3">
            <span className="font-hud text-2xl tracking-normal">{formatBdt(product.priceBdt)}</span>
            {product.compareAtBdt && <span className="font-hud text-sm tracking-normal text-brand-bone/40 line-through">{formatBdt(product.compareAtBdt)}</span>}
            {product.compareAtBdt && !product.soldOut && (
              <span className="font-hud self-center bg-brand-accent px-2 py-0.5 text-[10px] text-brand-graphite">
                Save {formatBdt(product.compareAtBdt - product.priceBdt)}
              </span>
            )}
            {product.soldOut && <span className="font-hud self-center bg-white/10 px-2 py-0.5 text-[10px]">Sold out</span>}
          </p>

          {product.colors.length > 0 && (
            <fieldset data-pdp className="mt-8">
              <legend className="font-hud text-[11px] text-brand-bone/60">
                Color: <span className="text-brand-bone">{color?.name}</span>
                {color && !color.inStock && <span className="text-brand-accent"> (coming soon)</span>}
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickColor(c.id)}
                    aria-pressed={c.id === colorId}
                    aria-label={`${c.name}${c.inStock ? "" : ", coming soon"}`}
                    title={c.name}
                    className={clsx(
                      "relative h-11 w-11 border-2 p-1 transition-colors",
                      c.id === colorId ? "border-brand-accent" : "border-white/15 hover:border-white/40"
                    )}
                  >
                    <span className="block h-full w-full border border-black/20" style={{ backgroundColor: c.hex }} />
                    {!c.inStock && <span aria-hidden className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-brand-bone/70" />}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {needsSize && (
            <fieldset ref={sizesRef} data-pdp className="mt-8">
              <div className="flex items-center justify-between">
                <legend className={clsx("font-hud text-[11px]", needSize && !size ? "text-brand-accent" : "text-brand-bone/60")}>
                  {needSize && !size ? "Choose a size to continue" : `Size${size ? `: ${size}` : ""}`}
                </legend>
                {hasChart && (
                  <button type="button" onClick={() => setGuideOpen(true)} className="font-hud text-[11px] text-brand-bone/60 underline underline-offset-4 hover:text-brand-accent">
                    Size guide
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.sizes.map((s) => {
                  const soldOut = product.soldOutSizes.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={soldOut}
                      aria-pressed={s === size}
                      aria-label={soldOut ? `${s}, sold out` : s}
                      onClick={() => {
                        setSize(s)
                        setNeedSize(false)
                      }}
                      className={clsx(
                        "font-hud h-12 border text-sm tracking-normal transition-colors",
                        s === size ? "border-brand-accent bg-brand-accent text-brand-graphite" : "border-white/15 hover:border-brand-bone",
                        soldOut && "cursor-not-allowed border-white/5 text-brand-bone/25 line-through hover:border-white/5"
                      )}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          <div data-pdp ref={actionsRef} className="mt-8 space-y-3">
            {canOrder ? (
              <>
                <div className="flex items-center gap-4">
                  <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} tone="dark" />
                  <span className="font-hud text-[11px] text-brand-bone/50">Total {formatBdt(product.priceBdt * quantity)}</span>
                </div>
                {CHECKOUT_ENABLED ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button type="button" onClick={addToList} className="btn-signal">
                        Add to cart
                      </button>
                      <button type="button" onClick={buyNow} className="btn-outline">
                        Buy now
                      </button>
                    </div>
                    {hasChannel && (
                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-bone/60">
                        <span>Prefer chat?</span>
                        {channels.whatsapp && (
                          <button type="button" onClick={() => orderNow("whatsapp")} className="inline-flex items-center gap-1.5 font-semibold text-brand-bone hover:text-brand-accent">
                            <WhatsAppIcon size={16} /> Order on WhatsApp
                          </button>
                        )}
                        {channels.messenger && (
                          <button type="button" onClick={() => orderNow("messenger")} className="inline-flex items-center gap-1.5 font-semibold text-brand-bone hover:text-brand-accent">
                            <MessengerIcon size={16} /> Messenger
                          </button>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-brand-bone/50">No account needed. Pay cash on delivery.</p>
                  </>
                ) : hasChannel ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {channels.whatsapp && (
                      <button type="button" onClick={() => orderNow("whatsapp")} className={clsx("btn-signal", !channels.messenger && "sm:col-span-2")}>
                        <WhatsAppIcon /> Order on WhatsApp
                      </button>
                    )}
                    {channels.messenger && (
                      <button type="button" onClick={() => orderNow("messenger")} className={clsx("btn-outline", !channels.whatsapp && "sm:col-span-2")}>
                        <MessengerIcon /> Order on Messenger
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="border border-white/15 p-4 text-sm text-brand-bone/70">Ordering opens soon.</p>
                )}
                {!CHECKOUT_ENABLED && (
                  <>
                    <button type="button" onClick={addToList} className="h-12 w-full border border-white/15 font-hud text-[11px] transition-colors hover:border-brand-bone">
                      Add to order list
                    </button>
                    <p className="text-xs text-brand-bone/50">Your order opens as a message you can check before sending. Pay cash on delivery.</p>
                  </>
                )}
              </>
            ) : (
              <p className="border border-white/15 p-4 text-sm">
                {product.soldOut ? "Sold out. Message us to hear when it is back." : `${color?.name} is coming soon. Choose another color.`}
              </p>
            )}
            {product.slug === CUSTOM_HOODIE_CONFIG.baseProductSlug && (
              <div className="mt-4 border border-white/15 bg-brand-graphite-dark p-3.5 text-xs text-brand-bone/80">
                <p className="font-hud text-[10px] text-brand-accent">Custom DTF option</p>
                <p className="mt-1">
                  Want a custom print on this hoodie? Configure placements and dimensions live from {formatBdt(CUSTOM_HOODIE_CONFIG.customBasePriceBdt)}.{" "}
                  <Link href="/custom-hoodie/" className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-bone">
                    Open Custom Hoodie Calculator
                  </Link>
                </p>
              </div>
            )}
            {product.category?.slug === "drop-shoulder-tees" && (
              <div className="mt-4 border border-white/15 bg-brand-graphite-dark p-3.5 text-xs text-brand-bone/80">
                <p className="font-hud text-[10px] text-brand-accent">Custom DTF option</p>
                <p className="mt-1">
                  Want your own DTF print on this drop-shoulder tee? Configure placements and dimensions live from {formatBdt(CUSTOM_TEE_CONFIG.customBasePriceBdt)}.{" "}
                  <Link href="/custom-tee/" className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-bone">
                    Open Custom Tee Calculator
                  </Link>
                </p>
              </div>
            )}
          </div>

          {product.descriptionHtml && (
            // Sanitized at build time by descriptionToHtml in @dtc/catalogue-core.
            <div data-pdp className="rich-text mt-10" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          )}

          <div data-pdp className="mt-8 border-t border-white/10">
            {details.length > 0 && (
              <Accordion title="Details" defaultOpen>
                <dl>
                  {details.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[96px_1fr] gap-4 py-2 text-sm">
                      <dt className="font-hud text-[10px] text-brand-bone/50">{DETAIL_LABEL[key]}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
            )}
            {product.details.care && (
              <Accordion title="Care">
                <p className="text-sm text-brand-bone/75">{product.details.care}</p>
              </Accordion>
            )}
            {(hasChart || product.details.fit) && (
              <Accordion title="Size and fit">
                {product.details.fit && <p className="text-sm text-brand-bone/75">{product.details.fit}.</p>}
                {hasChart && (
                  <button type="button" onClick={() => setGuideOpen(true)} className="font-hud mt-3 text-[11px] text-brand-accent underline underline-offset-4">
                    Open the size guide
                  </button>
                )}
              </Accordion>
            )}
            <Accordion title="Delivery and payment">
              {settings.deliveryZones.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {settings.deliveryZones.map((zone) => (
                    <li key={zone.name} className="flex justify-between gap-4">
                      <span>
                        {zone.name} <span className="text-brand-bone/50">· {zone.eta}</span>
                      </span>
                      <span className="font-hud tracking-normal">{formatBdt(zone.feeBdt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm text-brand-bone/75">
                Cash on delivery. Questions about sizes or exchanges?{" "}
                <Link href="/#faq" className="text-brand-accent underline underline-offset-4">
                  Read the FAQ
                </Link>
                .
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {canOrder && (hasChannel || CHECKOUT_ENABLED) && (
        <div
          className={clsx(
            "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-white/10 bg-brand-graphite/95 px-4 py-3 backdrop-blur transition-transform duration-500 md:hidden",
            actionsVisible ? "translate-y-full" : "translate-y-0"
          )}
          aria-hidden={actionsVisible}
          inert={actionsVisible}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="font-hud text-[11px] tracking-normal text-brand-bone/60">
              {formatBdt(product.priceBdt)}
              {size ? ` / ${size}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (CHECKOUT_ENABLED ? addToList() : orderNow(channels.whatsapp ? "whatsapp" : "messenger"))}
            className="btn-signal h-12 px-5"
          >
            {size || !needsSize ? (CHECKOUT_ENABLED ? "Add to cart" : "Order now") : "Choose size"}
          </button>
        </div>
      )}

      {hasChart && <SizeGuide chart={product.sizeChart} open={guideOpen} onClose={() => setGuideOpen(false)} />}
    </div>
  )
}

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="group border-b border-white/10" open={defaultOpen}>
      <summary className="font-hud flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[11px] text-brand-bone [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="relative h-3 w-3 shrink-0">
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  )
}
