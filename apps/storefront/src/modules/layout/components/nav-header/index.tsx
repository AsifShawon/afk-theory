"use client"

import { useState, useMemo } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Header as SharedHeader, createStoreNavigation } from "@dtc/storefront-ui"
import { createMedusaRoutes } from "@adapters/medusa/routes"
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
          <div className="hidden sm:flex items-center text-[11px] font-heading font-semibold uppercase tracking-wider text-brand-primary/80 bg-brand-secondary/80 border border-brand-border px-3 py-1 rounded-full">
            <span>🇧🇩 BDT (৳)</span>
          </div>
        }
      />

      {/* Global Search Dialog */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
