"use client"

import { useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import type { CatalogueProduct } from "@dtc/catalogue-core"
import { Reveal } from "@/components/motion/reveal"
import { ProductCard } from "@/components/product/product-card"
import { ArrowIcon } from "@/components/ui/icons"
import { SectionHeading } from "./section-heading"

/** A sideways row of products: swipe on phones, arrow buttons on desktop. */
export function ProductRail({
  id,
  eyebrow,
  title,
  href,
  products,
}: {
  id: string
  eyebrow: string
  title: string
  href: string
  products: CatalogueProduct[]
}) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = () => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const step = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" })
  }

  return (
    <section aria-labelledby={id} className="border-t border-brand-graphite/10 bg-brand-bone py-20 text-brand-graphite md:py-28">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0 flex-1">
              <SectionHeading id={id} eyebrow={eyebrow} title={title} href={href} />
            </div>
            <div className="hidden shrink-0 gap-2 md:flex">
              <RailButton label="Scroll back" disabled={edges.start} onClick={() => step(-1)} flip />
              <RailButton label="Scroll forward" disabled={edges.end} onClick={() => step(1)} />
            </div>
          </div>
        </Reveal>
      </div>
      <ul
        ref={track}
        onScroll={measure}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 md:mx-auto md:max-w-editorial md:scroll-px-10 md:gap-6 md:px-10"
      >
        {products.map((product) => (
          <li key={product.id} className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-[calc((100%-3rem)/3.3)] lg:w-[calc((100%-4.5rem)/4.2)]">
            <ProductCard product={product} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 42vw, 68vw" />
          </li>
        ))}
      </ul>
    </section>
  )
}

function RailButton({ label, disabled, onClick, flip = false }: { label: string; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center border border-brand-graphite/20 transition-colors hover:border-brand-graphite hover:bg-brand-graphite hover:text-brand-bone disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-graphite"
    >
      <ArrowIcon className={clsx(flip && "rotate-180")} />
    </button>
  )
}
