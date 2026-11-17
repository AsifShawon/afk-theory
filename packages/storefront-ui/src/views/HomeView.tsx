import React from "react"
import {
  AnnouncementBarView,
  CampaignSlideView,
  CategoryView,
  ProductView,
  QuickAddRequest,
  QuickAddResult,
  StoreCapabilities,
  StoreRoutes,
  HOODIES_LINE,
  TEES_LINE,
  groupProductsByLine,
  lineHref,
} from "@dtc/commerce-contracts"
import { HeroSection } from "../components/home/HeroSection"
import { FeaturedCategories } from "../components/home/FeaturedCategories"
import { ProductRails } from "../components/home/ProductRails"
import { CraftsmanshipSection } from "../components/home/CraftsmanshipSection"
import { BrandStorySection } from "../components/home/BrandStorySection"
import { BrandValuesGrid } from "../components/home/BrandValuesGrid"
import { DeliveryGuaranteesSection } from "../components/home/DeliveryGuaranteesSection"
import { NewsletterSection } from "../components/home/NewsletterSection"
import { Reveal } from "../components/ui/reveal"
import { LinkComponent } from "../types"

export interface HomeViewProps {
  heroProduct?: ProductView
  featuredProducts: ProductView[]
  categories: CategoryView[]
  routes: StoreRoutes
  capabilities?: StoreCapabilities
  campaignSlides?: CampaignSlideView[]
  announcement?: AnnouncementBarView
  onQuickAdd?: (req: QuickAddRequest) => Promise<QuickAddResult>
  secondaryCtaSlot?: React.ReactNode
  newsletterSlot?: React.ReactNode
  linkComponent?: LinkComponent
}

export function HomeView({
  heroProduct,
  featuredProducts,
  categories,
  routes,
  capabilities,
  campaignSlides,
  announcement,
  onQuickAdd,
  secondaryCtaSlot,
  newsletterSlot,
  linkComponent,
}: HomeViewProps) {
  const { tees: teeProducts, hoodies: hoodieProducts } = groupProductsByLine(featuredProducts)

  return (
    <div className="flex flex-col w-full">
      {/* 1. Editorial Hero */}
      <HeroSection
        catalogHref={routes?.catalog ? routes.catalog() : "/store"}
        aboutHref={routes?.about ? routes.about() : "/about"}
        featuredProduct={heroProduct || featuredProducts[0]}
        slides={campaignSlides}
        autoplay={announcement?.desktopAutoplay}
        autoplayIntervalMs={announcement?.autoplayIntervalMs}
        secondaryCtaSlot={secondaryCtaSlot}
        linkComponent={linkComponent}
      />

      {/* 2. Drop Shoulder Tees Rail */}
      {teeProducts.length > 0 && (
        <Reveal>
          <ProductRails
            title={TEES_LINE.title.toUpperCase()}
            subtitle={TEES_LINE.summary}
            viewAllHref={lineHref(routes, TEES_LINE)}
            viewAllLabel="Shop Tees"
            products={teeProducts}
            routes={routes}
            capabilities={capabilities}
            onQuickAdd={onQuickAdd}
            linkComponent={linkComponent}
          />
        </Reveal>
      )}

      {/* 3. Category Mosaic / Department Grid */}
      <Reveal>
        <FeaturedCategories
          categories={categories}
          lineImages={{
            [TEES_LINE.handle]: teeProducts[0]?.thumbnail?.url || teeProducts[0]?.images[0]?.url,
            [HOODIES_LINE.handle]: hoodieProducts[0]?.thumbnail?.url || hoodieProducts[0]?.images[0]?.url,
          }}
          routes={routes}
          linkComponent={linkComponent}
        />
      </Reveal>

      {/* 4. Fit & Quality Architecture (Drop Shoulder Specifications) */}
      <Reveal>
        <CraftsmanshipSection routes={routes} linkComponent={linkComponent} />
      </Reveal>

      {/* 5. About The Theory Storytelling */}
      <Reveal>
        <BrandStorySection routes={routes} linkComponent={linkComponent} />
      </Reveal>

      {/* 6. Hoodies Rail (shown once hoodies are listed) */}
      {hoodieProducts.length > 0 && (
        <Reveal>
          <ProductRails
            title={HOODIES_LINE.title.toUpperCase()}
            subtitle={HOODIES_LINE.summary}
            viewAllHref={lineHref(routes, HOODIES_LINE)}
            viewAllLabel="Shop Hoodies"
            products={hoodieProducts}
            routes={routes}
            capabilities={capabilities}
            onQuickAdd={onQuickAdd}
            linkComponent={linkComponent}
          />
        </Reveal>
      )}

      {/* 7. Brand Code / Values Grid */}
      <Reveal>
        <BrandValuesGrid />
      </Reveal>

      {/* 8. Delivery & COD Service Reassurance Strip */}
      <Reveal>
        <DeliveryGuaranteesSection />
      </Reveal>

      {/* 9. Drop Registry / Subscription */}
      <Reveal>
        {newsletterSlot || <NewsletterSection />}
      </Reveal>
    </div>
  )
}
