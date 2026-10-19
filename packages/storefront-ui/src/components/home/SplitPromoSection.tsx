import React from "react"
import Link from "next/link"
import Image from "next/image"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ArrowRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface SplitPromoSectionProps {
  routes: StoreRoutes
  linkComponent?: LinkComponent
}

export function SplitPromoSection({
  routes,
  linkComponent: LinkComp = Link,
}: SplitPromoSectionProps) {
  const promos = [
    {
      title: "DROP 01: OFFLINE BY CHOICE",
      eyebrow: "AVAILABLE NOW // DROP 01",
      description:
        "Oversized drop shoulder silhouettes cut in Graphite Black, Bone White, and Electric Chartreuse accents. Dense compact cotton built for Dhaka streets.",
      image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80",
      ctaText: "EXPLORE DROP 01",
      href: routes.collection("drop-01"),
    },
    {
      title: "DROP 02: STREET ARCHIVE",
      eyebrow: "IN DEVELOPMENT // FUTURE COLLECTION",
      description:
        "Expanding the Theory into heavyweight boxy tees, utility bottoms, and minimal street essentials. Get on the drop registry for early drop alerts.",
      image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80",
      ctaText: "PREVIEW ARCHIVE",
      href: routes.catalog(),
    },
  ]

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-brand-border/80">
      <div className="editorial-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {promos.map((promo) => (
            <div
              key={promo.title}
              className="group relative aspect-[4/5] sm:aspect-[16/11] rounded-2xl overflow-hidden border border-brand-border/80 bg-brand-secondary shadow-subtle flex flex-col justify-end p-6 sm:p-10"
            >
              <Image
                src={promo.image}
                alt={promo.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-2.5 text-white max-w-md">
                <span className="text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-widest text-brand-sand">
                  {promo.eyebrow}
                </span>
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-tight">
                  {promo.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                  {promo.description}
                </p>
                <div className="pt-2">
                  <LinkComp
                    href={promo.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-brand-primary hover:bg-brand-secondary text-xs font-heading font-bold uppercase tracking-wider transition-colors shadow-xs group-hover:shadow-md"
                  >
                    <span>{promo.ctaText}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </LinkComp>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
