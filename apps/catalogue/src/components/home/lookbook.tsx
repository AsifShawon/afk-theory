"use client"

import { Link } from "next-view-transitions"
import { useRef } from "react"
import type { CatalogueImage, CatalogueProduct } from "@dtc/catalogue-core"
import { Picture } from "@/components/ui/picture"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

/** On-model photos on a sideways track. Desktop pins and scrolls it; phones swipe. */
export function Lookbook({ shots }: { shots: { image: CatalogueImage; product: CatalogueProduct }[] }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
        const el = track.current
        if (!el) return
        const distance = () => el.scrollWidth - window.innerWidth
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        })
        gsap.utils.toArray<HTMLElement>("[data-shot]").forEach((shot) => {
          const img = shot.querySelector("img")
          gsap.fromTo(shot, { clipPath: "inset(12% 8% 12% 8%)" }, {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: { trigger: shot, containerAnimation: tween, start: "left 95%", end: "left 45%", scrub: true },
          })
          gsap.fromTo(img, { xPercent: -8, scale: 1.18 }, {
            xPercent: 8,
            scale: 1.18,
            ease: "none",
            scrollTrigger: { trigger: shot, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          })
        })
        gsap.to("[data-lookbook-word]", {
          xPercent: -30,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true },
        })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <section ref={root} aria-labelledby="lookbook-title" className="grain relative overflow-hidden bg-brand-graphite py-20 md:flex md:h-[100svh] md:flex-col md:justify-center md:py-0">
      <p
        data-lookbook-word
        aria-hidden
        className="display pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-[28vw] text-transparent md:text-[22vw]"
        style={{ WebkitTextStroke: "1px rgba(245,243,237,0.12)" }}
      >
        Offline by choice
      </p>
      <div className="relative mx-auto mb-10 w-full max-w-editorial px-5 md:mb-12 md:px-10">
        <p className="font-hud text-[11px] text-brand-accent">Lookbook</p>
        <h2 id="lookbook-title" className="display mt-3 text-5xl md:text-7xl">
          Worn offline
        </h2>
      </div>
      <div className="no-scrollbar relative overflow-x-auto md:overflow-visible">
        <div ref={track} className="flex w-max snap-x snap-mandatory gap-4 px-5 md:gap-8 md:px-10">
          {shots.map(({ image, product }) => (
            <figure key={image.id} data-shot className="relative w-[72vw] shrink-0 snap-center overflow-hidden md:w-[min(32vw,440px)]">
              <Link href={`/products/${product.slug}/`} className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-brand-stone">
                  <Picture image={image} sizes="(min-width: 768px) 32vw, 72vw" className="h-full w-full scale-[1.18] object-cover" />
                </div>
                <figcaption className="mt-3 flex items-center justify-between gap-4">
                  <span className="display text-lg leading-none group-hover:text-brand-accent">{product.name}</span>
                  <span className="font-hud text-[10px] text-brand-bone/50">View item</span>
                </figcaption>
              </Link>
            </figure>
          ))}
          <div aria-hidden className="hidden w-[10vw] shrink-0 md:block" />
        </div>
      </div>
    </section>
  )
}
