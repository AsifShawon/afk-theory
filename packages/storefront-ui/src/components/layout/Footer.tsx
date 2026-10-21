"use client"

import React from "react"
import Link from "next/link"
import { BrandLogo } from "./BrandLogo"

import {
  FooterLinkItem,
  DEFAULT_CATEGORIES,
  DEFAULT_COLLECTIONS,
  DEFAULT_CUSTOMER_CARE,
  deduplicateFooterLinks,
} from "./footer-model"

export type { FooterLinkItem }
export {
  DEFAULT_CATEGORIES,
  DEFAULT_COLLECTIONS,
  DEFAULT_CUSTOMER_CARE,
  deduplicateFooterLinks,
}

export interface FooterProps {
  homeHref?: string
  categories?: FooterLinkItem[]
  collections?: FooterLinkItem[]
  customerCareLinks?: FooterLinkItem[]
  policyLinks?: FooterLinkItem[]
  customControlsSlot?: React.ReactNode
  linkComponent?: React.ComponentType<{ href: string; className?: string; children?: React.ReactNode; [key: string]: unknown }>
}

export function Footer({
  homeHref = "/",
  categories = DEFAULT_CATEGORIES,
  collections = DEFAULT_COLLECTIONS,
  customerCareLinks = DEFAULT_CUSTOMER_CARE,
  customControlsSlot,
  linkComponent: LinkComp = Link,
}: FooterProps) {
  const displayCollections = deduplicateFooterLinks(collections)
  const displayCategories = deduplicateFooterLinks(categories)
  const displayCustomerCareLinks = deduplicateFooterLinks(customerCareLinks)

  return (
    <footer className="bg-brand-primary text-brand-secondary border-t border-white/10 w-full mt-auto">
      {/* Upper Reassurance Strip */}
      <div className="border-b border-white/10 py-8 bg-black/40">
        <div className="editorial-container grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="flex flex-col items-center gap-1.5 p-2">
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-white">
              🚚 Express Delivery
            </span>
            <p className="text-[11px] text-brand-sand/80 font-sans">Dhaka 24–48h • Nationwide courier coverage</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2">
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-brand-accent">
              💵 Cash on Delivery
            </span>
            <p className="text-[11px] text-brand-sand/80 font-sans">Pay in cash when delivered to your doorstep</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2">
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-white">
              👕 Drop Shoulder Silhouette
            </span>
            <p className="text-[11px] text-brand-sand/80 font-sans">Oversized street cuts &amp; dense pre-shrunk cotton</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2">
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-white">
              ⚡ Offline By Choice
            </span>
            <p className="text-[11px] text-brand-sand/80 font-sans">Modern streetwear engineered for Bangladesh</p>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer */}
      <div className="editorial-container py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Column 1: Brand & Craftsmanship */}
          <div className="lg:col-span-5 space-y-4">
            <LinkComp href={homeHref} className="inline-block group py-1" aria-label="AFK THEORY Home">
              <BrandLogo variant="horizontal-light" alt="AFK THEORY" className="h-8 sm:h-9 w-auto" />
              <span className="text-[9px] uppercase font-heading tracking-[0.22em] text-brand-accent font-bold mt-2 block">
                PAUSE THE GAME. KEEP YOUR STYLE.
              </span>
            </LinkComp>
            <p className="text-xs text-brand-sand/80 leading-relaxed max-w-sm font-sans">
              Modern, independent, premium-accessible streetwear engineered in Bangladesh. Offline by choice. Built for individuals who demand bold design, oversized silhouettes, and distinct identity.
            </p>
            <div className="space-y-1 text-xs text-brand-sand/70 pt-2 font-sans">
              <p>📍 Dhaka, Bangladesh</p>
              <p>
                ✉️ Customer Support:{" "}
                <a href="mailto:support@afktheory.com" className="text-white hover:text-brand-accent transition-colors">
                  support@afktheory.com
                </a>
              </p>
            </div>

            {customControlsSlot && <div className="pt-2">{customControlsSlot}</div>}
          </div>

          {/* Column 2: Collections */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-heading text-xs font-bold tracking-widest uppercase text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-brand-sand/80 font-sans">
              {displayCollections.map((col) => (
                <li key={col.href}>
                  <LinkComp href={col.href} className="hover:text-white transition-colors">
                    {col.label}
                  </LinkComp>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Departments */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-heading text-xs font-bold tracking-widest uppercase text-white">
              Departments
            </h4>
            <ul className="space-y-2 text-xs text-brand-sand/80 font-sans">
              {displayCategories.map((cat) => (
                <li key={cat.href}>
                  <LinkComp href={cat.href} className="hover:text-white transition-colors">
                    {cat.label}
                  </LinkComp>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Customer Care & Legal */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-heading text-xs font-bold tracking-widest uppercase text-white">
              Client Care &amp; Support
            </h4>
            <ul className="space-y-2 text-xs text-brand-sand/80 font-sans">
              {displayCustomerCareLinks.map((item) => (
                <li key={item.href}>
                  <LinkComp href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </LinkComp>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Payment Badges & Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-brand-sand/70 font-sans">
          <p>© {new Date().getFullYear()} AFK THEORY. Away From Keyboard — All rights reserved.</p>

          {/* Payment Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-wider">
            <span className="px-2.5 py-1 bg-brand-accent text-brand-primary">
              Cash on Delivery (COD)
            </span>
            <span className="px-2.5 py-1 bg-white/10 text-white/80 border border-white/15">
              Pay Upon Delivery
            </span>
            <span className="px-2.5 py-1 bg-white/10 text-white/80 border border-white/15">
              BDT (৳)
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
