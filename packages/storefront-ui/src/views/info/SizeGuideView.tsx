"use client"

import React, { useState } from "react"
import Link from "next/link"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ShieldCheckIcon } from "../../components/icons"
import { LinkComponent } from "../../types"

type SizeGuideTab = "tees" | "basic-hoodie" | "drop-shoulder-hoodie"

const SIZE_GUIDE_TABS: Array<{ id: SizeGuideTab; label: string }> = [
  { id: "tees", label: "Drop Shoulder Tees" },
  { id: "basic-hoodie", label: "Basic Hoodie" },
  { id: "drop-shoulder-hoodie", label: "Drop Shoulder Hoodie" },
]

export interface SizeGuideViewProps {
  routes?: StoreRoutes
  linkComponent?: LinkComponent
}

export function SizeGuideView({ routes, linkComponent: LinkComp = Link }: SizeGuideViewProps) {
  const [activeTab, setActiveTab] = useState<SizeGuideTab>("tees")
  const [unit, setUnit] = useState<"in" | "cm">("in")

  const round = (val: number) => (unit === "in" ? val : Math.round(val * 2.54))

  return (
    <div className="bg-surface min-h-screen">
      {/* Header Banner */}
      <div className="bg-brand-secondary border-b border-brand-border py-12 sm:py-16">
        <div className="content-container max-w-4xl text-center space-y-3">
          <span className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-accent">
            Fit &amp; Sizing Standard
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-primary">
            AFK THEORY Size &amp; Fit Architecture
          </h1>
          <p className="text-xs sm:text-sm text-brand-primary/70 max-w-xl mx-auto leading-relaxed">
            Our garments feature intentional oversized and drop shoulder streetwear silhouettes, engineered for effortless drape and relaxed daily wear.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content-container max-w-4xl py-14 sm:py-20 space-y-12">
        {/* Tab Selection & Unit Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
          <div className="flex flex-wrap gap-2 sm:gap-4" role="tablist" aria-label="Garments">
            {SIZE_GUIDE_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 text-xs font-heading font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-brand-primary text-brand-primary"
                    : "text-brand-muted hover:text-brand-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-muted">
              Unit:
            </span>
            <div className="flex border border-brand-border text-xs">
              <button
                type="button"
                onClick={() => setUnit("in")}
                className={`px-3 py-1 font-mono uppercase transition-colors ${
                  unit === "in" ? "bg-accent text-on-accent" : "bg-surface text-brand-primary"
                }`}
              >
                Inches
              </button>
              <button
                type="button"
                onClick={() => setUnit("cm")}
                className={`px-3 py-1 font-mono uppercase transition-colors ${
                  unit === "cm" ? "bg-accent text-on-accent" : "bg-surface text-brand-primary"
                }`}
              >
                CM
              </button>
            </div>
          </div>
        </div>

        {/* Tops Table */}
        {activeTab === "tees" && (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-brand-primary">
              Drop Shoulder T-Shirt Sizing ({unit.toUpperCase()})
            </h3>
            <div className="overflow-x-auto border border-brand-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-brand-secondary text-brand-primary font-heading font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Chest (Chest Circumference)</th>
                    <th className="p-3">Length</th>
                    <th className="p-3">Shoulder Drop</th>
                    <th className="p-3">Sleeve Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  <tr>
                    <td className="p-3 font-bold">S</td>
                    <td className="p-3 font-mono">{round(40)}</td>
                    <td className="p-3 font-mono">{round(28)}</td>
                    <td className="p-3 font-mono">{round(20)}</td>
                    <td className="p-3 font-mono">{round(8.5)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">M</td>
                    <td className="p-3 font-mono">{round(42)}</td>
                    <td className="p-3 font-mono">{round(29)}</td>
                    <td className="p-3 font-mono">{round(21)}</td>
                    <td className="p-3 font-mono">{round(9)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">L</td>
                    <td className="p-3 font-mono">{round(44)}</td>
                    <td className="p-3 font-mono">{round(30)}</td>
                    <td className="p-3 font-mono">{round(22)}</td>
                    <td className="p-3 font-mono">{round(9.5)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">XL</td>
                    <td className="p-3 font-mono">{round(46)}</td>
                    <td className="p-3 font-mono">{round(31)}</td>
                    <td className="p-3 font-mono">{round(23)}</td>
                    <td className="p-3 font-mono">{round(10)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">XXL</td>
                    <td className="p-3 font-mono">{round(48)}</td>
                    <td className="p-3 font-mono">{round(32)}</td>
                    <td className="p-3 font-mono">{round(24)}</td>
                    <td className="p-3 font-mono">{round(10.5)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hoodie sizing: measurements are added once the final patterns are confirmed */}
        {(activeTab === "basic-hoodie" || activeTab === "drop-shoulder-hoodie") && (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-brand-primary">
              {activeTab === "basic-hoodie" ? "Basic Hoodie" : "Drop Shoulder Hoodie"} Sizing
            </h3>
            <div className="border border-brand-border bg-brand-secondary p-6 text-xs text-brand-muted leading-relaxed space-y-2">
              <p className="text-brand-primary font-semibold">Measurements for this hoodie are coming soon.</p>
              <p>
                Need help choosing a size now? Message us with your usual size and height and we will
                recommend the right one before you order.
              </p>
            </div>
          </div>
        )}

        {/* Door-to-Door Exchange Reassurance */}
        <div className="p-6 bg-brand-surface border border-brand-border flex items-center gap-4 text-xs">
          <ShieldCheckIcon className="w-8 h-8 text-brand-accent flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-heading font-bold uppercase tracking-wider text-brand-primary text-xs">
              48-Hour Door-to-Door Size Exchange
            </h4>
            <p className="text-brand-muted leading-relaxed">
              Unsure between sizes? Order with confidence. Request a size exchange within 48 hours of delivery, and inside Dhaka our courier brings your new size to your door.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
