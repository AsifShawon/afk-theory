"use client"

import { useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Header as SharedHeader, createStoreNavigation, HeartIcon } from "@dtc/storefront-ui"
import { createMedusaRoutes } from "@adapters/medusa/routes"
import { useWishlist } from "@lib/context/wishlist-context"
import SearchModal from "../search-modal"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import CountrySelect from "../country-select"
import useToggleState from "@lib/hooks/use-toggle-state"

type NavHeaderProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  cartCountNode?: React.ReactNode
}

export default function NavHeader({
  regions,
  locales: _locales,
  currentLocale: _currentLocale,
  cartCountNode,
}: NavHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const countryToggleState = useToggleState()
  const pathname = usePathname()
  const { wishlistCount } = useWishlist()

  const routes = useMemo(() => createMedusaRoutes("bd"), [])
  const navItems = useMemo(() => createStoreNavigation(routes), [routes])

  return (
    <>
      <SharedHeader
        navItems={navItems}
        homeHref="/"
        cartHref="/cart"
        accountHref="/account"
        cartCountNode={cartCountNode}
        announcementText=""
        activePath={pathname}
        onOpenSearch={() => setIsSearchOpen(true)}
        linkComponent={LocalizedClientLink}
        mobileNavBottomSlot={
          regions && regions.length > 0 ? (
            <div className="flex items-center justify-between text-xs text-brand-muted pt-2 border-t border-brand-border/60">
              <span className="font-heading font-bold uppercase tracking-wider">Region:</span>
              <CountrySelect toggleState={countryToggleState} regions={regions} />
            </div>
          ) : null
        }
        headerActionsSlot={
          <div className="flex items-center gap-1 sm:gap-2">
            <LocalizedClientLink
              href="/wishlist"
              className="relative p-2 text-brand-primary hover:bg-brand-primary hover:text-brand-secondary transition-all duration-200 flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label={`Wishlist with ${wishlistCount} saved items`}
              data-testid="nav-wishlist-link"
            >
              <HeartIcon className="w-5 h-5 flex-shrink-0" filled={wishlistCount > 0} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-primary text-brand-accent text-[9px] font-heading font-bold rounded-full flex items-center justify-center tabular-nums leading-none shadow-2xs">
                  {wishlistCount}
                </span>
              )}
            </LocalizedClientLink>
            <div className="hidden sm:flex items-center text-[11px] font-heading font-semibold uppercase tracking-wider text-brand-primary/80 bg-brand-secondary/80 border border-brand-border px-3 py-1 rounded-full">
              <span>🇧🇩 BDT (৳)</span>
            </div>
          </div>
        }
      />

      {/* Global Search Dialog */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
