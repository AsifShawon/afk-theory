"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useLenis } from "@/components/motion/smooth-scroll"

interface NavUI {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const NavUIContext = createContext<NavUI | null>(null)

/** Open state for the mobile menu and search, shared by the header and the bottom bar. */
export function NavUIProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const lenis = useLenis()

  // A new page closes whatever was open.
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Freeze page scrolling behind an open menu or search.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return
    lenis?.stop()
    document.documentElement.style.overflow = "hidden"
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ""
    }
  }, [menuOpen, searchOpen, lenis])

  const value = useMemo(() => ({ menuOpen, setMenuOpen, searchOpen, setSearchOpen }), [menuOpen, searchOpen])
  return <NavUIContext.Provider value={value}>{children}</NavUIContext.Provider>
}

export function useNavUI(): NavUI {
  const ctx = useContext(NavUIContext)
  if (!ctx) throw new Error("useNavUI must be used inside NavUIProvider")
  return ctx
}
