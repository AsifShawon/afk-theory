"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export const EASE_OUT = "expo.out"
export const EASE_IN_OUT = "power4.inOut"

/** Animations are built inside this media query so reduced-motion users get static pages. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)"

export { gsap, ScrollTrigger, useGSAP }
