"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import clsx from "clsx"
import { ImageView } from "@dtc/commerce-contracts"
import { ChevronLeftIcon, ChevronRightIcon } from "../icons"
import {
  AUTOPLAY_INTERVAL_MS,
  nextIndex,
  shouldAutoAdvance,
} from "./carousel-autoplay"

export interface ImageGalleryProps {
  images: ImageView[]
  title?: string
}

/**
 * Product gallery.
 *
 * - Native horizontal scroll with scroll-snap: swipe, trackpad and wheel work
 *   without custom gesture code, and slide changes are smooth.
 * - Rotates every 3 seconds, but only while it is on screen, the tab is visible,
 *   and the customer is not hovering, focused, or recently interacting.
 *   Reduced-motion preferences turn rotation off. A pause button is provided.
 * - Only horizontal scrolling of the gallery itself is ever triggered, so the
 *   rotation never moves the page.
 */
export function ImageGallery({ images, title = "Garment" }: ImageGalleryProps) {
  const count = images?.length ?? 0

  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState(0)
  const [isUserPaused, setIsUserPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const activeRef = useRef(0)
  const isHoveredRef = useRef(false)
  const hasFocusRef = useRef(false)
  const isInViewRef = useRef(true)
  const lastInteractionRef = useRef<number | null>(null)

  const wrapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Going from the last image back to the first: fade out, jump, fade in, instead of
  // sweeping backwards through every slide.
  const wrapToStart = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    track.style.transition = "opacity 180ms ease"
    track.style.opacity = "0"
    wrapTimerRef.current = setTimeout(() => {
      track.scrollTo({ left: 0, behavior: "auto" })
      track.style.opacity = "1"
    }, 200)
  }, [])

  useEffect(() => {
    return () => {
      if (wrapTimerRef.current) clearTimeout(wrapTimerRef.current)
    }
  }, [])

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current
      if (!track || count === 0) return
      const target = Math.min(Math.max(index, 0), count - 1)
      track.scrollTo({
        left: target * track.clientWidth,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      })
    },
    [count, prefersReducedMotion]
  )

  // Reduced-motion preference
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(query.matches)
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  // Track whether the gallery is on screen
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting
      },
      { threshold: 0.25 }
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  // Keep the active index in sync with the scroll position (swipe, wheel, programmatic)
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const width = track.clientWidth
        if (width === 0) return
        const index = Math.round(track.scrollLeft / width)
        if (index !== activeRef.current) {
          activeRef.current = index
          setActive(index)
        }
      })
    }

    track.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      track.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [count])

  // Re-align the current slide when the layout width changes (rotation, resize)
  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      track.scrollTo({ left: activeRef.current * track.clientWidth, behavior: "auto" })
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  // Automatic rotation
  useEffect(() => {
    if (count < 2) return
    const timer = setInterval(() => {
      const allowed = shouldAutoAdvance({
        count,
        isHovered: isHoveredRef.current,
        hasFocus: hasFocusRef.current,
        isInView: isInViewRef.current,
        isTabVisible: !document.hidden,
        isUserPaused,
        prefersReducedMotion,
        lastInteractionAt: lastInteractionRef.current,
        now: Date.now(),
      })
      if (!allowed) return
      const next = nextIndex(activeRef.current, count)
      if (next === 0) wrapToStart()
      else goTo(next)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [count, goTo, wrapToStart, isUserPaused, prefersReducedMotion])

  // Keep the active thumbnail visible inside the thumbnail strip only (never scrolls the page)
  useEffect(() => {
    const strip = thumbsRef.current
    const thumb = strip?.children[active] as HTMLElement | undefined
    if (!strip || !thumb) return
    const scrollable =
      strip.scrollWidth > strip.clientWidth || strip.scrollHeight > strip.clientHeight
    if (!scrollable) return
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      top: thumb.offsetTop - (strip.clientHeight - thumb.clientHeight) / 2,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }, [active, prefersReducedMotion])

  if (!images || count === 0) {
    return (
      <div className="aspect-[3/4] w-full bg-brand-secondary border border-brand-border flex items-center justify-center text-brand-muted text-xs">
        No Image Available
      </div>
    )
  }

  const isPlaying = count > 1 && !isUserPaused && !prefersReducedMotion
  const handleManualNavigation = (index: number) => {
    markInteraction()
    goTo(index)
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnails */}
      {count > 1 && (
        <div
          ref={thumbsRef}
          className="relative flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[640px] no-scrollbar lg:w-20 flex-shrink-0"
        >
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => handleManualNavigation(idx)}
              className={clsx(
                "relative aspect-[3/4] w-16 lg:w-20 bg-brand-secondary border transition-all duration-200 flex-shrink-0 overflow-hidden",
                active === idx
                  ? "border-brand-primary ring-1 ring-brand-primary"
                  : "border-brand-border hover:border-brand-muted opacity-70 hover:opacity-100"
              )}
              aria-label={`Show image ${idx + 1} of ${count}`}
              aria-current={active === idx}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main carousel */}
      <div
        ref={rootRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} images`}
        className="relative flex-1 min-w-0 group bg-brand-secondary border border-brand-border overflow-hidden"
        onMouseEnter={() => {
          isHoveredRef.current = true
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false
        }}
        onFocus={() => {
          hasFocusRef.current = true
        }}
        onBlur={() => {
          hasFocusRef.current = false
        }}
      >
        <div
          ref={trackRef}
          className="flex w-full aspect-[3/4] overflow-x-auto snap-x snap-mandatory no-scrollbar overscroll-x-contain"
          aria-live={isPlaying ? "off" : "polite"}
          tabIndex={0}
          onPointerDown={markInteraction}
          onTouchStart={markInteraction}
          onWheel={markInteraction}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault()
              handleManualNavigation(activeRef.current - 1)
            } else if (event.key === "ArrowRight") {
              event.preventDefault()
              handleManualNavigation(activeRef.current + 1)
            }
          }}
        >
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${count}`}
              className="relative flex-shrink-0 basis-full w-full h-full snap-center"
            >
              <Image
                src={img.url}
                alt={img.altText || `${title} - image ${idx + 1}`}
                fill
                priority={idx === 0}
                loading={idx <= 1 ? "eager" : "lazy"}
                draggable={false}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center select-none"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            {/* Previous / next (desktop; touch devices swipe) */}
            <button
              type="button"
              onClick={() => handleManualNavigation(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
              className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/90 text-brand-primary border border-brand-border items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0 transition-opacity duration-200"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleManualNavigation(active + 1)}
              disabled={active === count - 1}
              aria-label="Next image"
              className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/90 text-brand-primary border border-brand-border items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0 transition-opacity duration-200"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => handleManualNavigation(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                  aria-current={active === idx}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-300",
                    active === idx ? "w-5 bg-accent" : "w-1.5 bg-white/60 hover:bg-white/90"
                  )}
                />
              ))}
            </div>

            {/* Pause / play (WCAG: moving content must be pausable) */}
            {!prefersReducedMotion && (
              <button
                type="button"
                onClick={() => setIsUserPaused((paused) => !paused)}
                aria-label={isUserPaused ? "Play image rotation" : "Pause image rotation"}
                aria-pressed={isUserPaused}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/90 text-brand-primary border border-brand-border flex items-center justify-center"
              >
                {isUserPaused ? (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M4 2.5v11l9-5.5-9-5.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M4 2h3v12H4zM9 2h3v12H9z" />
                  </svg>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
