import React from "react"
import Link from "next/link"
import Image from "next/image"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ArrowRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface CraftsmanshipSectionProps {
  routes: StoreRoutes
  linkComponent?: LinkComponent
}

export function CraftsmanshipSection({
  routes,
  linkComponent: LinkComp = Link,
}: CraftsmanshipSectionProps) {
  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-brand-surface border-b border-brand-border/80">
      <div className="editorial-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Visual Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-brand-secondary rounded-2xl overflow-hidden border border-brand-border/80 shadow-subtle group">
              <Image
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80"
                alt="AFK THEORY Drop Shoulder Garment Architecture"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Floating Metric Callout */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-[#292828]/95 backdrop-blur-md p-4 border border-[#3D3B3B] shadow-md flex items-center justify-between text-white">
                <div>
                  <span className="block font-heading font-extrabold text-xs text-white uppercase tracking-wider">
                    Oversized Drop Shoulder
                  </span>
                  <span className="text-[11px] text-brand-sand">
                    Fallen shoulder seams, structured boxy drape
                  </span>
                </div>
                <span className="text-xs font-heading font-extrabold text-brand-primary bg-brand-accent px-2.5 py-1">
                  DROP 01
                </span>
              </div>
            </div>
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-primary text-brand-accent text-[10px] sm:text-[11px] font-heading font-extrabold uppercase tracking-widest">
                FIT &amp; QUALITY ARCHITECTURE
              </span>
            </div>

            <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-primary uppercase leading-tight tracking-tight">
              THE ANATOMY OF <br />
              <span className="text-brand-primary/80">THE DROP SHOULDER.</span>
            </h2>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-sans">
              Streetwear silhouettes live or die by their proportion. AFK THEORY drop shoulder tees are engineered with dropped seam geometry that creates a clean, broadened chest profile without looking sloppy.
            </p>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-sans">
              Cut from substantial compact cotton yarns, each garment maintains its structured shape whether stationary or in motion. Designed for relaxed movement, breathable comfort in Bangladesh climate, and enduring wash retention.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-brand-border/80">
              <div>
                <span className="font-heading font-bold text-sm text-brand-primary uppercase block">
                  Fallen Seam
                </span>
                <span className="text-[11px] text-brand-muted font-sans">Relaxed Shoulders</span>
              </div>
              <div>
                <span className="font-heading font-bold text-sm text-brand-primary uppercase block">
                  Boxy Cut
                </span>
                <span className="text-[11px] text-brand-muted font-sans">Zero Body Cling</span>
              </div>
              <div>
                <span className="font-heading font-bold text-sm text-brand-primary uppercase block">
                  Dense Rib
                </span>
                <span className="text-[11px] text-brand-muted font-sans">Collar Retention</span>
              </div>
            </div>

            <div className="pt-2">
              <LinkComp
                href={routes.about()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white hover:bg-black text-xs font-heading font-semibold uppercase tracking-wider transition-all duration-200 shadow-subtle group"
              >
                <span>Read Our Craft Archive</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </LinkComp>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
