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
  garmentCount: string
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
      subtitle: "Oversized silhouette with fallen seam geometry & structured boxy drape",
      href: routes.catalog({ category: "drop-shoulder-tees" }),
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
      garmentCount: "Drop 01 Launch",
      badge: "FEATURED DROP",
    },
    {
      id: "heavyweight-tees",
      title: "Boxy & Regular Tees",
      subtitle: "High-density compact cotton cut for clean streetwear layering",
      href: routes.catalog({ category: "t-shirts" }),
      image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
      garmentCount: "Pre-Shrunk Cotton",
      badge: "Street Essential",
    },
    {
      id: "trousers",
      title: "Street Bottoms & Cargo",
      subtitle: "Relaxed fit and utility trousers designed for unrestricted comfort",
      href: routes.catalog({ category: "trousers" }),
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
      garmentCount: "Future Drop",
    },
    {
      id: "accessories",
      title: "Headwear & Accessories",
      subtitle: "Minimal caps and utilitarian essentials to complete your fit",
      href: routes.catalog({ category: "accessories" }),
      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
      garmentCount: "Archive",
      badge: "Upcoming",
    },
  ]

  const mainDept = departments[0]
  const secondDept = departments[1]
  const bottomDepts = departments.slice(2, 4)

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-brand-surface border-b border-brand-border/80">
      <div className="editorial-container space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-heading font-bold uppercase tracking-widest text-brand-accent">
              Wardrobe Departments
            </span>
            <h2 className="font-display text-2xl sm:text-4xl text-brand-primary tracking-tight font-normal">
              Shop By Wardrobe Category
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Every garment is engineered around specific fabric weights and clean architectural silhouettes.
            </p>
          </div>

          <LinkComp
            href={routes.catalog()}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-brand-accent hover:underline uppercase tracking-wider group"
          >
            <span>Browse All Departments</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </LinkComp>
        </div>

        {/* Asymmetric Editorial Mosaic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Main Department (Large Left Tile) */}
          <LinkComp
            href={mainDept.href}
            className="group lg:col-span-7 relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full min-h-[380px] rounded-2xl overflow-hidden border border-brand-border/70 bg-brand-secondary shadow-subtle flex flex-col justify-end p-6 sm:p-10"
          >
            <Image
              src={mainDept.image}
              alt={mainDept.title}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 text-white">
              {mainDept.badge && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-heading font-bold uppercase tracking-widest text-brand-sand">
                  {mainDept.badge}
                </span>
              )}
              <h3 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-white">
                {mainDept.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 max-w-md line-clamp-2 leading-relaxed">
                {mainDept.subtitle}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-heading font-bold text-white group-hover:text-brand-sand uppercase tracking-wider">
                  <span>Explore Department</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </LinkComp>

          {/* Right Column (1 Medium Tile + 2 Smaller Tiles) */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            {/* Second Department Tile */}
            <LinkComp
              href={secondDept.href}
              className="group relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] rounded-2xl overflow-hidden border border-brand-border/70 bg-brand-secondary shadow-subtle flex flex-col justify-end p-6"
            >
              <Image
                src={secondDept.image}
                alt={secondDept.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-1.5 text-white">
                {secondDept.badge && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[9px] font-heading font-bold uppercase tracking-widest text-brand-sand">
                    {secondDept.badge}
                  </span>
                )}
                <h3 className="font-heading font-bold text-lg tracking-tight text-white">
                  {secondDept.title}
                </h3>
                <p className="text-xs text-white/80 line-clamp-1">
                  {secondDept.subtitle}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold text-brand-sand group-hover:text-white uppercase tracking-wider">
                    <span>Shop Now</span>
                    <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </LinkComp>

            {/* Bottom Row of 2 Tiles */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 flex-1">
              {bottomDepts.map((dept) => (
                <LinkComp
                  key={dept.id}
                  href={dept.href}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-brand-border/70 bg-brand-secondary shadow-subtle flex flex-col justify-end p-4 sm:p-5"
                >
                  <Image
                    src={dept.image}
                    alt={dept.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 21vw"
                    className="object-cover object-center group-hover:scale-104 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                  <div className="relative z-10 space-y-1 text-white">
                    <h4 className="font-heading font-bold text-sm tracking-tight text-white leading-snug">
                      {dept.title}
                    </h4>
                    <span className="text-[10px] text-brand-sand font-heading uppercase tracking-wider block group-hover:underline">
                      View Edit →
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
