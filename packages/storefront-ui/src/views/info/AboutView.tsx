import React from "react"
import Link from "next/link"
import Image from "next/image"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { LinkComponent } from "../../types"

export interface AboutViewProps {
  routes: StoreRoutes
  linkComponent?: LinkComponent
}

export function AboutView({ routes, linkComponent: LinkComp = Link }: AboutViewProps) {
  return (
    <div className="bg-white min-h-screen">
      {/* Header Banner */}
      <div className="bg-brand-primary border-b border-brand-border py-14 sm:py-20 text-white">
        <div className="content-container max-w-4xl text-center space-y-4">
          <span className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-accent">
            THE PHILOSOPHY // AWAY FROM KEYBOARD
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white">
            PAUSE THE GAME. KEEP YOUR STYLE.
          </h1>
          <p className="text-sm sm:text-base text-brand-secondary/80 max-w-2xl mx-auto leading-relaxed">
            Offline by choice. Independent streetwear engineered with high-density compact cotton, intentional boxy silhouettes, and distinct drop shoulder architecture.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container max-w-4xl py-16 sm:py-24 space-y-16">
        {/* Section 1: The Origin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-[11px] font-heading font-semibold uppercase tracking-widest text-brand-accent">
              01 / The Concept
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-brand-primary">
              Away From Keyboard. Into The Physical.
            </h2>
            <p className="text-xs sm:text-sm text-brand-primary/80 leading-relaxed">
              AFK THEORY began with a straightforward observation: we live in a hyper-connected reality where every hour is tethered to screens, consoles, and feeds. But our identity shouldn&apos;t pause when we step outside.
            </p>
            <p className="text-xs sm:text-sm text-brand-primary/80 leading-relaxed">
              We design apparel for the off-screen state—bold, minimal, confident, and unapologetic. Starting with engineered Drop Shoulder T-shirts, our garments are built to hold form, drape heavily, and outlast trends.
            </p>
          </div>
          <div className="relative aspect-[4/3] bg-brand-primary border border-brand-border overflow-hidden shadow-lg flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <span className="font-display text-6xl text-brand-accent tracking-tighter">// AFK</span>
              <p className="text-xs font-mono uppercase tracking-widest text-brand-secondary">SAME ENERGY. DIFFERENT REALITY.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Core Craftsmanship Pillars */}
        <div className="border-y border-brand-border py-12">
          <h3 className="font-display text-2xl text-center text-brand-primary mb-8">
            The Three Pillars of AFK THEORY
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2 p-4 bg-brand-secondary/40 border border-brand-border/60">
              <span className="font-display text-2xl text-brand-accent">I.</span>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-primary">
                Engineered Drop Shoulder Fits
              </h4>
              <p className="text-xs text-brand-primary/70 leading-relaxed">
                Intentional shoulder drape, roomier chest dimensions, and clean sleeve hems calibrated for effortless streetwear styling.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-brand-secondary/40 border border-brand-border/60">
              <span className="font-display text-2xl text-brand-accent">II.</span>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-primary">
                Dense Compact Cotton
              </h4>
              <p className="text-xs text-brand-primary/70 leading-relaxed">
                Substantial fabric weight that delivers structural integrity, zero cling, crisp drape, and longevity through every wash cycle.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-brand-secondary/40 border border-brand-border/60">
              <span className="font-display text-2xl text-brand-accent">III.</span>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-brand-primary">
                Nationwide Doorstep COD
              </h4>
              <p className="text-xs text-brand-primary/70 leading-relaxed">
                Direct fulfillment from Dhaka to all 64 districts in Bangladesh with 100% Cash on Delivery and hassle-free size exchanges.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Call to Action */}
        <div className="text-center space-y-6 pt-4">
          <h3 className="font-display text-3xl text-brand-primary">
            Step Offline. Keep Your Style.
          </h3>
          <p className="text-xs sm:text-sm text-brand-primary/70 max-w-lg mx-auto">
            Explore our Drop 01 oversized silhouettes and street staples.
          </p>
          <LinkComp
            href={routes.catalog()}
            className="inline-block px-8 py-3.5 bg-brand-accent text-brand-primary hover:bg-black hover:text-brand-accent text-xs font-heading font-semibold uppercase tracking-widest transition-colors shadow-md"
          >
            Shop The Drop →
          </LinkComp>
        </div>
      </div>
    </div>
  )
}
