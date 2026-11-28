"use client"

import { useCallback, useEffect, useState } from "react"
import { clsx } from "clsx"
import type { CatalogueImage } from "@dtc/catalogue-core"
import { PauseMark, WhatsAppIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"
import { MissingWhatsappFallback, WhatsAppChatLink } from "./whatsapp-chat-link"

export interface HeroSlide {
  id: string
  title: string
  garmentType: string
  isCustomPiece: boolean
  image: CatalogueImage
  backdropColor: string
}

/**
 * Interactive top lookbook slider with smooth adaptive background transition.
 * Renders slide 0 cleanly in SSR HTML without JS and switches pieces manually.
 */
export function CustomHeroSlider({
  slides,
  generalWaHref,
  messengerHref,
  hasContactPage,
}: {
  slides: HeroSlide[]
  generalWaHref: string | null
  messengerHref: string | null
  hasContactPage: boolean
}) {
  const [active, setActive] = useState(0)
  const total = slides.length
  const current = slides[active] ?? slides[0] ?? null
  const bgColor = current?.backdropColor ?? "#20241F"

  const step = useCallback(
    (delta: number) => {
      if (total <= 1) return
      setActive((prev) => (prev + delta + total) % total)
    },
    [total]
  )

  useEffect(() => {
    if (total <= 1) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1)
      else if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step, total])

  return (
    <section
      aria-labelledby="custom-hero-title"
      style={{ backgroundColor: bgColor }}
      className="relative overflow-hidden text-brand-bone pb-10 pt-[108px] transition-colors duration-700 ease-out-expo motion-reduce:transition-none md:pb-16 md:pt-28 lg:pt-32"
    >
      {/* Atmospheric subtle vignette around the canvas without tinting the garment photo itself */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_45%,rgba(255,255,255,0.05),transparent_62%)]"
      />

      <div className="relative z-10 mx-auto max-w-editorial px-5 md:px-10">
        <div className="grid gap-4 md:gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-12">
          {/* Lead garment exhibition stage (approx 60% desktop width) */}
          <div className="flex flex-col">
            <div className="relative flex h-[230px] w-full items-center justify-center sm:h-[310px] lg:h-[min(64svh,560px)]">
              {total > 0 ? (
                slides.map((slide, index) => {
                  const isActive = index === active
                  return (
                    <div
                      key={slide.id}
                      aria-hidden={!isActive}
                      className={clsx(
                        "flex h-full w-full items-center justify-center transition-[opacity,transform] duration-500 ease-out-expo motion-reduce:transition-none",
                        isActive ? "relative z-10 scale-100 opacity-100" : "pointer-events-none absolute inset-0 z-0 scale-[0.985] opacity-0"
                      )}
                    >
                      <Picture
                        image={slide.image}
                        priority={index === 0}
                        sizes="(min-width: 1024px) 52vw, 88vw"
                        className="max-h-full w-auto max-w-full object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/15"
                      />
                    </div>
                  )
                })
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-white/10 bg-black/25 p-6 text-center">
                  <PauseMark size={36} className="text-brand-accent" />
                  <p className="font-hud text-[11px] text-brand-bone/75">Custom garment showcase</p>
                  <p className="max-w-xs text-xs text-brand-bone/55">Real completed custom photos will appear here once published in the admin.</p>
                </div>
              )}
            </div>

            {/* Active slide caption + manual gallery slider controls */}
            {current && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-hud text-[10px] text-brand-bone/85">
                    {total > 1 && <span className="mr-2 text-brand-accent">{String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>}
                    {current.title}
                  </p>
                  {current.garmentType && (
                    <p className="font-hud text-[9px] text-brand-bone/50">{current.garmentType}</p>
                  )}
                </div>

                {total > 1 && (
                  <div className="flex items-center gap-1.5" role="group" aria-label="Custom work hero slides">
                    <div className="mr-1 hidden items-center gap-1 sm:flex">
                      {slides.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setActive(idx)}
                          aria-label={`Show ${slide.title}`}
                          aria-pressed={idx === active}
                          className={clsx(
                            "h-1.5 transition-all duration-300 motion-reduce:transition-none",
                            idx === active ? "w-6 bg-brand-accent" : "w-2.5 bg-white/25 hover:bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Previous custom piece"
                      className="flex h-8 w-8 items-center justify-center border border-white/20 text-xs text-brand-bone transition-colors hover:border-brand-accent hover:text-brand-accent"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Next custom piece"
                      className="flex h-8 w-8 items-center justify-center border border-white/20 text-xs text-brand-bone transition-colors hover:border-brand-accent hover:text-brand-accent"
                    >
                      &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact editorial text & WhatsApp action (approx 40% desktop width) */}
          <div>
            <p className="font-hud text-[10px] text-brand-accent">Pre-order custom work</p>
            <h1 id="custom-hero-title" className="display mt-2 text-4xl sm:text-5xl lg:text-7xl">
              Custom designs
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-bone/80 md:mt-4 md:text-base">
              See what we’ve made, then send us the design you want to wear.
            </p>

            <div className="mt-3 border-l-2 border-brand-accent pl-3 md:mt-5">
              <p className="text-xs leading-relaxed text-brand-bone/90 sm:text-sm">
                Custom orders are pre-order only. A 20% advance on the base product price is required to confirm your pre-order.
              </p>
              <p className="font-hud mt-1 text-[10px] tracking-normal text-brand-bone/60">
                Example calculation: A ৳900 base product requires a ৳180 advance.
              </p>
            </div>

            <div className="mt-4 md:mt-6">
              {generalWaHref ? (
                <>
                  <WhatsAppChatLink href={generalWaHref} className="btn-signal h-12 w-full px-6 text-xs sm:h-14 sm:w-auto sm:text-sm">
                    <WhatsAppIcon size={18} /> Share your design on WhatsApp
                  </WhatsAppChatLink>
                  <p className="mt-2 text-xs text-brand-bone/65">Open the chat and attach your design or reference image there.</p>
                </>
              ) : (
                <MissingWhatsappFallback messengerHref={messengerHref} hasContactPage={hasContactPage} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
