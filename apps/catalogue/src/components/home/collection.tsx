"use client"

import { useRef, useState } from "react"
import { clsx } from "clsx"
import type { CatalogueCategory, CatalogueProduct } from "@dtc/catalogue-core"
import { ProductCard } from "@/components/product/product-card"
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap"

export function Collection({ products, categories }: { products: CatalogueProduct[]; categories: CatalogueCategory[] }) {
  const root = useRef<HTMLElement>(null)
  const [filter, setFilter] = useState<string>("all")
  const filtered = useRef(false)

  const choose = (next: string) => {
    if (next === filter) return
    filtered.current = true
    setFilter(next)
  }

  // After a filter change the remaining cards deal in again, left to right.
  useGSAP(
    () => {
      if (!filtered.current) return
      ScrollTrigger.refresh()
      if (window.matchMedia(MOTION_OK).matches) {
        gsap.fromTo(
          "[data-card]",
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.07, ease: "expo.out", overwrite: true }
        )
      }
    },
    { dependencies: [filter], scope: root }
  )

  // Cards rise in as the grid scrolls into view.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from("[data-heading] > *", {
          yPercent: 100,
          duration: 1.1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-heading]", start: "top 85%" },
        })
        gsap.set("[data-card]", { y: 80, opacity: 0 })
        ScrollTrigger.batch("[data-card]", {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: "expo.out", overwrite: true }),
        })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  const visible = filter === "all" ? products : products.filter((p) => p.category?.id === filter)

  return (
    <section id="collection" ref={root} aria-labelledby="collection-title" className="bg-brand-bone py-24 text-brand-graphite md:py-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-hud text-[11px] text-brand-olive">
              {products.length} {products.length === 1 ? "item" : "items"} available
            </p>
            <h2 id="collection-title" data-heading className="display mt-3 overflow-hidden text-6xl md:text-8xl">
              <span className="block">The collection</span>
            </h2>
          </div>
          {categories.length > 1 && (
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
              {[{ id: "all", name: "All" }, ...categories].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={filter === c.id}
                  onClick={() => choose(c.id)}
                  className={clsx(
                    "font-hud h-10 border px-4 text-[11px] transition-colors",
                    filter === c.id ? "border-brand-graphite bg-brand-graphite text-brand-bone" : "border-brand-graphite/20 hover:border-brand-graphite"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-16 border border-brand-graphite/15 p-12 text-center">
            <p className="display text-3xl">The next drop is loading</p>
            <p className="mt-3 text-brand-olive">New pieces are on the way. Message us to hear first.</p>
          </div>
        ) : (
          <ul className={clsx("mt-14 grid gap-x-5 gap-y-14 md:gap-x-8", products.length === 1 ? "max-w-md grid-cols-1" : "grid-cols-2 lg:grid-cols-3")}>
            {visible.map((product) => (
              <li key={product.id} data-card>
                <ProductCard product={product} sizes="(min-width: 1024px) 30vw, 50vw" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
