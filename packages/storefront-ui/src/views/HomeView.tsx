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
} from "@dtc/commerce-contracts"
import { HeroSection } from "../components/home/HeroSection"
import { FeaturedCategories } from "../components/home/FeaturedCategories"
import { ProductRails } from "../components/home/ProductRails"
import { CraftsmanshipSection } from "../components/home/CraftsmanshipSection"
import { BrandStorySection } from "../components/home/BrandStorySection"
import { SplitPromoSection } from "../components/home/SplitPromoSection"
import { BrandValuesGrid } from "../components/home/BrandValuesGrid"
import { DeliveryGuaranteesSection } from "../components/home/DeliveryGuaranteesSection"
import { NewsletterSection } from "../components/home/NewsletterSection"
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
  const newArrivals = featuredProducts.filter((p) => p.isNewArrival)
  const bestSellers = featuredProducts.filter((p) => p.isBestSeller)
  const displayRailProducts = newArrivals.length > 0 ? newArrivals : featuredProducts

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

      {/* 2. Featured Drop Shoulder Rail */}
      <ProductRails
        title="DROP 01 // OVERSIZED DROP SHOULDER"
        subtitle="Calibrated shoulder seams, wide boxy circumference, and dense pre-shrunk cotton."
        viewAllHref={routes.collection("drop-01-offline-by-choice")}
        viewAllLabel="Shop Drop 01"
        products={displayRailProducts}
        routes={routes}
        capabilities={capabilities}
        onQuickAdd={onQuickAdd}
        linkComponent={linkComponent}
      />

      {/* 3. Category Mosaic / Department Grid */}
      <FeaturedCategories
        categories={categories}
        routes={routes}
        linkComponent={linkComponent}
      />

      {/* 4. Fit & Quality Architecture (Drop Shoulder Specifications) */}
      <CraftsmanshipSection routes={routes} linkComponent={linkComponent} />

      {/* 5. About The Theory Storytelling */}
      <BrandStorySection routes={routes} linkComponent={linkComponent} />

      {/* 6. Essentials Rail */}
      {bestSellers.length > 0 && (
        <ProductRails
          title="FOUNDATIONAL STREETWEAR"
          subtitle="Boxy silhouettes and minimal street staples designed for everyday rotation."
          viewAllHref={routes.collection("essentials")}
          viewAllLabel="Shop Essentials"
          products={bestSellers}
          routes={routes}
          capabilities={capabilities}
          onQuickAdd={onQuickAdd}
          linkComponent={linkComponent}
        />
      )}

      {/* 7. New Drop & Future Collection Preview */}
      <SplitPromoSection routes={routes} linkComponent={linkComponent} />

      {/* 8. Brand Code / Values Grid */}
      <BrandValuesGrid />

      {/* 9. Delivery & COD Service Reassurance Strip */}
      <DeliveryGuaranteesSection />

      {/* 10. Drop Registry / Subscription */}
      {newsletterSlot || <NewsletterSection />}
    </div>
  )
}
