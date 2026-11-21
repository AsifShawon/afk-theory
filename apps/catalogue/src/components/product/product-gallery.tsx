"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clsx } from "clsx"
import type { CatalogueColor, CatalogueImage } from "@dtc/catalogue-core"
import { useLenis } from "@/components/motion/smooth-scroll"
import { CloseIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"
import { buildGallery, firstSlideFor } from "@/lib/gallery"
import { productTransitionName } from "./product-card"

/** A request to show a color's photos, sent when a swatch is tapped. */
export interface GalleryJump {
  colorId: string
  /** Changes on every tap so the same color can be requested twice. */
  nonce: number
  /** Scroll without animation (first load from a shared link). */
  instant?: boolean
}

const DESKTOP = "(min-width: 768px)"

/**
 * Every photo of the product in one sequence, grouped by color.
 *
 * Phones: a swipe strip. The color swatches sit on the photo, and swiping
 * into another color's photos selects that color. Desktop: a column of
 * photos beside the sticky panel, with the same scroll-to-select behavior.
 */
export function ProductGallery({
  images,
  colors,
  selectedColorId,
  jump,
  onSpyColor,
  onPickColor,
  slug,
  name,
}: {
  images: CatalogueImage[]
  colors: CatalogueColor[]
  selectedColorId: string | null
  jump: GalleryJump | null
  /** The photo in view belongs to another color. */
  onSpyColor: (colorId: string) => void
  /** A swatch on the photo was tapped. */
  onPickColor: (colorId: string) => void
  slug: string
  name: string
}) {
  const { slides, groups } = useMemo(() => buildGallery(images, colors.map((c) => c.id)), [images, colors])
  const colorById = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors])
  const lenis = useLenis()

  const scroller = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState<number | null>(null)
  // While a tap-triggered scroll runs, ignore the photos it passes on the way.
  const guard = useRef<{ target: number; until: number } | null>(null)
  // Nothing in view changes the selection until the visitor scrolls, so a
  // color chosen from a shared link is not overridden by the first photo.
  const interacted = useRef(false)

  const onSpyRef = useRef(onSpyColor)
  onSpyRef.current = onSpyColor
  const selectedRef = useRef(selectedColorId)
  selectedRef.current = selectedColorId

  const showSlide = useCallback(
    (index: number, instant: boolean) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const smooth = !instant && !reduce
      guard.current = { target: index, until: Date.now() + (smooth ? 1200 : 300) }
      if (window.matchMedia(DESKTOP).matches) {
        const el = slideRefs.current[index]
        if (!el) return
        if (lenis) lenis.scrollTo(el, { offset: -96, immediate: !smooth })
        else el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" })
      } else {
        const strip = scroller.current
        if (strip) strip.scrollTo({ left: index * strip.clientWidth, behavior: smooth ? "smooth" : "auto" })
      }
    },
    [lenis]
  )

  // Swatch taps (here or in the info panel) jump to that color's first photo.
  useEffect(() => {
    if (!jump) return
    const index = firstSlideFor(slides, jump.colorId)
    if (index === -1) return
    // On desktop, a shared link should not scroll the page on load.
    if (jump.instant && window.matchMedia(DESKTOP).matches) return
    showSlide(index, Boolean(jump.instant))
  }, [jump, slides, showSlide])

  // Scroll-spy: which photo is in view, and does it belong to another color?
  useEffect(() => {
    let observer: IntersectionObserver | null = null
    const media = window.matchMedia(DESKTOP)

    const visible = new Map<number, number>()
    const pick = () => {
      let best = -1
      let bestRatio = 0
      visible.forEach((ratio, index) => {
        if (ratio > bestRatio) {
          best = index
          bestRatio = ratio
        }
      })
      if (best === -1) return
      setActive(best)

      const g = guard.current
      if (g) {
        if (best === g.target || Date.now() > g.until) guard.current = null
        else return
      }
      if (!interacted.current) return
      const colorId = slides[best]?.colorId
      if (colorId && colorId !== selectedRef.current) onSpyRef.current(colorId)
    }

    const start = () => {
      observer?.disconnect()
      visible.clear()
      const desktop = media.matches
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.slide)
            if (entry.isIntersecting) visible.set(index, entry.intersectionRatio)
            else visible.delete(index)
          }
          pick()
        },
        desktop
          ? { root: null, rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
          : { root: scroller.current, threshold: [0.55, 0.8, 1] }
      )
      slideRefs.current.forEach((el) => el && observer?.observe(el))
    }

    start()
    media.addEventListener("change", start)
    return () => {
      media.removeEventListener("change", start)
      observer?.disconnect()
    }
  }, [slides])

  // Any real scroll by the visitor turns the scroll-spy on.
  useEffect(() => {
    const mark = () => {
      if (!guard.current) interacted.current = true
    }
    const strip = scroller.current
    strip?.addEventListener("touchstart", mark, { passive: true })
    strip?.addEventListener("pointerdown", mark, { passive: true })
    window.addEventListener("wheel", mark, { passive: true })
    window.addEventListener("touchmove", mark, { passive: true })
    window.addEventListener("keydown", mark)
    return () => {
      strip?.removeEventListener("touchstart", mark)
      strip?.removeEventListener("pointerdown", mark)
      window.removeEventListener("wheel", mark)
      window.removeEventListener("touchmove", mark)
      window.removeEventListener("keydown", mark)
    }
  }, [])

  const selected = selectedColorId ? colorById.get(selectedColorId) : undefined
  const selectedHasPhotos = selectedColorId ? slides.some((s) => s.colorId === selectedColorId) : true
  const showDock = colors.length > 1

  return (
    <div>
      <div className="relative">
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:grid md:snap-none md:gap-4 md:overflow-visible"
          aria-label={`${name} photos`}
          data-gallery-strip
        >
          {slides.map((slide, i) => {
            const isGroupStart = groups.some((g) => g.start === i && g.colorId)
            const groupColor = slide.colorId ? colorById.get(slide.colorId) : undefined
            return (
              <button
                key={slide.image.id}
                ref={(el) => {
                  slideRefs.current[i] = el
                }}
                type="button"
                data-slide={i}
                data-color={slide.colorId ?? ""}
                onClick={() => setZoomed(i)}
                className="relative aspect-[4/5] w-full shrink-0 snap-center snap-always overflow-hidden bg-brand-stone md:cursor-zoom-in"
                aria-label={`View photo ${i + 1} of ${slides.length}${groupColor ? `, ${groupColor.name}` : ""}, full screen`}
              >
                <Picture
                  image={slide.image}
                  sizes="(min-width: 768px) 55vw, 100vw"
                  priority={i === 0}
                  className="h-full w-full object-cover"
                  style={i === 0 ? { viewTransitionName: productTransitionName(slug) } : undefined}
                />
                {isGroupStart && groupColor && colors.length > 1 && (
                  <span className="font-hud absolute left-4 top-4 hidden items-center gap-2 bg-brand-graphite/85 px-2.5 py-1.5 text-[10px] text-brand-bone backdrop-blur md:flex">
                    <span className="h-2.5 w-2.5 border border-white/30" style={{ backgroundColor: groupColor.hex }} aria-hidden />
                    {groupColor.name}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Phones: colors live on the photo, next to the photo count. */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 md:hidden">
          {showDock ? (
            <div className="pointer-events-auto flex min-w-0 flex-col items-start gap-1.5">
              <span className="font-hud bg-brand-graphite/80 px-2 py-1 text-[10px] text-brand-bone backdrop-blur" aria-live="polite">
                {selected ? selected.name : "Choose a color"}
                {selected && !selected.inStock && " · coming soon"}
                {selected && selected.inStock && !selectedHasPhotos && " · photos soon"}
              </span>
              <div role="group" aria-label="Color" className="flex gap-1 bg-brand-graphite/70 p-1 backdrop-blur">
                {colors.map((c) => {
                  const isSelected = c.id === selectedColorId
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onPickColor(c.id)}
                      aria-pressed={isSelected}
                      aria-label={`${c.name}${c.inStock ? "" : ", coming soon"}`}
                      className="relative flex h-11 w-11 items-center justify-center"
                    >
                      <span
                        className={clsx(
                          "block h-8 w-8 border-2 transition-[border-color,transform] duration-200",
                          isSelected ? "scale-105 border-brand-accent" : "border-white/25"
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                      {!c.inStock && <span aria-hidden className="absolute h-0.5 w-9 -rotate-45 bg-brand-bone/80" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <span />
          )}
          {slides.length > 1 && (
            <span className="font-hud shrink-0 bg-brand-graphite/80 px-2 py-1 text-[10px] tracking-normal text-brand-bone backdrop-blur">
              {active + 1} / {slides.length}
            </span>
          )}
        </div>
      </div>

      {/* Phones: progress in segments, one block per color. */}
      {slides.length > 1 && (
        <div className="mt-3 flex gap-2 px-5 md:hidden" aria-hidden>
          {groups.map((group) => (
            <div key={`${group.colorId}-${group.start}`} className="flex flex-1 gap-0.5" style={{ flexGrow: group.count }}>
              {Array.from({ length: group.count }, (_, k) => {
                const index = group.start + k
                return <span key={index} className={clsx("h-1 flex-1 transition-colors duration-300", index === active ? "bg-brand-accent" : "bg-white/20")} />
              })}
            </div>
          ))}
        </div>
      )}

      {zoomed !== null && <Lightbox images={slides.map((s) => s.image)} start={zoomed} onClose={() => setZoomed(null)} />}
    </div>
  )
}

function Lightbox({ images, start, onClose }: { images: CatalogueImage[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const lenis = useLenis()
  const closeRef = useRef<HTMLButtonElement>(null)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)
  const lastTap = useRef(0)

  const go = useCallback(
    (delta: number) => {
      setZoom(null)
      setIndex((i) => (i + delta + images.length) % images.length)
    },
    [images.length]
  )

  useEffect(() => {
    lenis?.stop()
    document.documentElement.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [lenis, onClose, go])

  // Swipe left or right to change photo; double-tap to zoom where you tapped.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const startPoint = touch.current
    touch.current = null
    if (!startPoint) return
    const t = e.changedTouches[0]
    const dx = t.clientX - startPoint.x
    const dy = t.clientY - startPoint.y
    if (!zoom && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1)
      return
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        toggleZoom(t.clientX, t.clientY, e.currentTarget as HTMLElement)
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }
  const toggleZoom = (clientX: number, clientY: number, el: HTMLElement) => {
    if (zoom) {
      setZoom(null)
      return
    }
    const rect = el.getBoundingClientRect()
    setZoom({ x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 })
  }

  const image = images[index]
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-graphite-dark/95">
      <div
        className="flex h-full w-full touch-pan-y items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onDoubleClick={(e) => toggleZoom(e.clientX, e.clientY, e.currentTarget)}
      >
        <Picture
          key={image.id}
          image={image}
          sizes="100vw"
          className="max-h-[92svh] w-auto max-w-[94vw] animate-fade-in object-contain transition-transform duration-300"
          style={zoom ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
      <button ref={closeRef} onClick={onClose} className="absolute right-4 top-4 bg-brand-graphite p-3 text-brand-bone hover:text-brand-accent" aria-label="Close photo viewer">
        <CloseIcon />
      </button>
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="font-hud absolute left-2 top-1/2 hidden -translate-y-1/2 bg-brand-graphite px-4 py-3 text-[11px] hover:text-brand-accent md:left-6 md:block" aria-label="Previous photo">
            Prev
          </button>
          <button onClick={() => go(1)} className="font-hud absolute right-2 top-1/2 hidden -translate-y-1/2 bg-brand-graphite px-4 py-3 text-[11px] hover:text-brand-accent md:right-6 md:block" aria-label="Next photo">
            Next
          </button>
          <p className="font-hud absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-brand-bone/60">
            {index + 1} / {images.length} · {zoom ? "double-tap to zoom out" : "swipe or double-tap to zoom"}
          </p>
        </>
      )}
    </div>
  )
}
