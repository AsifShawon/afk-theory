import React from "react"
import Link from "next/link"
import Image from "next/image"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ArrowRightIcon } from "../icons"
import { LinkComponent } from "../../types"

export interface BrandStorySectionProps {
  routes: StoreRoutes
  learnMoreHref?: string
  linkComponent?: LinkComponent
}

export function BrandStorySection({
  routes,
  linkComponent: LinkComp = Link,
}: BrandStorySectionProps) {
  return (
    <section className="py-16 sm:py-24 bg-brand-surface border-b border-brand-border">
      <div className="content-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-brand-secondary border border-brand-border overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80"
                alt="AFK THEORY Silhouette and Streetwear Craft"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Narrative Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="badge-tag">THE PHILOSOPHY // AWAY FROM KEYBOARD</span>

            <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-primary uppercase tracking-tight leading-tight">
              PAUSE THE GAME. <br />
              <span className="text-brand-muted">KEEP YOUR STYLE.</span>
            </h2>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              AFK THEORY was built on a simple conviction: in a hyper-connected, always-on digital world, stepping away from the screen is an intentional statement. Streetwear that carries calm confidence, relaxed attitude, and authentic independence.
            </p>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Our inaugural Drop 01 oversized drop shoulder silhouette combines fallen shoulder lines, robust rib-knit collar retention, and generous heavyweight drape. Cut and crafted in Bangladesh for contemporary street energy.
            </p>

            <div className="pt-2">
              <LinkComp
                href={routes.about()}
                className="contrast-btn text-xs inline-block"
              >
                ABOUT THE THEORY →
              </LinkComp>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
