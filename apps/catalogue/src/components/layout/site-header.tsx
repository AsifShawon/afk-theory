"use client"

import { Link } from "next-view-transitions"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { clsx } from "clsx"
import { useOrder } from "@/components/order/order-provider"
import { BagIcon } from "@/components/ui/icons"

const NAV = [
  { href: "/#collection", label: "Collection" },
  { href: "/#how-to-order", label: "How to order" },
  { href: "/#faq", label: "FAQ" },
]

export function SiteHeader() {
  const { count, setDrawerOpen } = useOrder()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled || pathname !== "/" ? "border-b border-white/10 bg-brand-graphite/85 backdrop-blur-md" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-editorial items-center gap-6 px-5 md:px-10">
        <Link href="/" aria-label="AFK THEORY home" className="shrink-0">
          <img src="/brand/afk-theory-logo.webp" alt="AFK THEORY" width={520} height={68} className="h-4 w-auto md:h-5" />
        </Link>
        <nav aria-label="Main" className="ml-auto hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="font-hud text-[11px] text-brand-bone/70 transition-colors hover:text-brand-accent">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="ml-auto flex h-10 items-center gap-2 border border-white/15 px-3 transition-colors hover:border-brand-accent md:ml-0"
          aria-label={`Open order list, ${count} item${count === 1 ? "" : "s"}`}
        >
          <BagIcon size={18} />
          <span className="font-hud text-[11px]">Order list</span>
          <span
            className={clsx(
              "flex h-5 min-w-5 items-center justify-center px-1 font-hud text-[10px] tracking-normal",
              count > 0 ? "bg-brand-accent text-brand-graphite" : "bg-white/10 text-brand-bone/60"
            )}
          >
            {count}
          </span>
        </button>
      </div>
    </header>
  )
}
