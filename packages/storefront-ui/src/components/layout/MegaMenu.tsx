"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import clsx from "clsx"
import { MegaNavItem } from "./navigation-model"
import { LinkComponent } from "../../types"
import { ArrowRightIcon } from "../icons"

export interface MegaMenuProps {
  item: MegaNavItem
  isOpen: boolean
  onClose: (options?: { restoreFocus?: boolean }) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  linkComponent?: LinkComponent
  className?: string
}

export function MegaMenu({
  item,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
  linkComponent: LinkComp = Link,
  className,
}: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose({ restoreFocus: true })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      id={`mega-menu-panel-${item.id}`}
      role="region"
      aria-label={`${item.label} navigation menu`}
      ref={panelRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={clsx(
        "absolute top-[calc(100%+8px)] left-0 right-0 z-40 bg-[#F5F3ED] rounded-2xl border border-brand-border/80 shadow-[0_20px_50px_rgba(32,36,31,0.12),0_6px_16px_rgba(32,36,31,0.06)] animate-mega-enter before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] overflow-hidden max-h-[calc(100vh-140px)] overflow-y-auto",
        className
      )}
    >
      <div className="w-full px-6 py-6 lg:px-8 lg:py-7">
        <div className="grid grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">
          {/* Column 1: Featured Links */}
          <div className="col-span-3 space-y-3.5 border-r border-brand-border/60 pr-5 lg:pr-6">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-brand-primary/60 block pb-1 border-b border-brand-border/40">
              Featured Highlights
            </span>
            <ul className="space-y-1">
              {item.featuredLinks.map((link, idx) => (
                <li key={`${item.id}-feat-${idx}-${link.label}`}>
                  <LinkComp
                    href={link.href}
                    onClick={() => onClose()}
                    className="group flex items-center justify-between px-2.5 py-1.5 -mx-2 rounded-md text-xs font-heading font-semibold text-brand-primary hover:bg-brand-stone/60 transition-colors"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-accent text-brand-primary">
                        {link.badge}
                      </span>
                    )}
                  </LinkComp>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-brand-border/40">
              <LinkComp
                href={item.shopAllHref}
                onClick={() => onClose()}
                className="group inline-flex items-center gap-2 text-xs font-heading font-bold text-brand-primary hover:text-black uppercase tracking-wider"
              >
                <span>{item.shopAllLabel || `Shop All ${item.label}`}</span>
                <span className="w-5 h-5 rounded-full bg-brand-primary text-brand-secondary group-hover:bg-brand-accent group-hover:text-brand-primary flex items-center justify-center transition-colors">
                  <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </LinkComp>
            </div>
          </div>

          {/* Column 2 & 3: Category Groups */}
          <div className="col-span-5 grid grid-cols-2 gap-6 lg:gap-8">
            {item.categoryGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-brand-primary/60 block pb-1 border-b border-brand-border/40">
                  {group.title}
                </span>
                <ul className="space-y-0.5">
                  {group.links.map((link, idx) => (
                    <li key={`${item.id}-${group.title}-${idx}-${link.label}`}>
                      <LinkComp
                        href={link.href}
                        onClick={() => onClose()}
                        className="block px-2.5 py-1.5 -mx-2.5 rounded-md text-xs font-medium text-brand-primary/85 hover:text-brand-primary hover:bg-brand-stone/60 transition-colors"
                      >
                        {link.label}
                      </LinkComp>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Column 4: Editorial Showcase Card */}
          <div className="col-span-4">
            {item.editorialCards.slice(0, 1).map((card, idx) => (
              <div
                key={`${item.id}-card-${idx}-${card.title}`}
                className="group relative overflow-hidden rounded-xl border border-brand-border/70 aspect-[16/10] bg-brand-surface shadow-subtle hover:shadow-editorial transition-all duration-300 flex flex-col justify-end p-5"
              >
                <Image
                  src={card.image}
                  alt={card.imageAlt || card.title}
                  fill
                  sizes="360px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

                <div className="relative z-10 space-y-1.5 text-white">
                  <span className="text-[9px] font-heading font-bold uppercase tracking-widest text-brand-accent">
                    Curated Spotlight
                  </span>
                  <h4 className="font-display text-base text-white font-normal leading-snug line-clamp-1">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                  <div className="pt-1.5">
                    <LinkComp
                      href={card.href}
                      onClick={() => onClose()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-brand-primary text-xs font-heading font-bold uppercase tracking-wider hover:bg-brand-accent hover:text-brand-primary transition-colors"
                    >
                      <span>{card.ctaText}</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </LinkComp>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
