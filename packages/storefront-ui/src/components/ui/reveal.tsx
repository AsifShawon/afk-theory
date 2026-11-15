"use client"

import React, { useEffect, useRef, useState } from "react"
import clsx from "clsx"

type RevealState = "visible" | "hidden" | "revealed"

export interface RevealProps {
  children: React.ReactNode
  className?: string
}

/**
 * Fades a section in the first time it scrolls into view.
 *
 * - Content is fully visible on the server and before JavaScript runs, so nothing
 *   is lost without JS and there is no flash for what is already on screen.
 * - Only sections that start below the fold are hidden, and they keep their space
 *   (no layout shift).
 * - Runs once; reduced-motion users never see the effect.
 */
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RevealState>("visible")

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Already on screen (or above it): leave visible.
    if (element.getBoundingClientRect().top < window.innerHeight) return

    setState("hidden")
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("revealed")
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={clsx(
        state === "hidden" && "opacity-0",
        state === "revealed" && "animate-reveal-up",
        className
      )}
    >
      {children}
    </div>
  )
}
