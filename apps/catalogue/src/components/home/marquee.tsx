"use client"

import { useRef } from "react"
import { PauseMark } from "@/components/ui/icons"
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap"

/** Chartreuse band that leans into the scroll direction. */
export function Marquee({ phrases }: { phrases: string[] }) {
  const root = useRef<HTMLDivElement>(null)
  const items = [...phrases, ...phrases]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const skew = gsap.quickTo("[data-track]", "skewX", { duration: 0.4, ease: "power3.out" })
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => skew(gsap.utils.clamp(-8, 8, self.getVelocity() / -250)),
          onLeave: () => skew(0),
          onLeaveBack: () => skew(0),
        })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} className="relative overflow-hidden border-y border-brand-graphite bg-brand-accent py-4 text-brand-graphite" aria-label={phrases.join(". ")}>
      <div data-track aria-hidden>
        <div className="marquee-track flex w-max items-center gap-10">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10">
              {items.map((phrase, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-10">
                  <span className="display whitespace-nowrap text-3xl md:text-5xl">{phrase}</span>
                  <PauseMark size={28} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
