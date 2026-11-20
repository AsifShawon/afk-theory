"use client"

import { Link } from "next-view-transitions"
import { useRef } from "react"
import { formatBdt, type CatalogueImage, type CatalogueProduct, type ImageRole } from "@dtc/catalogue-core"
import { Picture } from "@/components/ui/picture"
import { ArrowIcon } from "@/components/ui/icons"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

const VIEW_LABEL: Record<ImageRole, string> = {
  front: "Front",
  back: "Back",
  model: "On body",
  detail: "Detail",
}

const STAT_LABEL: Record<string, string> = {
  fabric: "Fabric",
  gsm: "Weight",
  fit: "Fit",
  origin: "Origin",
}

/** One image per view, in the order a buyer inspects a garment. */
function pickViews(product: CatalogueProduct): CatalogueImage[] {
  const order: ImageRole[] = ["front", "back", "model", "detail"]
  const views: CatalogueImage[] = []
  for (const role of order) {
    const img = product.images.find((i) => i.role === role)
    if (img) views.push(img)
  }
  return views.length >= 2 ? views : product.images.slice(0, 3)
}

/**
 * Item inspect screen. On desktop the section pins and each scroll step
 * wipes to the next view of the garment while its label lights up.
 */
export function FeaturedStory({ product }: { product: CatalogueProduct }) {
  const root = useRef<HTMLElement>(null)
  const views = pickViews(product)
  const stats = Object.entries(product.details).filter(([key, value]) => STAT_LABEL[key] && value)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
        const layers = gsap.utils.toArray<HTMLElement>("[data-view]")
        const labels = gsap.utils.toArray<HTMLElement>("[data-view-label]")
        if (layers.length < 2) return

        const setActive = (index: number) =>
          labels.forEach((label, i) => label.toggleAttribute("data-active", i === index))
        setActive(0)

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: `+=${(layers.length - 1) * 80}%`,
            pin: true,
            scrub: 0.7,
            snap: { snapTo: 1 / (layers.length - 1), duration: 0.5, ease: "power2.inOut" },
            onUpdate: (self) => setActive(Math.round(self.progress * (layers.length - 1))),
          },
        })
        layers.slice(1).forEach((layer, i) => {
          tl.fromTo(layer, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "none" }, i)
          tl.fromTo(layer.querySelector("img"), { scale: 1.25 }, { scale: 1, ease: "none" }, i)
        })
      })

      mm.add(MOTION_OK, () => {
        gsap.from("[data-story-text]", {
          y: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <section id="featured" ref={root} aria-labelledby="featured-title" className="relative overflow-hidden bg-brand-graphite md:h-[100svh]">
      <div className="mx-auto grid h-full max-w-editorial gap-10 px-5 py-20 md:grid-cols-[1fr_minmax(0,0.9fr)] md:items-center md:gap-16 md:px-10 md:py-24">
        <div className="order-2 md:order-1">
          <p data-story-text className="font-hud text-[11px] text-brand-accent">
            Inspect item{product.category ? ` / ${product.category.name}` : ""}
          </p>
          <h2 id="featured-title" data-story-text className="display mt-4 text-5xl md:text-7xl lg:text-8xl">
            {product.name}
          </h2>
          {product.tagline && (
            <p data-story-text className="mt-5 max-w-md text-lg text-brand-bone/75">
              {product.tagline}
            </p>
          )}

          {stats.length > 0 && (
            <dl data-story-text className="mt-8 grid max-w-lg grid-cols-2 gap-px border border-white/10 bg-white/10 [&>div:last-child:nth-child(odd)]:col-span-2">
              {stats.map(([key, value]) => (
                <div key={key} className="bg-brand-graphite p-4">
                  <dt className="font-hud text-[10px] text-brand-bone/50">{STAT_LABEL[key]}</dt>
                  <dd className="mt-1 text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div data-story-text className="mt-8 flex flex-wrap items-center gap-6">
            <Link href={`/products/${product.slug}/`} className="btn-signal">
              Choose size <ArrowIcon />
            </Link>
            <span className="font-hud text-lg tracking-normal">{formatBdt(product.priceBdt)}</span>
          </div>

          {views.length > 1 && (
            <ol aria-label="Views" className="mt-10 hidden gap-6 md:flex">
              {views.map((view, i) => (
                <li
                  key={view.id}
                  data-view-label
                  className="font-hud flex items-center gap-2 text-[10px] text-brand-bone/40 transition-colors data-[active]:text-brand-accent"
                >
                  <span className="h-px w-6 bg-current" aria-hidden />
                  {String(i + 1).padStart(2, "0")} {VIEW_LABEL[view.role]}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="order-1 md:order-2">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:relative md:mx-auto md:aspect-[4/5] md:max-h-[78svh] md:gap-0 md:overflow-hidden md:px-0">
            {views.map((view, i) => (
              <figure
                key={view.id}
                data-view
                className="hud-frame relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden bg-brand-stone text-brand-graphite md:absolute md:inset-0 md:w-full"
                style={{ zIndex: i }}
              >
                <Picture image={view} sizes="(min-width: 768px) 45vw, 78vw" className="h-full w-full object-cover" />
                <figcaption className="font-hud absolute bottom-4 left-4 bg-brand-graphite px-2 py-1 text-[10px] text-brand-bone md:hidden">
                  {VIEW_LABEL[view.role]}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
