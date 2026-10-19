"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { BarsThreeIcon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon } from "../icons"
import { DesktopNav, NavLinkItem } from "./DesktopNav"
import { MegaNavItem } from "./navigation-model"
import { LinkComponent } from "../../types"

export interface HeaderProps {
  navLinks?: NavLinkItem[]
  navItems?: MegaNavItem[]
  homeHref?: string
  cartHref?: string
  cartCount?: number
  cartCountNode?: React.ReactNode
  onCartClick?: () => void
  accountHref?: string
  onOpenSearch?: () => void
  onOpenMobileMenu?: () => void
  mobileMenuSlot?: React.ReactNode
  headerActionsSlot?: React.ReactNode
  announcementText?: string
  secondaryLinks?: Array<{ label: string; href: string }>
  linkComponent?: LinkComponent
}

export function Header({
  navLinks,
  navItems,
  homeHref = "/",
  cartHref = "/cart",
  cartCount = 0,
  cartCountNode,
  onCartClick,
  accountHref = "/account",
  onOpenSearch,
  onOpenMobileMenu,
  mobileMenuSlot,
  headerActionsSlot,
  announcementText = "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
  secondaryLinks = [
    { label: "About The Theory", href: "/about" },
    { label: "Customer Care", href: "/contact" },
  ],
  linkComponent: LinkComp = Link,
}: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [headerBottom, setHeaderBottom] = useState<number>(120)

  const updateHeaderBottom = useCallback(() => {
    if (headerRef.current) {
      setHeaderBottom(headerRef.current.getBoundingClientRect().bottom)
    }
  }, [])

  useEffect(() => {
    updateHeaderBottom()
    if (!headerRef.current) return

    const ro = new ResizeObserver(updateHeaderBottom)
    ro.observe(headerRef.current)
    window.addEventListener("scroll", updateHeaderBottom, { passive: true })
    window.addEventListener("resize", updateHeaderBottom)

    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", updateHeaderBottom)
      window.removeEventListener("resize", updateHeaderBottom)
    }
  }, [updateHeaderBottom])

  return (
    <>
      {/* 1. Optional Slim Announcement Bar in normal page flow */}
      {announcementText && (
        <div className="bg-brand-primary text-brand-secondary text-[11px] font-heading font-medium tracking-wide py-1.5 px-4 text-center border-b border-white/10">
          <div className="content-container flex items-center justify-center gap-2">
            <span>{announcementText}</span>
          </div>
        </div>
      )}

      {/* 2. Floating Elevated Sticky Header Shell */}
      <header
        ref={headerRef}
        className="sticky top-2 sm:top-3.5 z-40 w-full px-2.5 sm:px-4 lg:px-6 transition-[top] duration-200 pointer-events-none"
        style={{
          top: "calc(var(--demo-banner-offset, 0px) + 8px)",
        }}
      >
        <div className="content-container max-w-[1440px] mx-auto pointer-events-auto">
          {/* Floating Island Surface Card */}
          <div
            className="relative border border-brand-border/80 bg-brand-surface/95 backdrop-blur-md shadow-subtle hover:shadow-editorial transition-all duration-300"
          >
            {/* Primary Row: Mobile toggle, Secondary desktop links, Brand wordmark, Actions */}
            <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-5 lg:px-6">
              {/* Left Column: Mobile Menu Trigger & Secondary Desktop Links */}
              <div className="flex items-center gap-x-5 flex-1 basis-0">
                {mobileMenuSlot ? (
                  <div className="lg:hidden">{mobileMenuSlot}</div>
                ) : onOpenMobileMenu ? (
                  <div className="lg:hidden">
                    <button
                      type="button"
                      onClick={onOpenMobileMenu}
                      className="p-2 -ml-2 text-brand-primary hover:text-brand-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                      aria-label="Open navigation menu"
                    >
                      <BarsThreeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                ) : null}

                {/* Secondary Desktop Utility Links */}
                <nav className="hidden lg:flex items-center gap-4 text-xs font-heading font-medium text-brand-primary/70">
                  {secondaryLinks.map((link) => (
                    <LinkComp
                      key={link.href}
                      href={link.href}
                      className="hover:text-brand-primary transition-colors py-1"
                    >
                      {link.label}
                    </LinkComp>
                  ))}
                </nav>
              </div>

              {/* Center Column: Brand Logotype with Official AFK Pause Mark */}
              <div className="flex flex-col items-center justify-center px-2">
                <LinkComp
                  href={homeHref}
                  className="flex items-center gap-2.5 group py-1"
                  data-testid="nav-store-link"
                >
                  <img
                    src="/brand/pause-symbol.png"
                    alt=""
                    aria-hidden="true"
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0"
                  />
                  <div className="flex flex-col items-start sm:items-center">
                    <span className="font-heading font-black text-lg sm:text-xl lg:text-2xl tracking-[0.14em] text-brand-primary uppercase whitespace-nowrap leading-none group-hover:text-brand-primary/80 transition-colors">
                      AFK THEORY
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase font-heading tracking-[0.22em] text-brand-muted font-bold mt-0.5">
                      PAUSE THE GAME. KEEP YOUR STYLE.
                    </span>
                  </div>
                </LinkComp>
              </div>

              {/* Right Column: Actions (Search, Custom Slot, Account, Bag) */}
              <div className="flex items-center justify-end gap-x-1.5 sm:gap-x-3 flex-1 basis-0">
                {/* Search Trigger */}
                {onOpenSearch && (
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    className="flex items-center gap-1.5 text-xs font-heading font-semibold text-brand-primary hover:text-brand-accent p-2 transition-colors group min-h-[44px] min-w-[44px] sm:min-w-0 justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    aria-label="Search catalog"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 text-brand-primary group-hover:text-brand-accent transition-colors" />
                    <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Search</span>
                  </button>
                )}

                {/* Provider-specific Slot (e.g. Currency badge in Medusa, Demo Admin link in Demo) */}
                {headerActionsSlot}

                {/* Account Link */}
                <LinkComp
                  href={accountHref}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-heading font-semibold uppercase tracking-wider text-brand-primary hover:text-brand-accent transition-colors p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  data-testid="nav-account-link"
                  aria-label="Customer Account"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden md:inline text-[11px]">Account</span>
                </LinkComp>

                {/* Cart Trigger */}
                {cartCountNode ? (
                  cartCountNode
                ) : onCartClick ? (
                  <button
                    type="button"
                    onClick={onCartClick}
                    className="relative p-2 text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    aria-label={`Shopping bag with ${cartCount} items`}
                    data-testid="nav-cart-link"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="sm:hidden absolute top-1 right-1 w-4 h-4 bg-brand-accent text-white text-[10px] font-heading font-bold rounded-full flex items-center justify-center tabular-nums leading-none">
                        {cartCount}
                      </span>
                    )}
                    <span className="hidden sm:inline text-xs font-heading font-semibold uppercase tracking-wider text-[11px]">
                      Bag ({cartCount})
                    </span>
                  </button>
                ) : (
                  <LinkComp
                    href={cartHref}
                    className="relative p-2 text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    aria-label={`Shopping bag with ${cartCount} items`}
                    data-testid="nav-cart-link"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="sm:hidden absolute top-1 right-1 w-4 h-4 bg-brand-accent text-white text-[10px] font-heading font-bold rounded-full flex items-center justify-center tabular-nums leading-none">
                        {cartCount}
                      </span>
                    )}
                    <span className="hidden sm:inline text-xs font-heading font-semibold uppercase tracking-wider text-[11px]">
                      Bag ({cartCount})
                    </span>
                  </LinkComp>
                )}
              </div>
            </div>

            {/* Category Navigation Row with Mega Panels (Desktop) */}
            <div className="hidden lg:flex items-center justify-center h-10 border-t border-brand-border/40 px-4">
              <DesktopNav
                items={navItems}
                links={navLinks}
                linkComponent={LinkComp}
                backdropTop={headerBottom}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
