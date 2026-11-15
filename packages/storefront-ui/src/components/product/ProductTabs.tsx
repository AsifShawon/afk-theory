"use client"

import React, { useState, useMemo } from "react"
import { ChevronDownIcon } from "../icons"
import { RichDescription } from "./RichDescription"

export interface ProductTabsProps {
  description?: string
  material?: string
  metadata?: Record<string, string | number | boolean | null>
  richDescription?: string
  fabricTabTitle?: string
  fabricMaterial?: string
  fabricOrigin?: string
  fabricCareInstructions?: string
  fabricCustomContent?: string
}

export function ProductTabs({
  description,
  material,
  metadata,
  richDescription,
  fabricTabTitle: propFabricTabTitle,
  fabricMaterial: propFabricMaterial,
  fabricOrigin: propFabricOrigin,
  fabricCareInstructions: propFabricCareInstructions,
  fabricCustomContent: propFabricCustomContent,
}: ProductTabsProps) {
  const [openTab, setOpenTab] = useState<number | null>(0)

  const activeDescriptionContent =
    (metadata?.rich_description as string) || richDescription || description

  // Fully customizable Fabric & Care Tab Title (default: "Fabric Engineering & Care")
  const resolvedFabricTabTitle =
    propFabricTabTitle ||
    (metadata?.fabric_tab_title as string) ||
    (metadata?.care_tab_title as string) ||
    "Fabric Engineering & Care"

  // Optional full rich HTML/markdown override for the entire fabric tab
  const resolvedCustomFabricContent =
    propFabricCustomContent ||
    (metadata?.fabric_custom_content as string) ||
    (metadata?.fabric_rich_description as string) ||
    (metadata?.fabric_tab_content as string)

  // Customizable Material Composition
  const resolvedMaterial =
    propFabricMaterial ||
    (metadata?.fabric_material as string) ||
    (metadata?.material as string) ||
    material ||
    "240 GSM Combed Compact Cotton"

  const materialLabel =
    (metadata?.material_label as string) || "Material Composition"

  // Customizable Manufacturing Origin
  const resolvedOrigin =
    propFabricOrigin ||
    (metadata?.fabric_origin as string) ||
    (metadata?.origin as string) ||
    "Dhaka, Bangladesh"

  const originLabel =
    (metadata?.origin_label as string) || "Manufacturing Origin"

  // Customizable Care / Protocol Section Title
  const careSectionTitle =
    (metadata?.care_title as string) ||
    (metadata?.protocol_title as string) ||
    "Garment Maintenance Protocol"

  // Customizable Care Instructions
  const rawCareInstructions =
    propFabricCareInstructions ||
    (metadata?.fabric_care_instructions as string) ||
    (metadata?.care_instructions as string) ||
    (metadata?.care as string)

  const careLines = useMemo(() => {
    if (rawCareInstructions && rawCareInstructions.trim()) {
      return rawCareInstructions
        .split(/\r?\n|•/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }
    return [
      "Wash: Machine wash cold (30°C) inside-out with like dark colors.",
      "Dry: Line dry in shade; do not tumble dry to preserve fabric density.",
      "Iron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints.",
    ]
  }, [rawCareInstructions])

  const tabs = [
    {
      title: "Description & Silhouette",
      content: (
        <div className="space-y-4">
          <RichDescription content={activeDescriptionContent} />
          {metadata?.fit && (
            <p className="text-xs text-brand-muted pt-2 border-t border-brand-border/40">
              <strong className="text-brand-primary">Fit:</strong> {String(metadata.fit)}
            </p>
          )}
        </div>
      ),
    },
    {
      title: resolvedFabricTabTitle,
      content: resolvedCustomFabricContent ? (
        <div className="space-y-4">
          <RichDescription content={resolvedCustomFabricContent} />
        </div>
      ) : (
        <div className="space-y-3.5 text-xs text-brand-muted leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-brand-surface border border-brand-border/70 flex flex-col gap-0.5">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                {materialLabel}
              </span>
              <span className="text-xs font-semibold text-brand-primary">
                {resolvedMaterial}
              </span>
            </div>
            <div className="p-2.5 rounded bg-brand-surface border border-brand-border/70 flex flex-col gap-0.5">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                {originLabel}
              </span>
              <span className="text-xs font-semibold text-brand-primary">
                {resolvedOrigin}
              </span>
            </div>
          </div>
          <div className="p-3 rounded bg-brand-surface border border-brand-border/70 space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted block">
              {careSectionTitle}
            </span>
            <ul className="space-y-1.5 pl-0 list-none text-xs text-brand-primary/85">
              {careLines.map((line, lIdx) => {
                const colonIdx = line.indexOf(":")
                const hasLabel = colonIdx > 0 && colonIdx < 25
                if (hasLabel) {
                  const label = line.slice(0, colonIdx).trim()
                  const rest = line.slice(colonIdx + 1).trim()
                  return (
                    <li key={lIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                      <span>
                        <strong>{label}:</strong> {rest}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Dhaka Delivery & 24h Size Swap",
      content: (
        <div className="space-y-3 text-xs text-brand-muted leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-brand-surface border border-brand-border/70 flex flex-col gap-0.5">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                Inside Dhaka
              </span>
              <span className="text-xs font-semibold text-brand-primary">
                24–48 Hours (৳60 / Free over ৳2,000)
              </span>
            </div>
            <div className="p-2.5 rounded bg-brand-surface border border-brand-border/70 flex flex-col gap-0.5">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                Nationwide Courier
              </span>
              <span className="text-xs font-semibold text-brand-primary">
                3–5 Business Days (৳120)
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#F5F3ED] border border-brand-border border-l-4 border-l-brand-primary">
            <strong className="text-[10px] font-heading font-bold uppercase tracking-widest text-brand-primary block mb-0.5">
              Door-to-Door Size Swap Guarantee
            </strong>
            <p className="text-xs text-brand-primary/80 m-0">
              If the fit isn't exact, exchange your size within 24 hours of delivery inside Dhaka at no additional transit fee.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const toggleTab = (idx: number) => {
    setOpenTab(openTab === idx ? null : idx)
  }

  return (
    <div className="border-t border-brand-border divide-y divide-brand-border">
      {tabs.map((tab, idx) => {
        const isOpen = openTab === idx
        return (
          <div key={tab.title} className="py-3">
            <button
              type="button"
              onClick={() => toggleTab(idx)}
              className="w-full flex items-center justify-between py-2 text-left text-xs font-heading font-semibold uppercase tracking-wider text-brand-primary hover:text-brand-accent transition-colors"
              aria-expanded={isOpen}
            >
              <span>{tab.title}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-brand-muted transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && <div className="pt-2 pb-3 animate-enter">{tab.content}</div>}
          </div>
        )
      })}
    </div>
  )
}
