import React from "react"
import Link from "next/link"
import Image from "next/image"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ArrowRightIcon, CheckIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface CraftsmanshipSectionProps {
  routes: StoreRoutes
  linkComponent?: LinkComponent
}

export function CraftsmanshipSection({
  routes,
  linkComponent: LinkComp = Link,
}: CraftsmanshipSectionProps) {
  const technicalSpecs = [
    {
      metric: "240–280 GSM",
      label: "Heavyweight Dense Cotton",
      desc: "Substantial compact-spun cotton maintaining structured silhouette without cling.",
    },
    {
      metric: "Pre-Shrunk",
      label: "Bio-Washed Integrity",
      desc: "Pre-treated to retain dimensional stability and zero shrinkage after home wash.",
    },
    {
      metric: "Boxy Drape",
      label: "Dropped Shoulder Cut",
      desc: "Fallen seam geometry engineered for broad chest drape and relaxed arm mobility.",
    },
    {
      metric: "Silicone & HD",
      label: "Tactile Brand Badges",
      desc: "High-density screen prints and dimensional matte silicone pause marks.",
    },
  ]

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-brand-surface border-b border-brand-border/80">
      <div className="editorial-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Visual Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-brand-primary overflow-hidden border border-brand-border/80 shadow-sm group">
              <Image
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85"
                alt="AFK THEORY Drop Shoulder Textile & Fit Architecture"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

              {/* Floating Metric Callout */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-brand-primary/95 backdrop-blur-md p-4 sm:p-5 border border-white/10 flex items-center justify-between text-white">
                <div>
                  <span className="block font-heading font-extrabold text-xs text-brand-bone uppercase tracking-widest">
                    DROP 01 ARCHITECTURE
                  </span>
                  <span className="text-[11px] text-brand-muted">
                    240–280 GSM • Bio-Washed • Dropped Shoulder Silhouette
                  </span>
                </div>
                <span className="text-xs font-heading font-extrabold text-brand-primary bg-brand-accent px-3 py-1.5 uppercase tracking-wider">
                  OFFLINE BY CHOICE
                </span>
              </div>
            </div>
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-primary text-brand-accent text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-widest">
                GARMENT ENGINEERING
              </span>
            </div>

            <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-primary uppercase leading-tight tracking-tight">
              THE ANATOMY OF <br />
              <span className="text-brand-muted">THE DROP SHOULDER.</span>
            </h2>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-sans">
              Streetwear silhouettes live or die by proportion. AFK THEORY drop shoulder tees are engineered with fallen seam geometry that creates a broadened chest profile with structured drape—never sloppy, never clingy.
            </p>

            {/* 4 Technical Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-brand-border/80">
              {technicalSpecs.map((spec) => (
                <div key={spec.metric} className="p-3.5 bg-brand-secondary/60 border border-brand-border/60">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent flex-shrink-0" />
                    <span className="font-heading font-extrabold text-xs text-brand-primary uppercase tracking-wider">
                      {spec.metric}
                    </span>
                  </div>
                  <span className="block text-[11px] font-heading font-bold text-brand-primary/80 uppercase pt-1">
                    {spec.label}
                  </span>
                  <p className="text-[11px] text-brand-muted leading-relaxed font-sans pt-0.5">
                    {spec.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <LinkComp
                href={routes.about()}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-primary text-white hover:bg-brand-primary/90 text-xs font-heading font-bold uppercase tracking-wider transition-all duration-200 shadow-sm group"
              >
                <span>Read Our Craft Archive</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </LinkComp>

              <LinkComp
                href={routes.collection("drop-01-offline-by-choice")}
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-brand-primary/30 text-brand-primary hover:border-brand-primary hover:bg-white text-xs font-heading font-bold uppercase tracking-wider transition-colors"
              >
                <span>Shop Drop 01</span>
                <span aria-hidden="true">→</span>
              </LinkComp>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
