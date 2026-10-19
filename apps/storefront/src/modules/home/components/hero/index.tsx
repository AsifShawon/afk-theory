import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative bg-brand-secondary border-b border-brand-border overflow-hidden">
      {/* Background Decorative Pattern / Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary via-brand-secondary/95 to-brand-muted/20 z-0 pointer-events-none" />

      <div className="content-container relative z-10 py-16 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Editorial Headline & Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary text-white text-[11px] font-heading font-semibold uppercase tracking-widest">
              <span>DROP 01 // OVERSIZED DROP SHOULDER</span>
              <span className="text-brand-accent">•</span>
              <span>DENSE COMPACT COTTON</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-primary leading-[1.12] tracking-tight">
              OFFLINE BY CHOICE. <br />
              <span className="text-brand-accent font-normal">PAUSE THE GAME. KEEP YOUR STYLE.</span>
            </h1>

            <p className="font-sans text-sm sm:text-base text-brand-primary/80 max-w-xl leading-relaxed">
              Modern, independent, premium-accessible streetwear engineered for Bangladesh. Featuring distinct drop shoulder silhouettes, heavyweight drapes, and nationwide Cash on Delivery.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <LocalizedClientLink
                href="/store"
                className="px-8 py-3.5 bg-brand-accent text-brand-primary hover:bg-black hover:text-brand-accent text-xs font-heading font-semibold uppercase tracking-widest text-center transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Shop The Drop
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/about"
                className="px-8 py-3.5 bg-white text-brand-primary border border-brand-primary/30 hover:border-brand-primary hover:bg-brand-secondary text-xs font-heading font-semibold uppercase tracking-widest text-center transition-all duration-200"
              >
                About The Theory
              </LocalizedClientLink>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-brand-border/60 flex flex-wrap items-center gap-6 text-xs text-brand-primary/70">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-brand-accent">✓</span>
                <span>Inside Dhaka ৳60 (24–48h)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-brand-accent">✓</span>
                <span>Nationwide Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-brand-accent">✓</span>
                <span>Sizes S to XXL</span>
              </div>
            </div>
          </div>

          {/* Right: Curated Hero Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white border border-brand-border p-5 sm:p-6 shadow-xl relative overflow-hidden group">
              <div className="relative aspect-[4/5] w-full bg-brand-primary overflow-hidden mb-4 flex items-center justify-center">
                <div className="text-center p-6 space-y-2">
                  <span className="font-display text-4xl text-brand-accent font-bold tracking-tight">DROP 01</span>
                  <p className="text-xs font-mono text-brand-secondary uppercase tracking-widest">Oversized Drop Shoulder Tee</p>
                </div>
                <div className="absolute top-3 left-3 bg-brand-accent text-brand-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 z-10">
                  Concept Drop
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading font-bold text-sm text-brand-primary">
                    Oversized Drop Shoulder T-Shirt
                  </h3>
                  <span className="font-bold text-sm text-brand-primary">৳1,250</span>
                </div>
                <p className="text-xs text-brand-primary/60">
                  Dense Compact Cotton • Sizes S to XXL • Relaxed Drape
                </p>
                <div className="pt-2">
                  <LocalizedClientLink
                    href="/store"
                    className="block w-full py-2.5 bg-brand-accent text-brand-primary hover:bg-black hover:text-white border border-brand-border text-center text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    View Collection Details →
                  </LocalizedClientLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
