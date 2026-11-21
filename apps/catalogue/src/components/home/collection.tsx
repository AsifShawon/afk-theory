"use client"

import { Link } from "next-view-transitions"
import { useRef } from "react"
import type { CatalogueProduct } from "@dtc/catalogue-core"
import { ProductCard } from "@/components/product/product-card"
import { ArrowIcon } from "@/components/ui/icons"
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap"

const TEASER_SIZE = 6

/**
 * Home page teaser of the collection: six pieces and a way into the shop,
 * where the filters live. Cards rise in as the grid scrolls into view.
 */
export function Collection({ products }: { products: CatalogueProduct[] }) {
  const root = useRef<HTMLElement>(null)
  const shown = products.slice(0, TEASER_SIZE)

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

  return (
    <section id="collection" ref={root} aria-labelledby="collection-title" className="bg-brand-bone py-24 text-brand-graphite md:py-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-hud text-[11px] text-brand-olive">
              {products.length} {products.length === 1 ? "piece" : "pieces"} available
            </p>
            <h2 id="collection-title" data-heading className="display mt-3 overflow-hidden text-6xl md:text-8xl">
              <span className="block">The collection</span>
            </h2>
          </div>
          {products.length > 0 && (
            <Link href="/shop/" className="btn-outline h-12 self-start md:self-auto">
              Shop all {products.length} <ArrowIcon />
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-16 border border-brand-graphite/15 p-12 text-center">
            <p className="display text-3xl">The next drop is loading</p>
            <p className="mt-3 text-brand-olive">New pieces are on the way. Message us to hear first.</p>
          </div>
        ) : (
          <ul className={shown.length === 1 ? "mt-14 grid max-w-md grid-cols-1" : "mt-14 grid grid-cols-2 gap-x-5 gap-y-14 md:gap-x-8 lg:grid-cols-3"}>
            {shown.map((product) => (
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
