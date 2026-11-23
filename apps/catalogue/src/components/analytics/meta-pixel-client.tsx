"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { initMetaPixel, trackPageView } from "@/lib/meta-pixel"

export function MetaPixelClient() {
  const pathname = usePathname()

  useEffect(() => {
    initMetaPixel()
  }, [])

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return null
}
