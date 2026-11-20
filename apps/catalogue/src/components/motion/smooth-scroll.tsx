"use client"

import Lenis from "lenis"
import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

/** Inertia scrolling that stays in step with ScrollTrigger. Off for reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }
    const instance = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -64 } })
    instance.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    setLenis(instance)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  const lastPath = useRef(pathname)
  useEffect(() => {
    const changed = lastPath.current !== pathname
    lastPath.current = pathname
    const id = requestAnimationFrame(() => {
      // New page content moves every trigger position.
      ScrollTrigger.refresh()
      if (!changed) return
      const target = window.location.hash ? document.querySelector(window.location.hash) : null
      if (target instanceof HTMLElement) {
        lenis?.scrollTo(target, { immediate: true, offset: -64 })
      } else {
        lenis?.scrollTo(0, { immediate: true })
      }
    })
    return () => cancelAnimationFrame(id)
  }, [pathname, lenis])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
