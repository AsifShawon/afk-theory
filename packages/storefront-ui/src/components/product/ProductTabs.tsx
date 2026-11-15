"use client"

import React, { useId, useState } from "react"
import clsx from "clsx"
import { BANGLADESH_SHIPPING_RATES, formatBDT } from "@dtc/commerce-contracts"
import { ChevronDownIcon } from "../icons"

export interface ProductTabsProps {
  description?: string
  material?: string
  metadata?: Record<string, string | number | boolean | null>
}

const DEFAULT_CARE_INSTRUCTIONS =
  "Machine wash cold inside out with like colors. Do not bleach. Dry flat in shade. Cool iron on reverse."

interface ProductTab {
  title: string
  content: React.ReactNode
}

export function ProductTabs({
  description,
  material,
  metadata,
}: ProductTabsProps) {
  const [openTab, setOpenTab] = useState<number | null>(0)
  const idPrefix = useId()

  const fit = metadata?.fit ? String(metadata.fit) : undefined
  const origin = metadata?.origin ? String(metadata.origin) : undefined
  const careInstructions = metadata?.care_instructions
    ? String(metadata.care_instructions)
    : DEFAULT_CARE_INSTRUCTIONS

  const tabs: ProductTab[] = []

  // Only show product-specific copy that actually exists; never invent details.
  if (description || fit) {
    tabs.push({
      title: "Description & Fit",
      content: (
        <div className="space-y-3 text-xs text-brand-muted leading-relaxed">
          {description && <p>{description}</p>}
          {fit && (
            <p>
              <strong>Fit:</strong> {fit}
            </p>
          )}
        </div>
      ),
    })
  }

  tabs.push({
    title: "Fabric & Care",
    content: (
      <div className="space-y-3 text-xs text-brand-muted leading-relaxed">
        {material && (
          <p>
            <strong>Composition:</strong> {material}
          </p>
        )}
        <p>
          <strong>Care Instructions:</strong> {careInstructions}
        </p>
        {origin && (
          <p>
            <strong>Manufacturing Origin:</strong> {origin}
          </p>
        )}
      </div>
    ),
  })

  tabs.push({
    title: "Delivery & Exchanges",
    content: (
      <div className="space-y-3 text-xs text-brand-muted leading-relaxed">
        {Object.values(BANGLADESH_SHIPPING_RATES).map((zone) => (
          <p key={zone.zone}>
            <strong>{zone.name}:</strong> {zone.estimatedDays} for{" "}
            {formatBDT(zone.rateBdt)}.
          </p>
        ))}
        <p>
          <strong>Payment:</strong> Cash on Delivery across Bangladesh.
        </p>
        <p>
          <strong>Size Exchange:</strong> Not the right fit? See our Return &amp;
          Exchange policy for the current exchange terms.
        </p>
      </div>
    ),
  })

  const toggleTab = (idx: number) => {
    setOpenTab(openTab === idx ? null : idx)
  }

  return (
    <div className="border-t border-brand-border divide-y divide-brand-border">
      {tabs.map((tab, idx) => {
        const isOpen = openTab === idx
        const buttonId = `${idPrefix}-tab-${idx}`
        const panelId = `${idPrefix}-panel-${idx}`
        return (
          <div key={tab.title} className="py-3">
            <button
              type="button"
              id={buttonId}
              onClick={() => toggleTab(idx)}
              className="w-full flex items-center justify-between py-2 text-left text-xs font-heading font-semibold uppercase tracking-wider text-brand-primary hover:text-brand-accent transition-colors"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span>{tab.title}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-brand-muted transition-transform duration-300 ease-out ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {/* The panel stays mounted so its height can animate; closed panels are inert. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={clsx(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pt-2 pb-3">{tab.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
