import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  CategoryView,
  PRODUCT_LINES,
  StoreRoutes,
  lineHref,
  styleHref,
} from "@dtc/commerce-contracts"
import { ArrowRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface FeaturedCategoriesProps {
  categories?: CategoryView[]
  /** Photo per product line handle, for example the first product's photo. Falls back to the catalog config photo. */
  lineImages?: Record<string, string | undefined>
  routes: StoreRoutes
  linkComponent?: LinkComponent
}

/**
 * The two product lines as large tiles. Content comes from the catalog
 * structure in commerce-contracts, so it stays in step with the menu and footer.
 */
export function FeaturedCategories({
  routes,
  lineImages = {},
  linkComponent: LinkComp = Link,
}: FeaturedCategoriesProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-brand-secondary border-b border-brand-border/80">
      <div className="editorial-container space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-brand-primary">
              // THE COLLECTIONS
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-primary uppercase tracking-tight">
              TWO LINES. ONE THEORY.
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-sans">
              Drop shoulder tees and hoodies, cut oversized and built to last.
            </p>
          </div>

          <LinkComp
            href={routes.catalog()}
            className="inline-flex items-center gap-2 text-xs font-heading font-bold text-brand-primary hover:text-accent uppercase tracking-wider group"
          >
            <span>Browse Full Catalog</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </LinkComp>
        </div>

        {/* Two product line tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {PRODUCT_LINES.map((line) => (
            <div
              key={line.handle}
              className="group relative w-full min-w-0 aspect-[4/5] sm:aspect-[5/4] md:aspect-[4/5] overflow-hidden border border-brand-border bg-panel flex flex-col justify-end p-6 sm:p-10"
            >
              <Image
                src={lineImages[line.handle] || line.image}
                alt={line.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Whole tile is one link; style chips sit above it as their own links */}
              <LinkComp
                href={lineHref(routes, line)}
                className="absolute inset-0 z-10"
                aria-label={`Shop ${line.title}`}
              >
                <span className="sr-only">Shop {line.title}</span>
              </LinkComp>

              <div className="relative z-20 space-y-3 text-white pointer-events-none">
                <span className="inline-block px-2.5 py-1 bg-brand-accent text-on-accent text-[10px] font-heading font-extrabold uppercase tracking-widest">
                  {line.colorCount
                    ? `${line.colorCount} COLORS`
                    : `${line.styles.length} STYLES`}
                </span>
                <h3 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                  {line.title}
                </h3>
                <p className="text-xs sm:text-sm text-brand-bone/85 max-w-md leading-relaxed font-sans">
                  {line.summary}
                </p>

                {line.styles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pointer-events-auto">
                    {line.styles.map((style) => (
                      <LinkComp
                        key={style.handle}
                        href={styleHref(routes, style)}
                        className="px-3 py-1.5 border border-white/40 hover:border-accent hover:text-accent text-[11px] font-heading font-bold uppercase tracking-wider transition-colors"
                      >
                        {style.title} <span className="text-white/60">/ {style.colorCount} colors</span>
                      </LinkComp>
                    ))}
                  </div>
                )}

                <span className="inline-flex items-center gap-2 text-xs font-heading font-bold text-brand-accent group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                  <span>Shop {line.shortTitle}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
