"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import clsx from "clsx"
import { MegaNavItem, isNavItemActive } from "./navigation-model"
import { MegaMenu } from "./MegaMenu"
import { LinkComponent } from "../../types"

export interface NavLinkItem {
  label: string
  href: string
  isActive?: boolean
}

export interface DesktopNavProps {
  items?: MegaNavItem[]
  links?: NavLinkItem[]
  linkComponent?: LinkComponent
  activeMenuId?: string | null
  onMenuChange?: (id: string | null) => void
  backdropTop?: number
  currentPath?: string
  panelClassName?: string
}

export function DesktopNav({
  items,
  links,
  linkComponent: LinkComp = Link,
  activeMenuId: controlledActiveId,
  onMenuChange,
  backdropTop,
  currentPath,
  panelClassName,
}: DesktopNavProps) {
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null)
  const isControlled = controlledActiveId !== undefined
  const activeId = isControlled ? controlledActiveId : internalActiveId

  const setActiveId = useCallback(
    (id: string | null) => {
      if (!isControlled) {
        setInternalActiveId(id)
      }
      onMenuChange?.(id)
    },
    [isControlled, onMenuChange]
  )

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleTriggerMouseEnter = (id: string) => {
    // Cancel any pending close
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (activeId === id) return

    // If another menu is already open, switch quickly with short 60ms delay
    if (activeId !== null) {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current)
        openTimerRef.current = null
      }
      openTimerRef.current = setTimeout(() => {
        setActiveId(id)
        openTimerRef.current = null
      }, 60)
      return
    }

    // Idle navigation: deliberate 300ms hover-intent delay
    if (openTimerRef.current) clearTimeout(openTimerRef.current)
    openTimerRef.current = setTimeout(() => {
      setActiveId(id)
      openTimerRef.current = null
    }, 300)
  }

  const handleTriggerMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }

    // 320ms close grace period for diagonal pointer movement into the panel
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setActiveId(null)
      closeTimerRef.current = null
    }, 320)
  }

  const handlePanelMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handlePanelMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setActiveId(null)
      closeTimerRef.current = null
    }, 320)
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent, item: MegaNavItem, idx: number, allItems: MegaNavItem[]) => {
    if (e.key === "Enter") {
      // Normal link navigation happens naturally
      return
    }

    if (e.key === " " || e.key === "ArrowDown") {
      e.preventDefault()
      if (activeId === item.id) {
        // Move focus into the first link in active panel
        const panel = document.getElementById(`mega-menu-panel-${item.id}`)
        const firstLink = panel?.querySelector<HTMLAnchorElement>("a")
        firstLink?.focus()
      } else {
        setActiveId(item.id)
        // Defer focus into panel
        setTimeout(() => {
          const panel = document.getElementById(`mega-menu-panel-${item.id}`)
          const firstLink = panel?.querySelector<HTMLAnchorElement>("a")
          firstLink?.focus()
        }, 50)
      }
    } else if (e.key === "Escape") {
      if (activeId === item.id) {
        e.preventDefault()
        setActiveId(null)
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      const nextItem = allItems[(idx + 1) % allItems.length]
      if (nextItem) {
        triggerRefs.current[nextItem.id]?.focus()
        if (activeId !== null) {
          setActiveId(nextItem.id)
        }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      const prevItem = allItems[(idx - 1 + allItems.length) % allItems.length]
      if (prevItem) {
        triggerRefs.current[prevItem.id]?.focus()
        if (activeId !== null) {
          setActiveId(prevItem.id)
        }
      }
    }
  }

  const handleClosePanel = (options?: { restoreFocus?: boolean }) => {
    const currentActive = activeId
    setActiveId(null)
    if (options?.restoreFocus && currentActive) {
      triggerRefs.current[currentActive]?.focus()
    }
  }

  // If items are provided, render full mega-navigation
  if (items && items.length > 0) {
    const activeItem = items.find((i) => i.id === activeId)

    return (
      <div className="relative w-full flex items-center justify-center">
        <nav
          aria-label="Main category navigation"
          className="flex items-center justify-center gap-x-1 sm:gap-x-2 text-xs font-heading uppercase tracking-wider"
        >
          {items.map((item, idx) => {
            const isMenuOpen = activeId === item.id
            const isActive = isNavItemActive(item, currentPath)

            return (
              <div
                key={item.id}
                className="relative flex items-center"
                onMouseEnter={() => handleTriggerMouseEnter(item.id)}
                onMouseLeave={handleTriggerMouseLeave}
              >
                <LinkComp
                  ref={(el: HTMLAnchorElement | null) => {
                    triggerRefs.current[item.id] = el
                  }}
                  href={item.href}
                  onKeyDown={(e: React.KeyboardEvent) => handleTriggerKeyDown(e, item, idx, items)}
                  aria-expanded={isMenuOpen}
                  aria-controls={`mega-menu-panel-${item.id}`}
                  aria-haspopup="true"
                  className={clsx(
                    "flex items-center px-3.5 py-1.5 rounded-lg text-xs font-heading font-medium tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                    isMenuOpen
                      ? "bg-brand-primary text-brand-secondary shadow-sm"
                      : "text-brand-primary bg-transparent hover:bg-brand-primary hover:text-brand-secondary"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive && !isMenuOpen && (
                    <span
                      aria-label="Current category"
                      className="w-1.5 h-1.5 rounded-full bg-brand-accent ml-1.5 inline-block flex-shrink-0"
                    />
                  )}
                </LinkComp>
              </div>
            )
          })}
        </nav>

        {/* Backdrop for open panel - starts below header to never overlap navbar links */}
        {activeId && (
          <div
            className="fixed inset-x-0 bottom-0 bg-black/40 backdrop-blur-2xs z-30 transition-opacity duration-200"
            style={{ top: backdropTop ? `${backdropTop}px` : "160px" }}
            onClick={() => handleClosePanel()}
            aria-hidden="true"
          />
        )}

        {/* Active Mega Panel */}
        {activeItem && (
          <MegaMenu
            item={activeItem}
            isOpen={Boolean(activeId)}
            onClose={handleClosePanel}
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
            linkComponent={LinkComp}
            className={panelClassName}
          />
        )}
      </div>
    )
  }

  // Backward-compatible fallback if only flat `links` provided
  const navLinks = links || []
  return (
    <nav className="flex items-center justify-center gap-x-2 text-xs font-heading uppercase tracking-wider text-brand-primary">
      {navLinks.map((link, idx) => (
        <LinkComp
          key={`${link.label}-${link.href}-${idx}`}
          href={link.href}
          className={clsx(
            "flex items-center px-3.5 py-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
            link.isActive
              ? "bg-brand-primary text-brand-secondary font-semibold"
              : "text-brand-primary bg-transparent hover:bg-brand-primary hover:text-brand-secondary"
          )}
        >
          <span>{link.label}</span>
        </LinkComp>
      ))}
    </nav>
  )
}
