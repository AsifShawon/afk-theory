"use client"

import { useRef, useState } from "react"
import { EASE_IN_OUT, gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

export const SEEN_KEY = "afk-loaded"

/**
 * Inline script for <head>: marks a repeat visit before first paint, so the
 * loading screen never flashes once it has played in this session.
 */
export const PRELOADER_HEAD_SCRIPT = `document.documentElement.classList.add("js");try{if(sessionStorage.getItem("${SEEN_KEY}")==="1")document.documentElement.setAttribute("data-seen","")}catch(e){}`

function markReady() {
  document.documentElement.setAttribute("data-ready", "")
  window.dispatchEvent(new Event("afk:ready"))
}

/** Runs `cb` once the loading screen has finished (immediately if it is not showing). */
export function onSiteReady(cb: () => void): () => void {
  if (document.documentElement.hasAttribute("data-ready")) {
    cb()
    return () => {}
  }
  window.addEventListener("afk:ready", cb, { once: true })
  return () => window.removeEventListener("afk:ready", cb)
}

/**
 * Game loading screen, shown once per visit. The "tip" is real ordering
 * information, the way a game uses its loading screens.
 */
export function Preloader({ tip }: { tip: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const finish = () => {
        document.documentElement.style.overflow = ""
        setDone(true)
        markReady()
      }
      const seen = document.documentElement.hasAttribute("data-seen")
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        if (seen) {
          finish()
          return
        }
        sessionStorage.setItem(SEEN_KEY, "1")
        const counter = { value: 0 }
        const number = el.querySelector<HTMLElement>("[data-count]")
        document.documentElement.style.overflow = "hidden"

        gsap
          .timeline({ onComplete: finish })
          .from("[data-bar]", { scaleY: 0, transformOrigin: "bottom", duration: 0.5, stagger: 0.08, ease: "power3.out" })
          .from("[data-frame]", { scale: 0.6, opacity: 0, duration: 0.5, ease: "power3.out" }, 0)
          .to(
            counter,
            {
              value: 100,
              duration: 1.1,
              ease: "power2.inOut",
              onUpdate: () => {
                if (number) number.textContent = String(Math.round(counter.value)).padStart(3, "0")
              },
            },
            0.1
          )
          .to("[data-progress]", { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0.1)
          .to("[data-bar]", { scaleY: 0, transformOrigin: "top", duration: 0.35, stagger: 0.06, ease: "power3.in" })
          .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.75, ease: EASE_IN_OUT }, "-=0.1")
      })

      mm.add("(prefers-reduced-motion: reduce)", finish)

      return () => mm.revert()
    },
    { scope: root }
  )

  if (done) return null

  return (
    <div
      ref={root}
      data-preloader
      className="fixed inset-0 z-[100] flex flex-col bg-brand-graphite-dark text-brand-bone"
      style={{ clipPath: "inset(0 0 0 0)" }}
      aria-hidden
    >
      <div className="flex flex-1 items-center justify-center">
        <div data-frame className="relative flex h-28 w-28 items-center justify-center gap-3 border-[5px] border-brand-accent">
          <span data-bar className="block h-12 w-4 bg-brand-accent" />
          <span data-bar className="block h-12 w-4 bg-brand-accent" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-6 px-6 pb-8 md:px-10">
        <div className="max-w-sm">
          <p className="font-hud text-[11px] text-brand-accent">Tip</p>
          <p className="mt-1 text-sm text-brand-muted-light">{tip}</p>
        </div>
        <p className="display text-6xl tabular-nums md:text-8xl">
          <span data-count>000</span>
        </p>
      </div>
      <div className="h-1 w-full bg-brand-graphite-light">
        <div data-progress className="h-full origin-left scale-x-0 bg-brand-accent" />
      </div>
    </div>
  )
}
