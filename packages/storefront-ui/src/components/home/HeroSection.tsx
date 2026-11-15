"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import clsx from "clsx"
import {
  CampaignSlideView,
  DEFAULT_CAMPAIGN_SLIDES,
  ProductView,
  StoreRoutes,
} from "@dtc/commerce-contracts"
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface HeroSectionProps {
  routes?: Partial<StoreRoutes>
  catalogHref?: string
  aboutHref?: string
  featuredProduct?: ProductView
  slides?: CampaignSlideView[]
  autoplay?: boolean
  autoplayIntervalMs?: number
  secondaryCtaSlot?: React.ReactNode
  linkComponent?: LinkComponent
}

export function HeroSection({
  routes,
  catalogHref,
  aboutHref,
  featuredProduct,
  slides,
  autoplay = false,
  autoplayIntervalMs = 6000,
  secondaryCtaSlot,
  linkComponent: LinkComp = Link,
}: HeroSectionProps) {
  const defaultCatalogHref = catalogHref || (routes?.catalog ? routes.catalog() : "/store")
  const defaultAboutHref = aboutHref || (routes?.about ? routes.about() : "/about")

  // Derive effective slides list
  const effectiveSlides: CampaignSlideView[] = React.useMemo(() => {
    if (slides && slides.length > 0) {
      return slides
    }
    if (featuredProduct) {
      return [
        {
          id: `product-hero-${featuredProduct.id}`,
          title: "OFFLINE BY CHOICE.",
          subtitle: "PAUSE THE GAME. KEEP YOUR STYLE.",
          eyebrow: "DROP 01 // OVERSIZED DROP SHOULDER TEES",
          description:
            featuredProduct.description ||
            "Away From Keyboard. Engineered for Dhaka street culture with relaxed dropped shoulders, wide boxy cuts, and dense pre-shrunk cotton. Same energy. Different reality.",
          desktopImageUrl:
            featuredProduct.thumbnail?.url ||
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=85",
          primaryCtaLabel: "SHOP THE DROP",
          primaryCtaUrl: defaultCatalogHref,
          secondaryCtaLabel: "ABOUT THE THEORY",
          secondaryCtaUrl: defaultAboutHref,
          textAlignment: "left",
          focalPosition: "center",
          overlayStrength: "medium",
          displayOrder: 0,
        },
      ]
    }
    return DEFAULT_CAMPAIGN_SLIDES
  }, [slides, featuredProduct, defaultCatalogHref, defaultAboutHref])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const isMultiSlide = effectiveSlides.length > 1
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0) {
        setCurrentIndex(effectiveSlides.length - 1)
      } else if (index >= effectiveSlides.length) {
        setCurrentIndex(0)
      } else {
        setCurrentIndex(index)
      }
    },
    [effectiveSlides.length]
  )

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1)
  }, [currentIndex, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1)
  }, [currentIndex, goToSlide])

  // Optional desktop autoplay (strictly off on mobile or when user paused)
  useEffect(() => {
    if (!autoplay || !isMultiSlide || isPaused) return

    timerRef.current = setTimeout(() => {
      nextSlide()
    }, autoplayIntervalMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [autoplay, isMultiSlide, isPaused, currentIndex, autoplayIntervalMs, nextSlide])

  // Touch & Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setIsPaused(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX

    if (diff > 45) {
      nextSlide()
    } else if (diff < -45) {
      prevSlide()
    }
    setTouchStartX(null)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prevSlide()
    } else if (e.key === "ArrowRight") {
      nextSlide()
    }
  }

  const activeSlide = effectiveSlides[currentIndex] || effectiveSlides[0]

  // Resolve overlay scrim styling
  const overlayClass = React.useMemo(() => {
    switch (activeSlide.overlayStrength) {
      case "none":
        return "bg-transparent"
      case "subtle":
        return "bg-gradient-to-t from-[#161815]/50 via-transparent to-black/10"
      case "strong":
        return "bg-gradient-to-t from-[#161815]/95 via-[#20241F]/80 to-[#161815]/40"
      case "medium":
      default:
        return "bg-gradient-to-t from-[#161815]/95 via-[#20241F]/65 to-transparent"
    }
  }, [activeSlide.overlayStrength])

  return (
    <section
      className="relative bg-brand-secondary pt-3 pb-8 sm:pt-6 sm:pb-14 lg:pb-16"
      aria-roledescription="carousel"
      aria-label="AFK THEORY Featured Campaigns"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="editorial-container">
        {/* Large Photographic Campaign Canvas */}
        <div
          className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden border border-brand-border bg-brand-primary shadow-editorial flex flex-col justify-end p-6 sm:p-12 lg:p-16 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background Images */}
          {effectiveSlides.map((slide, idx) => {
            const isVisible = idx === currentIndex
            return (
              <div
                key={slide.id || idx}
                aria-hidden={!isVisible}
                className={clsx(
                  "absolute inset-0 transition-opacity duration-500 ease-out",
                  isVisible ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
                )}
              >
                <picture>
                  {slide.mobileImageUrl && (
                    <source
                      media="(max-width: 768px)"
                      srcSet={slide.mobileImageUrl}
                    />
                  )}
                  <Image
                    src={slide.desktopImageUrl}
                    alt={slide.title || "AFK THEORY Campaign"}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 1024px) 100vw, 1600px"
                    className="object-cover object-center scale-100 transition-transform duration-1000"
                  />
                </picture>
              </div>
            )
          })}

          {/* Editorial Matte Graphite Gradient Scrim */}
          <div className={clsx("absolute inset-0 z-[1] pointer-events-none", overlayClass)} />

          {/* Narrative Content */}
          <div
            className={clsx(
              "relative z-10 max-w-2xl space-y-3.5 sm:space-y-5 text-white transition-all duration-300",
              activeSlide.textAlignment === "center" && "text-center mx-auto",
              activeSlide.textAlignment === "right" && "text-right ml-auto",
              (!activeSlide.textAlignment || activeSlide.textAlignment === "left") && "text-left"
            )}
          >
            {activeSlide.eyebrow && (
              <div className="inline-flex items-center gap-2">
                <span className="px-3 py-1 bg-brand-accent text-brand-primary text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-widest shadow-xs">
                  {activeSlide.eyebrow}
                </span>
              </div>
            )}

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-7xl tracking-tighter leading-[0.98] text-white uppercase drop-shadow-sm">
              {activeSlide.title}
              {activeSlide.subtitle && (
                <span className="text-brand-accent font-light tracking-tight text-2xl sm:text-4xl lg:text-5xl block mt-1.5 sm:mt-2">
                  {activeSlide.subtitle}
                </span>
              )}
            </h1>

            {activeSlide.description && (
              <p
                className={clsx(
                  "text-xs sm:text-sm text-brand-bone/90 leading-relaxed font-sans max-w-lg",
                  activeSlide.textAlignment === "center" && "mx-auto",
                  activeSlide.textAlignment === "right" && "ml-auto"
                )}
              >
                {activeSlide.description}
              </p>
            )}

            {/* CTAs */}
            <div
              className={clsx(
                "flex flex-wrap items-center gap-3 sm:gap-4 pt-2",
                activeSlide.textAlignment === "center" && "justify-center",
                activeSlide.textAlignment === "right" && "justify-end"
              )}
            >
              {activeSlide.primaryCtaLabel && (
                <LinkComp
                  href={activeSlide.primaryCtaUrl || defaultCatalogHref}
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-brand-accent hover:bg-brand-accent-hover text-brand-primary text-xs font-heading font-extrabold uppercase tracking-widest transition-all duration-200 shadow-sm group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>{activeSlide.primaryCtaLabel}</span>
                  <span className="w-6 h-6 rounded-xs bg-brand-primary text-brand-accent flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </span>
                </LinkComp>
              )}

              {secondaryCtaSlot || (
                activeSlide.secondaryCtaLabel ? (
                  <LinkComp
                    href={activeSlide.secondaryCtaUrl || defaultAboutHref}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-heading font-bold uppercase tracking-widest text-white border border-white/40 hover:border-brand-accent hover:text-brand-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  >
                    <span>{activeSlide.secondaryCtaLabel}</span>
                    <span aria-hidden="true">→</span>
                  </LinkComp>
                ) : null
              )}
            </div>
          </div>

          {/* Slider Next / Prev Controls (Shown only when > 1 slide exists) */}
          {isMultiSlide && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-brand-primary/90 text-white hover:text-brand-accent border border-white/20 flex items-center justify-center transition-all duration-200 backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent cursor-pointer"
                aria-label="Previous campaign slide"
              >
                <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-brand-primary/90 text-white hover:text-brand-accent border border-white/20 flex items-center justify-center transition-all duration-200 backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent cursor-pointer"
                aria-label="Next campaign slide"
              >
                <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Accessible Slide Indicator Dots */}
              <div
                className="absolute bottom-4 sm:bottom-6 right-6 sm:right-12 z-20 flex items-center gap-2"
                role="tablist"
                aria-label="Campaign Slide Indicators"
              >
                {effectiveSlides.map((slide, idx) => {
                  const isActive = idx === currentIndex
                  return (
                    <button
                      key={slide.id || idx}
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={() => goToSlide(idx)}
                      className={clsx(
                        "transition-all duration-300 rounded-full h-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
                        isActive
                          ? "w-8 bg-brand-accent shadow-xs"
                          : "w-2 bg-white/40 hover:bg-white/80"
                      )}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
