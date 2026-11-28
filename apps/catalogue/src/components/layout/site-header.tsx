"use client"

import { Link } from "next-view-transitions"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import { formatBdt } from "@dtc/catalogue-core"
import { useOrder } from "@/components/order/order-provider"
import { BagIcon, ChevronIcon, MenuIcon, SearchIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"
import type { NavData, NavProduct } from "@/lib/store"
import { CART_LABEL } from "@/lib/checkout"
import { BADGE_LABEL } from "@/lib/store"
import { useNavUI } from "./nav-ui"

const OPEN_DELAY = 120
const CLOSE_DELAY = 220

type PanelId = "shop" | string

/**
 * Store header. Desktop: Shop and each top-level category open a mega panel
 * with subcategories and 1-2 product cards. Phones: menu button, logo,
 * search and order list. Hides while scrolling down, returns on the way up.
 */
export function SiteHeader({ nav, announcement }: { nav: NavData; announcement: string }) {
  const pathname = usePathname()
  const { count, setDrawerOpen } = useOrder()
  const { setMenuOpen, setSearchOpen, menuOpen, searchOpen } = useNavUI()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState<PanelId | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggers = useRef(new Map<string, HTMLButtonElement | null>())

  const onHome = pathname === "/"
  const solid = scrolled || !onHome || open !== null

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      if (Math.abs(y - last) > 6) {
        setHidden(y > 160 && y > last)
        last = y
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => setOpen(null), [pathname])

  const schedule = useCallback((next: PanelId | null, delay: number) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(next), delay)
  }, [])

  // Esc closes the panel and puts focus back on its button.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      triggers.current.get(open)?.focus()
      setOpen(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const keepVisible = open !== null || menuOpen || searchOpen
  const showAnnouncement = Boolean(announcement) && !scrolled

  const panels: { id: PanelId; label: string; href: string }[] = [
    { id: "shop", label: "Shop", href: "/shop/" },
    ...nav.menu.filter((m) => m.children.length > 0 || m.products.length > 0).map((m) => ({ id: m.id, label: m.name, href: m.href })),
  ]
  const plainLinks = [
    ...nav.menu.filter((m) => m.children.length === 0 && m.products.length === 0).map((m) => ({ label: m.name, href: m.href })),
    ...(nav.hasNew ? [{ label: "New", href: "/new/" }] : []),
    ...(nav.hasSale ? [{ label: "Sale", href: "/sale/" }] : []),
    ...(nav.collections.length > 0 ? [{ label: "Collections", href: "/collections/" }] : []),
    { label: "Custom designs", href: "/custom-design/" },
  ]

  return (
    <>
      <header
        onPointerLeave={(e) => e.pointerType === "mouse" && schedule(null, CLOSE_DELAY)}
        className={clsx(
          "fixed inset-x-0 top-0 z-40 transition-[transform,background-color,border-color] duration-500 ease-out-expo",
          hidden && !keepVisible ? "-translate-y-full" : "translate-y-0",
          solid ? "border-b border-white/10 bg-brand-graphite/95 backdrop-blur-md" : "border-b border-transparent"
        )}
      >
        <div className={clsx("overflow-hidden bg-brand-accent text-brand-graphite transition-[max-height] duration-500", showAnnouncement ? "max-h-8" : "max-h-0")}>
          <p className="font-hud flex h-8 items-center justify-center px-4 text-center text-[10px]">{announcement}</p>
        </div>

        <div className="mx-auto flex h-16 max-w-editorial items-center gap-2 px-3 md:gap-6 md:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>

          <Link href="/" aria-label="AFK THEORY home" className="shrink-0">
            <img src="/brand/afk-theory-logo.webp" alt="AFK THEORY" width={520} height={68} className="h-4 w-auto md:h-5" />
          </Link>

          <nav aria-label="Main" className="ml-6 hidden h-full items-stretch lg:flex">
            <ul className="flex items-stretch">
              {panels.map((panel) => {
                const isOpen = open === panel.id
                return (
                  <li key={panel.id} className="flex items-stretch">
                    <button
                      ref={(el) => {
                        triggers.current.set(panel.id, el)
                      }}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`mega-${panel.id}`}
                      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(panel.id, open ? 0 : OPEN_DELAY)}
                      onClick={() => {
                        if (timer.current) clearTimeout(timer.current)
                        setOpen(isOpen ? null : panel.id)
                      }}
                      className={clsx(
                        "font-hud flex items-center gap-1.5 px-4 text-[11px] transition-colors",
                        isOpen ? "text-brand-accent" : "text-brand-bone/80 hover:text-brand-accent"
                      )}
                    >
                      {panel.label}
                      <ChevronIcon size={12} className={clsx("transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>
                    <MegaPanel id={panel.id} open={isOpen} nav={nav} onPointerEnter={() => timer.current && clearTimeout(timer.current)} />
                  </li>
                )
              })}
              {plainLinks.map((link) => (
                <li key={link.href} className="flex items-stretch">
                  <Link
                    href={link.href}
                    onPointerEnter={(e) => e.pointerType === "mouse" && open && schedule(null, CLOSE_DELAY)}
                    className={clsx(
                      "font-hud flex items-center px-4 text-[11px] transition-colors hover:text-brand-accent",
                      pathname === link.href || pathname.startsWith(link.href) ? "text-brand-accent" : "text-brand-bone/80"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <button type="button" onClick={() => setSearchOpen(true)} className="flex h-11 w-11 items-center justify-center hover:text-brand-accent" aria-label="Search products">
              <SearchIcon />
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 items-center gap-2 border border-white/15 px-3 transition-colors hover:border-brand-accent"
              aria-label={`Open ${CART_LABEL.toLowerCase()}, ${count} item${count === 1 ? "" : "s"}`}
            >
              <BagIcon size={18} />
              <span className="font-hud hidden text-[11px] sm:inline">{CART_LABEL}</span>
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
        </div>
      </header>

      {/* Dims the page under an open mega panel. */}
      <div
        aria-hidden
        onClick={() => setOpen(null)}
        className={clsx(
          "fixed inset-0 z-30 hidden bg-black/50 transition-opacity duration-300 lg:block",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
    </>
  )
}

function MegaPanel({ id, open, nav, onPointerEnter }: { id: PanelId; open: boolean; nav: NavData; onPointerEnter: () => void }) {
  const item = id === "shop" ? null : nav.menu.find((m) => m.id === id)
  const products = item ? item.products : nav.newArrivals

  return (
    <div
      id={`mega-${id}`}
      onPointerEnter={onPointerEnter}
      inert={!open}
      className={clsx(
        "absolute inset-x-0 top-full border-b border-white/10 bg-brand-graphite-dark text-brand-bone shadow-mega transition-[opacity,transform,visibility] duration-300 ease-out-expo motion-reduce:transition-none",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
      )}
    >
      <div className="mx-auto grid max-w-editorial gap-10 px-10 py-10 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid grid-cols-3 gap-8">
          {item ? (
            <div className="space-y-4">
              <p className="font-hud text-[10px] text-brand-accent">{item.name}</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href={item.href} className="display text-2xl hover:text-brand-accent">
                    Shop all {item.name}
                  </Link>
                </li>
                {item.children.map((child) => (
                  <li key={child.id}>
                    <Link href={child.href} className="text-brand-bone/75 transition-colors hover:text-brand-accent">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            nav.categories.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <Link href={cat.href} className="display block text-2xl hover:text-brand-accent">
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <ul className="space-y-2">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <Link href={child.href} className="text-brand-bone/75 transition-colors hover:text-brand-accent">
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="font-hud text-[10px] text-brand-bone/40">
                  {cat.productCount} {cat.productCount === 1 ? "piece" : "pieces"}
                </p>
              </div>
            ))
          )}
          <div className="space-y-3">
            <p className="font-hud text-[10px] text-brand-accent">Explore</p>
            <ul className="space-y-2.5 text-brand-bone/75">
              <li>
                <Link href="/shop/" className="hover:text-brand-accent">
                  Shop all ({nav.productCount})
                </Link>
              </li>
              {nav.hasNew && (
                <li>
                  <Link href="/new/" className="hover:text-brand-accent">
                    New arrivals
                  </Link>
                </li>
              )}
              {nav.hasSale && (
                <li>
                  <Link href="/sale/" className="hover:text-brand-accent">
                    Sale
                  </Link>
                </li>
              )}
              {nav.collections.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="hover:text-brand-accent">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/custom-design/" className="hover:text-brand-accent">
                  Custom designs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {products.length > 0 && (
          <div>
            <p className="font-hud mb-3 text-[10px] text-brand-bone/50">{item ? "Featured" : "Just dropped"}</p>
            <div className="flex gap-5">
              {products.slice(0, 2).map((p) => (
                <MenuProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MenuProductCard({ product }: { product: NavProduct }) {
  const badge = product.badges[0]
  return (
    <Link href={`/products/${product.slug}/`} className="group block w-48 xl:w-56">
      <div className="hud-frame relative aspect-[4/5] overflow-hidden bg-brand-stone text-brand-accent before:opacity-0 after:opacity-0 group-hover:before:opacity-100 group-hover:after:opacity-100">
        {product.image && <Picture image={product.image} sizes="224px" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        {badge && <span className="font-hud absolute left-2 top-2 bg-brand-graphite px-2 py-0.5 text-[10px] text-brand-bone">{BADGE_LABEL[badge]}</span>}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand-accent">{product.name}</p>
      <p className="font-hud mt-1 text-xs tracking-normal text-brand-bone/60">{formatBdt(product.priceBdt)}</p>
    </Link>
  )
}
