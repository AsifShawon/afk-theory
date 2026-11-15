import React from "react"
import { BadgeCheckIcon, ShieldCheckIcon, TruckIcon, SparklesIcon } from "../icons"

export function DeliveryGuaranteesSection() {
  const guarantees = [
    {
      icon: BadgeCheckIcon,
      title: "Cash on Delivery",
      subtitle: "Across Bangladesh",
      description: "Inspect your package upon arrival. Pay cash or bKash/Nagad at your doorstep.",
    },
    {
      icon: TruckIcon,
      title: "Express Dhaka Delivery",
      subtitle: "24–48 Hours",
      description: "Priority dispatch from Tejgaon hub with real-time courier tracking.",
    },
    {
      icon: SparklesIcon,
      title: "Nationwide Coverage",
      subtitle: "3–5 Days",
      description: "Reliable doorstep delivery reaching all 64 districts across Bangladesh.",
    },
    {
      icon: ShieldCheckIcon,
      title: "7-Day Size Exchange",
      subtitle: "Hassle-Free Swaps",
      description: "Need a different fit? Fast, frictionless size replacements at your door.",
    },
  ]

  return (
    <section className="bg-brand-secondary border-b border-brand-border/80 py-10 sm:py-14">
      <div className="editorial-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {guarantees.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="flex items-start gap-4 p-5 bg-white border border-brand-border/80 hover:border-brand-primary/40 transition-colors shadow-xs"
              >
                <div className="w-10 h-10 bg-brand-primary text-brand-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-accent" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-heading font-extrabold text-xs sm:text-sm text-brand-primary uppercase tracking-wider truncate">
                      {item.title}
                    </h4>
                  </div>
                  <span className="block text-[10px] font-heading font-bold uppercase tracking-widest text-brand-muted">
                    {item.subtitle}
                  </span>
                  <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
