"use client"

// Plain links here: a page transition would be cut short as the menu unlocks scrolling.
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { clsx } from "clsx"
import type { SiteSettings } from "@dtc/catalogue-core"
import { useOrder } from "@/components/order/order-provider"
import { BagIcon, ChevronIcon, CloseIcon, HomeIcon, MessengerIcon, SearchIcon, ShopIcon, WhatsAppIcon } from "@/components/ui/icons"
import { messengerUrl } from "@/lib/order-message"
import type { NavData } from "@/lib/store"
import { normalizeWhatsappNumber } from "@dtc/catalogue-core"
import { useNavUI } from "./nav-ui"

/**
 * Phone menu: a drawer from the left. Categories come first (with their
 * subcategories in accordions), then New, Sale and collections, then help
 * and contact.
 */
export function MobileNav({ nav, settings }: { nav: NavData; settings: SiteSettings }) {
  const { menuOpen, setMenuOpen, setSearchOpen } = useNavUI()
  const [expanded, setExpanded] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wa = normalizeWhatsappNumber(settings.whatsappNumber)
  const messenger = messengerUrl(settings.messengerPage, "menu")

  useEffect(() => {
    if (!menuOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen, setMenuOpen])

  const close = () => setMenuOpen(false)
  const row = "flex min-h-[52px] items-center justify-between gap-4 border-b border-white/10"

  return (
    <div className={clsx("fixed inset-0 z-50 lg:hidden", menuOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!menuOpen}>
      <div onClick={close} className={clsx("absolute inset-0 bg-black/60 transition-opacity duration-300", menuOpen ? "opacity-100" : "opacity-0")} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!menuOpen}
        className={clsx(
          "absolute inset-y-0 left-0 flex w-[88vw] max-w-sm flex-col bg-brand-graphite-dark text-brand-bone transition-transform duration-500 ease-out-expo",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <img src="/brand/afk-theory-logo.webp" alt="AFK THEORY" width={520} height={68} className="h-4 w-auto" />
          <button ref={closeRef} type="button" onClick={close} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8" data-lenis-prevent>
          <button
            type="button"
            onClick={() => {
              close()
              setSearchOpen(true)
            }}
            className="mt-5 flex h-12 w-full items-center gap-3 border border-white/15 px-4 text-left text-sm text-brand-bone/60"
          >
            <SearchIcon size={18} /> Search products
          </button>

          <p className="font-hud mt-8 text-[10px] text-brand-accent">Shop</p>
          <ul>
            {nav.categories.map((cat) => {
              const isOpen = expanded === cat.id
              return (
                <li key={cat.id}>
                  <div className={row}>
                    <Link href={cat.href} onClick={close} className="display flex-1 py-3 text-2xl">
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : cat.id)}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Hide" : "Show"} ${cat.name} subcategories`}
                        className="flex h-11 w-11 items-center justify-center"
                      >
                        <ChevronIcon className={clsx("transition-transform duration-300", isOpen && "rotate-180")} />
                      </button>
                    ) : (
                      <span className="font-hud text-[10px] text-brand-bone/40">{cat.productCount}</span>
                    )}
                  </div>
                  {cat.children.length > 0 && isOpen && (
                    <ul className="border-b border-white/10 py-2 pl-4">
                      <li>
                        <Link href={cat.href} onClick={close} className="flex min-h-[44px] items-center text-brand-bone/75">
                          All {cat.name}
                        </Link>
                      </li>
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <Link href={child.href} onClick={close} className="flex min-h-[44px] items-center justify-between text-brand-bone/75">
                            {child.name}
                            <span className="font-hud text-[10px] text-brand-bone/40">{child.productCount}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
            <li>
              <Link href="/shop/" onClick={close} className={clsx(row, "display text-2xl")}>
                Shop all
                <span className="font-hud text-[10px] text-brand-bone/40">{nav.productCount}</span>
              </Link>
            </li>
            {nav.hasNew && (
              <li>
                <Link href="/new/" onClick={close} className={clsx(row, "display text-2xl")}>
                  New arrivals
                </Link>
              </li>
            )}
            {nav.hasSale && (
              <li>
                <Link href="/sale/" onClick={close} className={clsx(row, "display text-2xl text-brand-accent")}>
                  Sale
                </Link>
              </li>
            )}
          </ul>

          {nav.collections.length > 0 && (
            <>
              <p className="font-hud mt-8 text-[10px] text-brand-accent">Collections</p>
              <ul>
                {nav.collections.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} onClick={close} className={clsx(row, "text-lg font-semibold")}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="font-hud mt-8 text-[10px] text-brand-accent">Help</p>
          <ul className="text-brand-bone/75">
            <li>
              <Link href="/#how-to-order" onClick={close} className="flex min-h-[44px] items-center">
                How to order
              </Link>
            </li>
            <li>
              <Link href="/#faq" onClick={close} className="flex min-h-[44px] items-center">
                FAQ
              </Link>
            </li>
          </ul>

          {(wa || messenger) && (
            <div className="mt-6 grid gap-2">
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn-signal h-12 w-full">
                  <WhatsAppIcon /> Chat on WhatsApp
                </a>
              )}
              {messenger && (
                <a href={messenger} target="_blank" rel="noopener noreferrer" className="btn-outline h-12 w-full">
                  <MessengerIcon /> Messenger
                </a>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

/**
 * Phone tab bar: Home, Shop, Search, Order list. Hidden on product pages,
 * where the sticky order bar uses the bottom edge.
 */
export function BottomBar() {
  const pathname = usePathname()
  const { count, setDrawerOpen } = useOrder()
  const { setSearchOpen, searchOpen } = useNavUI()
  if (pathname.startsWith("/products/")) return null

  const item = "flex flex-1 flex-col items-center justify-center gap-1 font-hud text-[9px] transition-colors"
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <>
      <div aria-hidden className="h-16 lg:hidden" />
      <nav
        aria-label="Quick links"
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-white/10 bg-brand-graphite/95 pb-[env(safe-area-inset-bottom)] text-brand-bone backdrop-blur-md lg:hidden"
      >
        <Link href="/" className={clsx(item, active("/") ? "text-brand-accent" : "text-brand-bone/70")} aria-current={active("/") ? "page" : undefined}>
          <HomeIcon /> Home
        </Link>
        <Link
          href="/shop/"
          className={clsx(item, active("/shop") || active("/c/") || active("/collections") ? "text-brand-accent" : "text-brand-bone/70")}
          aria-current={active("/shop") ? "page" : undefined}
        >
          <ShopIcon /> Shop
        </Link>
        <button type="button" onClick={() => setSearchOpen(true)} className={clsx(item, searchOpen ? "text-brand-accent" : "text-brand-bone/70")}>
          <SearchIcon /> Search
        </button>
        <button type="button" onClick={() => setDrawerOpen(true)} className={clsx(item, "relative text-brand-bone/70")} aria-label={`Order list, ${count} items`}>
          <span className="relative">
            <BagIcon />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-brand-accent px-1 text-[9px] tracking-normal text-brand-graphite">
                {count}
              </span>
            )}
          </span>
          Order list
        </button>
      </nav>
    </>
  )
}
