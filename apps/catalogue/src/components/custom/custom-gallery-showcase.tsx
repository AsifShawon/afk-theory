"use client"

import { useCallback, useEffect, useState } from "react"
import { clsx } from "clsx"
import type { CatalogueCustomDesign, CatalogueImage } from "@dtc/catalogue-core"
import { CloseIcon, WhatsAppIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"
import { buildCustomDesignMessage, whatsappUrl } from "@/lib/order-message"
import { WhatsAppChatLink } from "./whatsapp-chat-link"

type GalleryView = "plates" | "index"

interface LightboxState {
  images: CatalogueImage[]
  index: number
  title: string
}

/**
 * Museum/lookbook editorial gallery showcase.
 * Renders full uncropped images at natural aspect ratios (studio + RAW print
 * side-by-side) with interactive Plates/Index view switch and fullscreen lightbox.
 */
export function CustomGalleryShowcase({
  designs,
  whatsappNumber,
}: {
  designs: CatalogueCustomDesign[]
  whatsappNumber: string
}) {
  const [view, setView] = useState<GalleryView>("plates")
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  const openLightbox = (item: CatalogueCustomDesign, index: number) => {
    const images = item.detailImage ? [item.image, item.detailImage] : [item.image]
    setLightbox({ images, index, title: item.title })
  }

  return (
    <section aria-labelledby="custom-gallery-title" className="bg-brand-bone py-16 text-brand-graphite md:py-24">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-hud text-[11px] text-brand-olive">
              Archive {designs.length > 0 ? `· ${String(designs.length).padStart(2, "0")} pieces` : ""}
            </p>
            <h2 id="custom-gallery-title" className="display mt-2 text-4xl sm:text-5xl md:text-7xl">
              Custom work we’ve made
            </h2>
            <p className="mt-3 text-sm text-brand-olive md:text-base">
              Real custom garments built on AFK THEORY blanks. Tap any photo to inspect full resolution or pick a piece as your WhatsApp reference.
            </p>
          </div>

          {designs.length > 1 && (
            <div role="group" aria-label="Gallery layout" className="inline-flex self-start border border-brand-graphite/20 p-1 md:self-auto">
              <button
                type="button"
                onClick={() => setView("plates")}
                aria-pressed={view === "plates"}
                className={clsx(
                  "font-hud px-3.5 py-2 text-[10px] transition-colors",
                  view === "plates" ? "bg-brand-graphite text-brand-bone" : "text-brand-olive hover:text-brand-graphite"
                )}
              >
                Editorial plates
              </button>
              <button
                type="button"
                onClick={() => setView("index")}
                aria-pressed={view === "index"}
                className={clsx(
                  "font-hud px-3.5 py-2 text-[10px] transition-colors",
                  view === "index" ? "bg-brand-graphite text-brand-bone" : "text-brand-olive hover:text-brand-graphite"
                )}
              >
                Contact sheet
              </button>
            </div>
          )}
        </div>

        {designs.length === 0 ? (
          <div className="mt-10 border border-brand-graphite/15 bg-brand-stone/40 p-6 md:p-10">
            <p className="font-hud text-[10px] text-brand-olive">Awaiting gallery photos</p>
            <p className="display mt-2 text-2xl md:text-4xl">Real custom piece photos are on the way</p>
            <p className="mt-3 max-w-xl text-sm text-brand-olive md:text-base">
              We only publish photos of real finished custom orders here. Already have your own graphic or reference ready? Send it directly on
              WhatsApp and our team will confirm sizing, placement, and price with you.
            </p>
          </div>
        ) : view === "plates" ? (
          <ol className="mt-12 space-y-16 md:space-y-24">
            {designs.map((item, idx) => {
              const refWaHref = whatsappUrl(whatsappNumber, buildCustomDesignMessage({ referenceTitle: item.title }))
              const hasDetail = Boolean(item.detailImage)
              const plateNumber = String(idx + 1).padStart(2, "0")

              return (
                <li
                  key={item.id}
                  className="grid gap-6 border-t border-brand-graphite/15 pt-10 md:pt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12"
                >
                  {/* Unboxed natural-aspect diptych / exhibition visual stage */}
                  <div className={clsx("grid gap-3 md:gap-4", hasDetail ? "grid-cols-[1.25fr_1fr] items-end" : "grid-cols-1 max-w-xl")}>
                    <button
                      type="button"
                      onClick={() => openLightbox(item, 0)}
                      aria-label={`Inspect ${item.title} full view`}
                      className="group relative block w-full overflow-hidden bg-brand-stone/50 text-left focus-visible:outline-offset-4"
                    >
                      <Picture
                        image={item.image}
                        sizes={hasDetail ? "(min-width: 1024px) 34vw, 52vw" : "(min-width: 1024px) 52vw, 92vw"}
                        className="block h-auto w-full transition-transform duration-700 ease-out-expo motion-reduce:transition-none group-hover:scale-[1.02]"
                      />
                      <span className="font-hud mt-2 flex items-center justify-between text-[10px] text-brand-olive">
                        <span>{plateNumber}.A — Full garment</span>
                        <span className="opacity-0 transition-opacity group-hover:opacity-100">Inspect +</span>
                      </span>
                    </button>

                    {item.detailImage && (
                      <button
                        type="button"
                        onClick={() => openLightbox(item, 1)}
                        aria-label={`Inspect ${item.title} back or print close-up`}
                        className="group relative block w-full overflow-hidden bg-brand-stone/50 text-left focus-visible:outline-offset-4"
                      >
                        <Picture
                          image={item.detailImage}
                          sizes="(min-width: 1024px) 24vw, 40vw"
                          className="block h-auto w-full transition-transform duration-700 ease-out-expo motion-reduce:transition-none group-hover:scale-[1.02]"
                        />
                        <span className="font-hud mt-2 flex items-center justify-between text-[10px] text-brand-olive">
                          <span>{plateNumber}.B — Raw print view</span>
                          <span className="opacity-0 transition-opacity group-hover:opacity-100">Zoom +</span>
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Clean editorial specification column */}
                  <div className="flex flex-col lg:sticky lg:top-28">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="display text-5xl leading-none text-brand-graphite/15 md:text-6xl" aria-hidden>
                        {plateNumber}
                      </span>
                      {item.garmentType && (
                        <span className="font-hud border border-brand-graphite/20 px-2.5 py-1 text-[10px] text-brand-graphite">
                          {item.garmentType}
                        </span>
                      )}
                    </div>

                    <h3 className="display mt-5 text-3xl leading-[0.95] md:text-4xl">{item.title}</h3>

                    <dl className="mt-6 grid gap-3 border-t border-brand-graphite/10 pt-5 text-sm">
                      {item.garmentType && (
                        <div className="flex justify-between gap-4">
                          <dt className="font-hud text-[10px] text-brand-olive">Blank silhouette</dt>
                          <dd className="text-right font-medium text-brand-graphite">{item.garmentType}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-4">
                        <dt className="font-hud text-[10px] text-brand-olive">Views included</dt>
                        <dd className="text-right font-medium text-brand-graphite">
                          {item.detailImage ? "Studio garment + raw print" : "Full garment view"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-hud text-[10px] text-brand-olive">Order type</dt>
                        <dd className="text-right font-medium text-brand-graphite">Pre-order · 20% base advance</dd>
                      </div>
                    </dl>

                    {refWaHref && (
                      <div className="mt-8">
                        <WhatsAppChatLink
                          href={refWaHref}
                          className="btn-outline h-12 w-full border-brand-graphite text-brand-graphite hover:bg-brand-graphite hover:text-brand-bone sm:w-auto sm:px-7"
                        >
                          <WhatsAppIcon size={17} /> Use this as a reference
                        </WhatsAppChatLink>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {designs.map((item, idx) => {
              const refWaHref = whatsappUrl(whatsappNumber, buildCustomDesignMessage({ referenceTitle: item.title }))
              return (
                <article key={item.id} className="flex flex-col border-t border-brand-graphite/15 pt-4">
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => openLightbox(item, 0)}
                      className="group overflow-hidden bg-brand-stone/50 text-left"
                    >
                      <Picture
                        image={item.image}
                        sizes="(min-width: 1024px) 22vw, 45vw"
                        className="block h-auto w-full transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03]"
                      />
                    </button>
                  </div>
                  <p className="font-hud mt-3 text-[10px] text-brand-olive">
                    {String(idx + 1).padStart(2, "0")} {item.garmentType ? `· ${item.garmentType}` : ""}
                  </p>
                  <h3 className="display mt-1 text-lg leading-tight">{item.title}</h3>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    {item.detailImage && (
                      <button
                        type="button"
                        onClick={() => openLightbox(item, 1)}
                        className="font-hud text-[10px] underline underline-offset-4 hover:text-brand-olive"
                      >
                        Raw print view
                      </button>
                    )}
                    {refWaHref && (
                      <WhatsAppChatLink href={refWaHref} className="font-hud text-[10px] font-bold text-brand-graphite underline underline-offset-4">
                        Use reference
                      </WhatsAppChatLink>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {lightbox && <GalleryLightbox lightbox={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  )
}

function GalleryLightbox({ lightbox, onClose }: { lightbox: LightboxState; onClose: () => void }) {
  const [index, setIndex] = useState(lightbox.index)
  const total = lightbox.images.length

  const go = useCallback(
    (delta: number) => {
      if (total <= 1) return
      setIndex((i) => (i + delta + total) % total)
    },
    [total]
  )

  useEffect(() => {
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.documentElement.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [go, onClose])

  const image = lightbox.images[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${lightbox.title} photo viewer`}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-brand-graphite-dark/95 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[86svh] max-w-[94vw] items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Picture
          key={image.id}
          image={image}
          priority
          sizes="94vw"
          className="max-h-[84svh] w-auto max-w-[92vw] object-contain shadow-2xl"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute right-4 top-4 bg-brand-graphite p-3 text-brand-bone transition-colors hover:text-brand-accent"
      >
        <CloseIcon />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 flex items-center gap-4 text-brand-bone"
      >
        {total > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="font-hud border border-white/20 px-3 py-1.5 text-[10px] hover:border-brand-accent hover:text-brand-accent"
          >
            Prev
          </button>
        )}
        <p className="font-hud text-[10px] text-brand-bone/80">
          {lightbox.title} {total > 1 ? `· ${index + 1} / ${total}` : ""}
        </p>
        {total > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            className="font-hud border border-white/20 px-3 py-1.5 text-[10px] hover:border-brand-accent hover:text-brand-accent"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
