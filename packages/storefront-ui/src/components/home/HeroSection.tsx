import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ProductView, StoreRoutes } from "@dtc/commerce-contracts"
import { ArrowRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface HeroSectionProps {
  routes: StoreRoutes
  featuredProduct?: ProductView
  secondaryCtaSlot?: React.ReactNode
  linkComponent?: LinkComponent
}

export function HeroSection({
  routes,
  featuredProduct,
  secondaryCtaSlot,
  linkComponent: LinkComp = Link,
}: HeroSectionProps) {
  const showcaseImage =
    featuredProduct?.thumbnail?.url ||
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=85"

  return (
    <section className="relative bg-brand-secondary pt-4 pb-10 sm:pt-6 sm:pb-16 lg:pb-20">
      <div className="editorial-container">
        {/* Large Photographic Campaign Canvas */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden border border-brand-border bg-brand-primary shadow-editorial flex flex-col justify-end p-6 sm:p-12 lg:p-16">
          <Image
            src={showcaseImage}
            alt="AFK THEORY Streetwear Editorial Campaign"
            fill
            priority
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="object-cover object-center scale-100 hover:scale-102 transition-transform duration-1000"
          />

          {/* Editorial Dark Graphite Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1B1B]/95 via-[#292828]/60 to-transparent pointer-events-none" />

          {/* Narrative Content */}
          <div className="relative z-10 max-w-2xl space-y-4 sm:space-y-6 text-white">
            <div className="inline-flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-accent text-brand-primary text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-widest">
                DROP 01 // OVERSIZED DROP SHOULDER TEES
              </span>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.98] text-white uppercase">
              OFFLINE BY CHOICE. <br />
              <span className="text-brand-accent font-light tracking-tight text-3xl sm:text-5xl lg:text-5xl block mt-2">
                PAUSE THE GAME. KEEP YOUR STYLE.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-brand-sand/90 max-w-lg leading-relaxed font-sans">
              Away From Keyboard. Engineered for Dhaka street culture with relaxed dropped shoulders, wide boxy cuts, and dense pre-shrunk cotton. Same energy. Different reality.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <LinkComp
                href={routes.catalog()}
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-brand-accent hover:bg-brand-accent-hover text-brand-primary text-xs font-heading font-extrabold uppercase tracking-widest transition-all duration-200 shadow-sm group cursor-pointer"
              >
                <span>SHOP THE DROP</span>
                <span className="w-6 h-6 rounded-xs bg-brand-primary text-brand-accent flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </LinkComp>

              {secondaryCtaSlot || (
                <LinkComp
                  href={routes.about()}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-heading font-bold uppercase tracking-widest text-white border border-white/30 hover:border-brand-accent hover:text-brand-accent transition-colors"
                >
                  <span>ABOUT THE THEORY</span>
                  <span aria-hidden="true">→</span>
                </LinkComp>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
