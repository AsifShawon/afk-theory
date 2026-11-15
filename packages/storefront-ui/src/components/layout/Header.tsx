"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import clsx from "clsx"
import { BarsThreeIcon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon } from "../icons"
import { DesktopNav, NavLinkItem } from "./DesktopNav"
import { MegaNavItem } from "./navigation-model"
import { BrandLogo } from "./BrandLogo"
import { MobileNavDrawer } from "./MobileNavDrawer"
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
  isMobileMenuOpen?: boolean
  onOpenMobileMenu?: () => void
  onCloseMobileMenu?: () => void
  mobileMenuSlot?: React.ReactNode
  mobileNavBottomSlot?: React.ReactNode
  headerActionsSlot?: React.ReactNode
  announcementText?: string
  secondaryLinks?: Array<{ label: string; href: string }>
  linkComponent?: LinkComponent
  activePath?: string
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
  isMobileMenuOpen: isMobileMenuOpenProp,
  onOpenMobileMenu,
  onCloseMobileMenu,
  mobileMenuSlot,
  mobileNavBottomSlot,
  headerActionsSlot,
  announcementText,
  secondaryLinks = [
    { label: "About The Theory", href: "/about" },
    { label: "Customer Care", href: "/contact" },
  ],
  linkComponent: LinkComp = Link,
  activePath,
}: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const isScrolledRef = useRef<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const [headerBottom, setHeaderBottom] = useState<number>(110)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState<boolean>(false)
  const isMenuOpen = isMobileMenuOpenProp !== undefined ? isMobileMenuOpenProp : internalMobileMenuOpen

  const handleOpenMobileMenu = useCallback(() => {
    setActiveMenuId(null)
    setInternalMobileMenuOpen(true)
    onOpenMobileMenu?.()
  }, [onOpenMobileMenu])

  const handleCloseMobileMenu = useCallback(() => {
    setInternalMobileMenuOpen(false)
    onCloseMobileMenu?.()
  }, [onCloseMobileMenu])

  const handleSearchClick = useCallback(() => {
    setActiveMenuId(null)
    onOpenSearch?.()
  }, [onOpenSearch])

  const updateHeaderMetrics = useCallback(() => {
    if (headerRef.current) {
      setHeaderBottom(headerRef.current.getBoundingClientRect().bottom)
    }

    const currentScrollY = typeof window !== "undefined" ? window.scrollY : 0
    const wasScrolled = isScrolledRef.current

    // Hysteresis threshold: enter floating mode at > 90px, exit at < 40px
    if (!wasScrolled && currentScrollY > 90) {
      isScrolledRef.current = true
      setIsScrolled(true)
    } else if (wasScrolled && currentScrollY < 40) {
      isScrolledRef.current = false
      setIsScrolled(false)
    }
  }, [])

  useEffect(() => {
    let ticking = false
    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateHeaderMetrics()
          ticking = false
        })
        ticking = true
      }
    }

    // Check initial scroll on mount (e.g. reload when already scrolled down)
    updateHeaderMetrics()

    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [updateHeaderMetrics])

  // Close mega menu when active route changes
  useEffect(() => {
    setActiveMenuId(null)
  }, [activePath])

  return (
    <>
      {/* 1. Optional Editorial Announcement Bar in normal page flow */}
      {announcementText && (
        <aside
          aria-label="Editorial Announcement"
          className="bg-brand-primary text-brand-secondary text-[11px] font-heading font-medium tracking-wide py-1.5 px-4 text-center border-b border-brand-primary/20 w-full"
        >
          <div className="content-container flex items-center justify-center gap-2">
            <span>{announcementText}</span>
          </div>
        </aside>
      )}

      {/* 2. Responsive Adaptive Header Shell: Full-Width at Top, Floating Island on Scroll */}
      <header
        ref={headerRef}
        data-state={isScrolled ? "floating" : "full-width"}
        className={clsx(
          "sticky top-0 z-40 w-full transition-all duration-300 ease-out",
          isScrolled
            ? "pointer-events-none pt-2 sm:pt-3 lg:pt-3.5 px-3 sm:px-4 lg:px-6"
            : "pointer-events-auto pt-0 px-0"
        )}
      >
        <div
          className={clsx(
            "w-full transition-all duration-300 ease-out",
            isScrolled ? "max-w-[1380px] mx-auto" : "max-w-none"
          )}
        >
          {/* Surface Island Card */}
          <div
            className={clsx(
              "relative transition-all duration-300 ease-out pointer-events-auto",
              isScrolled
                ? "rounded-2xl border border-brand-border/80 bg-brand-secondary/95 backdrop-blur-md shadow-[0_12px_36px_-6px_rgba(32,36,31,0.08),0_4px_12px_-2px_rgba(32,36,31,0.04)]"
                : "rounded-none border-x-0 border-t-0 border-b border-brand-border/60 bg-brand-secondary shadow-none"
            )}
          >
            {/* Primary Row: Mobile toggle, Secondary desktop links, Brand wordmark, Actions */}
            <div
              className={clsx(
                "w-full transition-all duration-300 ease-out",
                isScrolled
                  ? "px-3 sm:px-5 lg:px-6"
                  : "max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8"
              )}
            >
              <div
                className={clsx(
                  "flex items-center justify-between transition-all duration-300 ease-out",
                  isScrolled ? "h-13 sm:h-14" : "h-16 sm:h-18"
                )}
              >
                {/* Left Column: Mobile Menu Trigger & Secondary Desktop Links */}
                <div className="flex items-center gap-x-4 flex-1 basis-0">
                  {mobileMenuSlot ? (
                    <div className="lg:hidden">{mobileMenuSlot}</div>
                  ) : (
                    <div className="lg:hidden">
                      <button
                        type="button"
                        onClick={handleOpenMobileMenu}
                        className="p-2 -ml-2 text-brand-primary hover:bg-brand-primary hover:text-brand-secondary transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
                        aria-label="Open navigation menu"
                      >
                        <BarsThreeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  )}

                  {/* Secondary Desktop Utility Links */}
                  <nav className="hidden lg:flex items-center gap-3 text-xs font-heading font-medium text-brand-primary/80">
                    {secondaryLinks.map((link) => (
                      <LinkComp
                        key={link.href}
                        href={link.href}
                        className="hover:text-brand-primary hover:bg-brand-stone/50 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {link.label}
                      </LinkComp>
                    ))}
                  </nav>
                </div>

                {/* Center Column: Official Responsive AFK THEORY Brand Logo */}
                <div className="flex flex-col items-center justify-center px-2">
                  <LinkComp
                    href={homeHref}
                    className="flex items-center group py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-lg"
                    data-testid="nav-store-link"
                    aria-label="AFK THEORY Home"
                  >
                    <BrandLogo variant="responsive" priority alt="AFK THEORY" />
                  </LinkComp>
                </div>

                {/* Right Column: Actions (Search, Currency Slot, Account, Bag) */}
                <div className="flex items-center justify-end gap-x-1 sm:gap-x-2 flex-1 basis-0">
                  {/* Search Trigger */}
                  {onOpenSearch && (
                    <button
                      type="button"
                      onClick={handleSearchClick}
                      className="flex items-center gap-1.5 text-xs font-heading font-medium text-brand-primary hover:bg-brand-primary hover:text-brand-secondary px-2.5 py-1.5 transition-all duration-200 rounded-lg min-h-[44px] min-w-[44px] sm:min-w-0 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label="Search catalog"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Search</span>
                    </button>
                  )}

                  {/* Provider-specific Slot (e.g. Currency badge) */}
                  {headerActionsSlot}

                  {/* Account Link */}
                  <LinkComp
                    href={accountHref}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-heading font-medium uppercase tracking-wider text-brand-primary hover:bg-brand-primary hover:text-brand-secondary px-2.5 py-1.5 transition-all duration-200 rounded-lg min-h-[44px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    data-testid="nav-account-link"
                    aria-label="Customer Account"
                  >
                    <UserIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden md:inline text-[11px]">Account</span>
                  </LinkComp>

                  {/* Cart Trigger */}
                  {cartCountNode ? (
                    cartCountNode
                  ) : onCartClick ? (
                    <button
                      type="button"
                      onClick={onCartClick}
                      className="relative px-2.5 py-1.5 text-brand-primary hover:bg-brand-primary hover:text-brand-secondary transition-all duration-200 flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label={`Shopping bag with ${cartCount} items`}
                      data-testid="nav-cart-link"
                    >
                      <ShoppingBagIcon className="w-5 h-5 flex-shrink-0" />
                      {cartCount > 0 && (
                        <span className="sm:hidden absolute top-1 right-1 w-4 h-4 bg-brand-accent text-brand-primary text-[10px] font-heading font-bold rounded-full flex items-center justify-center tabular-nums leading-none">
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
                      className="relative px-2.5 py-1.5 text-brand-primary hover:bg-brand-primary hover:text-brand-secondary transition-all duration-200 flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label={`Shopping bag with ${cartCount} items`}
                      data-testid="nav-cart-link"
                    >
                      <ShoppingBagIcon className="w-5 h-5 flex-shrink-0" />
                      {cartCount > 0 && (
                        <span className="sm:hidden absolute top-1 right-1 w-4 h-4 bg-brand-accent text-brand-primary text-[10px] font-heading font-bold rounded-full flex items-center justify-center tabular-nums leading-none">
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
            </div>

            {/* Category Navigation Row with Mega Panels (Desktop) */}
            <div
              className={clsx(
                "hidden lg:flex items-center justify-center border-t border-brand-border/40 transition-all duration-300 ease-out",
                isScrolled
                  ? "h-9 sm:h-10 px-4"
                  : "h-11 sm:h-12 max-w-[1440px] mx-auto px-6"
              )}
            >
              <DesktopNav
                items={navItems}
                links={navLinks}
                linkComponent={LinkComp}
                activeMenuId={activeMenuId}
                onMenuChange={setActiveMenuId}
                backdropTop={headerBottom}
                currentPath={activePath}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Reusable Mobile Navigation Drawer (Portalled to document.body) */}
      {!mobileMenuSlot && (
        <MobileNavDrawer
          isOpen={isMenuOpen}
          onClose={handleCloseMobileMenu}
          items={navItems}
          links={navLinks}
          onOpenSearch={onOpenSearch}
          cartCount={cartCount}
          cartHref={cartHref}
          accountHref={accountHref}
          bottomSlot={mobileNavBottomSlot}
          linkComponent={LinkComp}
        />
      )}
    </>
  )
}
