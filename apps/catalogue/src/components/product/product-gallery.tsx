"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import type { CatalogueImage } from "@dtc/catalogue-core"
import { useLenis } from "@/components/motion/smooth-scroll"
import { CloseIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"
import { productTransitionName } from "./product-card"

/**
 * Phones: a swipe carousel with position dots. Desktop: images stacked in a
 * column beside the sticky purchase panel. Any image opens full screen.
 */
export function ProductGallery({ images, slug, name }: { images: CatalogueImage[]; slug: string; name: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState<number | null>(null)

  useEffect(() => {
    setActive(0)
    scroller.current?.scrollTo({ left: 0 })
  }, [images])

  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:grid md:snap-none md:gap-4 md:overflow-visible"
        aria-label={`${name} photos`}
      >
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setZoomed(i)}
            className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-brand-stone md:cursor-zoom-in"
            aria-label={`View photo ${i + 1} of ${images.length} full screen`}
          >
            <Picture
              image={image}
              sizes="(min-width: 768px) 55vw, 100vw"
              priority={i === 0}
              className="h-full w-full object-cover"
              style={i === 0 ? { viewTransitionName: productTransitionName(slug) } : undefined}
            />
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 md:hidden" aria-hidden>
          {images.map((image, i) => (
            <span key={image.id} className={clsx("h-1 transition-all duration-300", i === active ? "w-8 bg-brand-accent" : "w-3 bg-white/25")} />
          ))}
        </div>
      )}
      {zoomed !== null && <Lightbox images={images} start={zoomed} onClose={() => setZoomed(null)} />}
    </div>
  )
}

function Lightbox({ images, start, onClose }: { images: CatalogueImage[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  const lenis = useLenis()
  const closeRef = useRef<HTMLButtonElement>(null)
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + images.length) % images.length), [images.length])

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

  const image = images[index]
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-graphite-dark/95">
      <Picture key={image.id} image={image} sizes="100vw" className="max-h-[92svh] w-auto max-w-[94vw] animate-fade-in object-contain" />
      <button ref={closeRef} onClick={onClose} className="absolute right-4 top-4 bg-brand-graphite p-3 text-brand-bone hover:text-brand-accent" aria-label="Close photo viewer">
        <CloseIcon />
      </button>
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="font-hud absolute left-2 top-1/2 -translate-y-1/2 bg-brand-graphite px-4 py-3 text-[11px] hover:text-brand-accent md:left-6" aria-label="Previous photo">
            Prev
          </button>
          <button onClick={() => go(1)} className="font-hud absolute right-2 top-1/2 -translate-y-1/2 bg-brand-graphite px-4 py-3 text-[11px] hover:text-brand-accent md:right-6" aria-label="Next photo">
            Next
          </button>
          <p className="font-hud absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-brand-bone/60">
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>
  )
}
