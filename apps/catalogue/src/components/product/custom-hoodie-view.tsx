"use client"

import { Link } from "next-view-transitions"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clsx } from "clsx"
import {
  clampDimension,
  CUSTOM_GARMENTS,
  CUSTOM_HOODIE_CONFIG,
  CUSTOM_PLACEMENT_IDS,
  CUSTOM_PLACEMENTS,
  CUSTOM_SIZE_PRESETS,
  CUSTOM_TEE_CONFIG,
  formatBdt,
  formatDimension,
  isPresetAllowedForPlacement,
  priceCustomDtfItem,
  type CatalogueProduct,
  type CustomDtfConfig,
  type CustomGarmentConfig,
  type CustomPlacementId,
  type CustomPresetId,
  type SiteSettings,
} from "@dtc/catalogue-core"
import { QuantityStepper } from "@/components/order/order-drawer"
import { useOrder } from "@/components/order/order-provider"
import { useSendOrder } from "@/components/order/use-send-order"
import { MessengerIcon, WhatsAppIcon } from "@/components/ui/icons"
import { CART_LABEL, CHECKOUT_ENABLED } from "@/lib/checkout"
import { findByParam, optionParam } from "@/lib/gallery"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { trackAddToCart, trackChatClick } from "@/lib/meta-pixel"
import type { OrderLine } from "@/lib/order-message"
import { ProductGallery, type GalleryJump } from "./product-gallery"
import { SizeGuide } from "./size-guide"

interface PlacementDraft {
  enabled: boolean
  preset: CustomPresetId
  widthIn: number
  heightIn: number
}

type PlacementsState = Record<CustomPlacementId, PlacementDraft>

function initialPlacements(): PlacementsState {
  return {
    front: { enabled: false, preset: "4x4", widthIn: 4, heightIn: 4 },
    back: { enabled: true, preset: "14x10", widthIn: 14, heightIn: 10 },
    left_sleeve: { enabled: false, preset: "4x4", widthIn: 4, heightIn: 4 },
    right_sleeve: { enabled: false, preset: "4x4", widthIn: 4, heightIn: 4 },
  }
}

const DETAIL_LABEL: Record<string, string> = {
  fabric: "Fabric",
  gsm: "Weight",
  fit: "Fit",
  origin: "Origin",
}

export function CustomDtfView({
  product,
  settings,
  garment = CUSTOM_GARMENTS[CUSTOM_HOODIE_CONFIG.customProductSlug],
}: {
  product: CatalogueProduct
  settings: SiteSettings
  garment?: CustomGarmentConfig
}) {
  const isTee = garment.customProductSlug === CUSTOM_TEE_CONFIG.customProductSlug
  const root = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const sizesRef = useRef<HTMLFieldSetElement>(null)
  const { add, setDrawerOpen, showToast } = useOrder()
  const router = useRouter()
  const { send, channels, hasChannel } = useSendOrder(settings)

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
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 && !product.soldOutSizes.includes(product.sizes[0]) ? product.sizes[0] : "L"
  )
  const [quantity, setQuantity] = useState(1)
  const [needSize, setNeedSize] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [actionsVisible, setActionsVisible] = useState(true)

  const [placements, setPlacements] = useState<PlacementsState>(initialPlacements)
  const [artworkNote, setArtworkNote] = useState("")
  const [attachedFilename, setAttachedFilename] = useState<string | null>(null)

  const color = product.colors.find((c) => c.id === colorId) ?? null
  const colorAvailable = !color || color.inStock
  const needsSize = product.sizes.length > 0
  const canOrder = !product.soldOut && colorAvailable

  const details = Object.entries(product.details).filter(([key, value]) => DETAIL_LABEL[key] && value)
  const hasChart = product.sizeChart.columns.length > 0 && product.sizeChart.rows.length > 0

  const activeInputs = useMemo(
    () =>
      CUSTOM_PLACEMENT_IDS.filter((id) => placements[id].enabled).map((id) => ({
        id,
        preset: placements[id].preset,
        widthIn: placements[id].widthIn,
        heightIn: placements[id].heightIn,
      })),
    [placements]
  )

  const pricing = useMemo(() => priceCustomDtfItem(activeInputs, garment.customBasePriceBdt), [activeInputs, garment.customBasePriceBdt])
  const totalPrice = pricing.unitPriceBdt * quantity

  const pickColor = (id: string) => {
    colorChanged.current = true
    setColorId(id)
    setJump({ colorId: id, nonce: Date.now() })
  }

  const spyColor = useCallback((id: string) => {
    colorChanged.current = true
    setColorId(id)
  }, [])

  useEffect(() => {
    const match = findByParam(product.colors, new URLSearchParams(window.location.search).get("color"))
    if (match) {
      setColorId(match.id)
      setJump({ colorId: match.id, nonce: Date.now(), instant: true })
    }
  }, [product.colors])

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
        gsap.from("[data-pdp]", { y: 40, opacity: 0, duration: 1, stagger: 0.05, ease: "expo.out", delay: 0.12 })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  const togglePlacement = (id: CustomPlacementId) => {
    setPlacements((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }))
  }

  const selectPreset = (id: CustomPlacementId, presetId: CustomPresetId) => {
    if (presetId === "custom") {
      setPlacements((prev) => ({
        ...prev,
        [id]: { ...prev[id], preset: "custom" },
      }))
      return
    }
    const found = CUSTOM_SIZE_PRESETS.find((p) => p.id === presetId)
    if (!found || !isPresetAllowedForPlacement(found, id)) return
    setPlacements((prev) => ({
      ...prev,
      [id]: { ...prev[id], preset: presetId, widthIn: found.widthIn, heightIn: found.heightIn },
    }))
  }

  const updateDimension = (id: CustomPlacementId, axis: "widthIn" | "heightIn", raw: string) => {
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    const def = CUSTOM_PLACEMENTS[id]
    const max = axis === "widthIn" ? def.maxWidthIn : def.maxHeightIn
    const clamped = clampDimension(num, max)
    setPlacements((prev) => ({
      ...prev,
      [id]: { ...prev[id], preset: "custom", [axis]: clamped },
    }))
  }

  const buildOrderLine = (): OrderLine | null => {
    if (needsSize && !size) {
      setNeedSize(true)
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return null
    }
    const combinedNote = [artworkNote.trim(), attachedFilename ? `File: ${attachedFilename}` : ""].filter(Boolean).join(" | ")
    const customDtf: CustomDtfConfig = {
      placements: pricing.itemized.map((p) => ({
        id: p.id,
        preset: p.preset ?? "custom",
        widthIn: p.widthIn,
        heightIn: p.heightIn,
        priceBdt: p.priceBdt,
      })),
      ...(combinedNote ? { artworkNote: combinedNote.slice(0, 300) } : {}),
    }
    return {
      slug: garment.customProductSlug,
      productName: garment.customProductName,
      colorName: color?.name ?? null,
      size,
      quantity,
      unitPriceBdt: pricing.unitPriceBdt,
      customDtf,
    }
  }

  const orderNow = (channel: "whatsapp" | "messenger") => {
    const line = buildOrderLine()
    if (!line) return
    trackChatClick(channel)
    send(channel, [line])
  }

  const addToList = () => {
    const line = buildOrderLine()
    if (!line) return
    add(line)
    trackAddToCart({
      metaContentId: null,
      name: garment.customProductName,
      unitPriceBdt: pricing.unitPriceBdt,
      quantity,
    })
    showToast(`Added ${garment.customProductName}${size ? `, size ${size}` : ""} to your ${CART_LABEL.toLowerCase()}.`)
    setDrawerOpen(true)
  }

  const buyNow = () => {
    const line = buildOrderLine()
    if (!line) return
    add(line)
    trackAddToCart({
      metaContentId: null,
      name: garment.customProductName,
      unitPriceBdt: pricing.unitPriceBdt,
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
        slug={garment.customProductSlug}
        name={garment.customProductName}
      />

      <div className="px-5 md:px-0">
        <div className="md:sticky md:top-24">
          <nav data-pdp aria-label="Breadcrumb" className="font-hud text-[11px] text-brand-bone/50">
            <Link href="/" className="hover:text-brand-accent">Home</Link>
            <span aria-hidden> / </span>
            <Link href="/custom-design/" className="hover:text-brand-accent">Custom designs</Link>
            <span aria-hidden> / </span>
            <span className="text-brand-bone">{garment.shortTitle}</span>
          </nav>

          <h1 data-pdp className="display mt-3 text-5xl md:text-6xl lg:text-7xl">
            {garment.customProductName}
          </h1>
          <p data-pdp className="mt-4 text-lg text-brand-bone/75">
            {product.tagline || "Heavyweight drop-shoulder blank with custom DTF print placement."}
          </p>

          <p data-pdp className="mt-6 flex items-baseline gap-3">
            <span className="font-hud text-2xl tracking-normal text-brand-bone">{formatBdt(pricing.unitPriceBdt)}</span>
            <span className="font-hud text-[11px] text-brand-bone/50">Base {formatBdt(pricing.basePriceBdt)} + prints</span>
            {product.soldOut && <span className="font-hud self-center bg-white/10 px-2 py-0.5 text-[10px]">Sold out</span>}
          </p>

          {/* Color selector */}
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

          {/* Size selector */}
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

          {/* Print placement multi-select & per-placement size configurator */}
          <fieldset data-pdp className="mt-8 space-y-4">
            <div className="flex items-baseline justify-between">
              <legend className="font-hud text-[11px] text-brand-bone/60">Print placements</legend>
              <span className="font-hud text-[10px] text-brand-accent">
                {pricing.itemized.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CUSTOM_PLACEMENT_IDS.map((id) => {
                const def = CUSTOM_PLACEMENTS[id]
                const active = placements[id].enabled
                const priced = pricing.itemized.find((p) => p.id === id)
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => togglePlacement(id)}
                    className={clsx(
                      "flex flex-col items-start border px-3.5 py-3 text-left transition-colors",
                      active ? "border-brand-accent bg-brand-accent/10 text-brand-bone" : "border-white/15 text-brand-bone/70 hover:border-white/40"
                    )}
                  >
                    <span className="flex w-full flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <span className="font-hud text-[11px]">{def.label}</span>
                      <span className={clsx("font-hud whitespace-nowrap text-[10px] tracking-normal", active ? "text-brand-accent" : "text-brand-bone/45")}>
                        {active && priced ? `+${formatBdt(priced.priceBdt)}` : `≤ ${def.maxWidthIn}"×${def.maxHeightIn}"`}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {CUSTOM_PLACEMENT_IDS.filter((id) => placements[id].enabled).map((id) => {
              const def = CUSTOM_PLACEMENTS[id]
              const draft = placements[id]
              const priced = pricing.itemized.find((p) => p.id === id)!
              return (
                <div key={id} className="space-y-3 border border-white/15 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-hud text-[11px] text-brand-bone">{def.breakdownLabel} size</p>
                    <span className="font-hud text-xs tracking-normal text-brand-accent">+{formatBdt(priced.priceBdt)}</span>
                  </div>

                  {/* Quick preset pills */}
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${def.label} print size presets`}>
                    {CUSTOM_SIZE_PRESETS.map((preset) => {
                      const allowed = isPresetAllowedForPlacement(preset, id)
                      const isSelected = draft.preset === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          disabled={!allowed}
                          aria-pressed={isSelected}
                          title={!allowed ? `Exceeds ${def.label} max size (${def.maxWidthIn}" × ${def.maxHeightIn}")` : `${preset.widthIn}" × ${preset.heightIn}"`}
                          onClick={() => selectPreset(id, preset.id)}
                          className={clsx(
                            "font-hud h-8 border px-2.5 text-[10px] tracking-normal transition-colors",
                            isSelected ? "border-brand-accent bg-brand-accent text-brand-graphite" : "border-white/20 text-brand-bone/80 hover:border-brand-bone",
                            !allowed && "cursor-not-allowed border-white/5 text-brand-bone/25 line-through hover:border-white/5"
                          )}
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      aria-pressed={draft.preset === "custom"}
                      onClick={() => selectPreset(id, "custom")}
                      className={clsx(
                        "font-hud h-8 border px-2.5 text-[10px] tracking-normal transition-colors",
                        draft.preset === "custom" ? "border-brand-accent bg-brand-accent text-brand-graphite" : "border-white/20 text-brand-bone/80 hover:border-brand-bone"
                      )}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Numeric width and height inputs */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="block">
                      <span className="font-hud block text-[9px] text-brand-bone/55">
                        Width (in · max {def.maxWidthIn}&quot;)
                      </span>
                      <input
                        type="number"
                        min={CUSTOM_HOODIE_CONFIG.minDimensionIn}
                        max={def.maxWidthIn}
                        step={CUSTOM_HOODIE_CONFIG.dimensionStepIn}
                        value={draft.widthIn}
                        onChange={(e) => updateDimension(id, "widthIn", e.target.value)}
                        className="mt-1 h-10 w-full border border-white/20 bg-brand-graphite-dark px-3 text-sm text-brand-bone outline-none focus:border-brand-accent"
                      />
                    </label>
                    <label className="block">
                      <span className="font-hud block text-[9px] text-brand-bone/55">
                        Height (in · max {def.maxHeightIn}&quot;)
                      </span>
                      <input
                        type="number"
                        min={CUSTOM_HOODIE_CONFIG.minDimensionIn}
                        max={def.maxHeightIn}
                        step={CUSTOM_HOODIE_CONFIG.dimensionStepIn}
                        value={draft.heightIn}
                        onChange={(e) => updateDimension(id, "heightIn", e.target.value)}
                        className="mt-1 h-10 w-full border border-white/20 bg-brand-graphite-dark px-3 text-sm text-brand-bone outline-none focus:border-brand-accent"
                      />
                    </label>
                  </div>
                </div>
              )
            })}
          </fieldset>

          {/* Optional artwork link, note, or local file name helper */}
          <div data-pdp className="mt-6 space-y-2 border border-white/10 p-4">
            <label className="block">
              <span className="font-hud block text-[10px] text-brand-bone/60">Artwork link or print note (optional)</span>
              <input
                type="text"
                maxLength={240}
                value={artworkNote}
                onChange={(e) => setArtworkNote(e.target.value)}
                placeholder="Paste Drive/Figma link or placement instructions"
                className="mt-2 h-11 w-full border border-white/15 bg-brand-graphite-dark px-3 text-sm text-brand-bone placeholder:text-brand-bone/30 outline-none focus:border-brand-accent"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-brand-bone/55">
              <label className="inline-flex cursor-pointer items-center gap-2 font-hud text-[10px] text-brand-accent underline underline-offset-4 hover:text-brand-bone">
                <span>{attachedFilename ? `Selected: ${attachedFilename}` : "Select artwork file"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.svg,.ai,.eps"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setAttachedFilename(file ? file.name : null)
                  }}
                />
              </label>
              <span>Attach the file when chatting on WhatsApp.</span>
            </div>
          </div>

          {/* Live Price Breakdown Card */}
          <div data-pdp aria-live="polite" className="mt-6 border border-brand-accent/40 bg-brand-graphite-dark p-4">
            <p className="font-hud text-[10px] text-brand-accent">Price breakdown</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4 text-brand-bone/80">
                <dt>Base {garment.shortTitle}</dt>
                <dd className="font-hud tracking-normal">{formatBdt(pricing.basePriceBdt)}</dd>
              </div>
              {pricing.itemized.map((p) => (
                <div key={p.id} className="flex justify-between gap-4 text-brand-bone/80">
                  <dt>
                    {p.breakdownLabel} ({formatDimension(p.widthIn)}&quot; × {formatDimension(p.heightIn)}&quot;)
                  </dt>
                  <dd className="font-hud tracking-normal text-brand-accent">+{formatBdt(p.priceBdt)}</dd>
                </div>
              ))}
              {pricing.itemized.length === 0 && (
                <div className="flex justify-between gap-4 text-xs text-brand-bone/50">
                  <dt>No print placements selected</dt>
                  <dd className="font-hud tracking-normal">+৳0</dd>
                </div>
              )}
              {quantity > 1 && (
                <div className="flex justify-between gap-4 border-t border-white/10 pt-2 text-xs text-brand-bone/60">
                  <dt>Unit price × {quantity}</dt>
                  <dd className="font-hud tracking-normal">
                    {formatBdt(pricing.unitPriceBdt)} × {quantity}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
                <dt className="font-bold">Total</dt>
                <dd className="display text-3xl tracking-normal text-brand-bone">{formatBdt(totalPrice)}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div data-pdp ref={actionsRef} className="mt-6 space-y-3">
            {canOrder ? (
              <>
                <div className="flex items-center gap-4">
                  <QuantityStepper value={quantity} onChange={setQuantity} label={garment.customProductName} tone="dark" />
                  <span className="font-hud text-[11px] text-brand-bone/70">Total {formatBdt(totalPrice)}</span>
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

            <p className="pt-2 text-xs text-brand-bone/55">
              {isTee
                ? `Want a ready-to-wear drop-shoulder tee from ${formatBdt(garment.standardPriceBdt)}?`
                : `Want an unprinted hoodie for ${formatBdt(garment.standardPriceBdt)}?`}{" "}
              <Link
                href={isTee ? garment.galleryCategoryHref : `/products/${garment.baseProductSlug}/`}
                className="text-brand-accent underline underline-offset-4 hover:text-brand-bone"
              >
                {garment.standardLabel}
              </Link>
            </p>
          </div>

          {/* Product Details Accordions matching Premium Drop Shoulder Hoodie - Solid */}
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
                Cash on delivery. Custom DTF orders confirm final placement via WhatsApp before printing.{" "}
                <Link href="/custom-design/" className="text-brand-accent underline underline-offset-4">
                  See custom gallery
                </Link>
                .
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Live Sticky Bottom Bar */}
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
            <p className="truncate text-sm font-semibold">{garment.customProductName}</p>
            <p className="font-hud text-[11px] tracking-normal text-brand-accent">
              {formatBdt(totalPrice)}
              {size ? ` / ${size}` : ""}
              {pricing.itemized.length > 0 ? ` · ${pricing.itemized.length} print${pricing.itemized.length === 1 ? "" : "s"}` : ""}
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

export function CustomHoodieView({ product, settings }: { product: CatalogueProduct; settings: SiteSettings }) {
  return <CustomDtfView product={product} settings={settings} />
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
