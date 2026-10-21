import React from "react"
import Link from "next/link"
import Image from "next/image"
import { CategoryView, StoreRoutes } from "@dtc/commerce-contracts"
import { ArrowRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface FeaturedCategoriesProps {
  categories?: CategoryView[]
  routes: StoreRoutes
  linkComponent?: LinkComponent
}

interface DepartmentTile {
  id: string
  title: string
  subtitle: string
  href: string
  image: string
  badge?: string
}

export function FeaturedCategories({
  routes,
  linkComponent: LinkComp = Link,
}: FeaturedCategoriesProps) {
  const departments: DepartmentTile[] = [
    {
      id: "drop-shoulder",
      title: "Drop Shoulder T-Shirts",
      subtitle: "Calibrated fallen seam geometry, relaxed armhole drape, and dense pre-shrunk cotton.",
      href: routes.category("drop-shoulder-t-shirts"),
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85",
      badge: "DROP 01 // HERO CATEGORY",
    },
    {
      id: "shirts",
      title: "Street Overshirts & Boxy Cuts",
      subtitle: "Heavyweight cotton twill and clean architectural layering pieces.",
      href: routes.category("shirts"),
      image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=85",
      badge: "FUTURE DROP",
    },
    {
      id: "trousers",
      title: "Trousers & Utility Bottoms",
      subtitle: "Relaxed silhouettes engineered for unrestricted movement in Dhaka streets.",
      href: routes.category("trousers-&-pants"),
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=85",
      badge: "ARCHIVE EDIT",
    },
    {
      id: "offline-caps",
      title: "Offline Headwear & Accessories",
      subtitle: "Low-profile dad caps and tactile silicone pause mark essentials.",
      href: routes.collection("drop-01-offline-by-choice"),
      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=85",
      badge: "LIMITED",
    },
  ]

  const mainDept = departments[0]
  const secondDept = departments[1]
  const bottomDepts = departments.slice(2, 4)

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-brand-secondary border-b border-brand-border/80">
      <div className="editorial-container space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-brand-primary">
              // CATALOG DEPARTMENTS
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-primary uppercase tracking-tight">
              CURATED SILHOUETTES
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed font-sans">
              Every garment is engineered around specific fabric weights, boxy proportions, and clean architectural lines.
            </p>
          </div>

          <LinkComp
            href={routes.catalog()}
            className="inline-flex items-center gap-2 text-xs font-heading font-bold text-brand-primary hover:text-black uppercase tracking-wider group"
          >
            <span>Browse Full Catalog</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </LinkComp>
        </div>

        {/* Asymmetric Editorial Mosaic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main Department (Hero Left Tile) */}
          <LinkComp
            href={mainDept.href}
            className="group lg:col-span-7 relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full min-h-[400px] overflow-hidden border border-brand-border bg-brand-primary flex flex-col justify-end p-6 sm:p-10"
          >
            <Image
              src={mainDept.image}
              alt={mainDept.title}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700 opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 text-white">
              {mainDept.badge && (
                <span className="inline-block px-2.5 py-1 bg-brand-accent text-brand-primary text-[10px] font-heading font-extrabold uppercase tracking-widest">
                  {mainDept.badge}
                </span>
              )}
              <h3 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                {mainDept.title}
              </h3>
              <p className="text-xs sm:text-sm text-brand-bone/85 max-w-md line-clamp-2 leading-relaxed font-sans">
                {mainDept.subtitle}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-heading font-bold text-brand-accent group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                  <span>Explore Silhouette</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </LinkComp>

          {/* Right Column (1 Medium Tile + 2 Smaller Tiles) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
            {/* Second Department Tile */}
            <LinkComp
              href={secondDept.href}
              className="group relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] overflow-hidden border border-brand-border bg-brand-primary flex flex-col justify-end p-6"
            >
              <Image
                src={secondDept.image}
                alt={secondDept.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-1.5 text-white">
                {secondDept.badge && (
                  <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-[9px] font-heading font-bold uppercase tracking-widest">
                    {secondDept.badge}
                  </span>
                )}
                <h3 className="font-heading font-bold text-lg uppercase tracking-tight text-white">
                  {secondDept.title}
                </h3>
                <p className="text-xs text-brand-bone/80 line-clamp-1 font-sans">
                  {secondDept.subtitle}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold text-brand-accent uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    <span>View Category</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </LinkComp>

            {/* Bottom Row of 2 Tiles */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {bottomDepts.map((dept) => (
                <LinkComp
                  key={dept.id}
                  href={dept.href}
                  className="group relative aspect-square overflow-hidden border border-brand-border bg-brand-primary flex flex-col justify-end p-4 sm:p-5"
                >
                  <Image
                    src={dept.image}
                    alt={dept.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 21vw"
                    className="object-cover object-center group-hover:scale-103 transition-transform duration-700 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                  <div className="relative z-10 space-y-1 text-white">
                    <h4 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-tight text-white leading-snug">
                      {dept.title}
                    </h4>
                    <span className="text-[10px] text-brand-accent font-heading font-bold uppercase tracking-wider block">
                      Explore →
                    </span>
                  </div>
                </LinkComp>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
