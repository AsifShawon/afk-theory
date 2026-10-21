import React from "react"

interface BrandValue {
  number: string
  title: string
  description: string
}

export function BrandValuesGrid() {
  const pillars: BrandValue[] = [
    {
      number: "01",
      title: "Offline By Choice",
      description:
        "Designed for moments away from the monitor. Streetwear that grounds you in physical reality with confident, unforced presence.",
    },
    {
      number: "02",
      title: "Engineered Drop Shoulder Fits",
      description:
        "Calibrated shoulder drop, wide chest measurements, and elbow-length sleeves designed to hold their boxy drape after every wash.",
    },
    {
      number: "03",
      title: "Dense Compact Cotton",
      description:
        "High-density pre-shrunk cotton yarns with reinforced rib collars that resist baconing, seam twists, and fabric thinning.",
    },
    {
      number: "04",
      title: "Direct Doorstep COD",
      description:
        "Transparent Cash on Delivery across Bangladesh. No hidden charges—inspect and pay the exact amount at your doorstep.",
    },
  ]

  return (
    <section className="py-14 sm:py-20 bg-brand-surface border-b border-brand-border/80">
      <div className="editorial-container space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-brand-primary bg-brand-accent px-2.5 py-0.5 inline-block">
            BRAND CODE
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-primary uppercase tracking-tight">
            THE THEORY BEHIND THE FIT
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            Bold minimalism and modern street silhouettes tailored for Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.number}
              className="bg-white p-6 sm:p-7 border border-brand-border/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-brand-primary/40 transition-colors"
            >
              <span className="font-heading font-black text-2xl text-brand-primary/20 block">
                {pillar.number}
              </span>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-sm sm:text-base text-brand-primary uppercase tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed font-sans">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
