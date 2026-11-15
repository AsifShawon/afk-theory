import React from "react"
import {
  ProductView,
  QuickAddRequest,
  QuickAddResult,
  StoreCapabilities,
  StoreRoutes,
} from "@dtc/commerce-contracts"
import { ProductCard, ProductCardProps } from "../product/ProductCard"
import { ProductRailScroller } from "./ProductRailScroller"
import { LinkComponent } from "../../types"

export interface ProductRailsProps {
  title: string
  subtitle?: string
  viewAllHref?: string
  viewAllLabel?: string
  products: ProductView[]
  routes: StoreRoutes
  capabilities?: StoreCapabilities
  onQuickAdd?: (req: QuickAddRequest) => Promise<QuickAddResult>
  linkComponent?: LinkComponent
  wishlistIds?: string[]
  onToggleWishlist?: (productId: string) => void | Promise<void>
  productCardComponent?: React.ComponentType<ProductCardProps>
}

export function ProductRails({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  products,
  routes,
  capabilities,
  onQuickAdd,
  linkComponent,
  wishlistIds,
  onToggleWishlist,
  productCardComponent: Card = ProductCard,
}: ProductRailsProps) {
  if (!products || products.length === 0) return null

  const isSingle = products.length === 1

  return (
    <ProductRailScroller
      title={title}
      subtitle={subtitle}
      viewAllHref={viewAllHref}
      viewAllLabel={viewAllLabel}
      showControls={!isSingle}
      linkComponent={linkComponent}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className={
            isSingle
              ? "w-[280px] sm:w-[320px] lg:w-[360px] flex-shrink-0 snap-start"
              : "w-[260px] sm:w-[280px] lg:w-[310px] flex-shrink-0 snap-start"
          }
        >
          <Card
            product={product}
            href={routes.product(product.handle)}
            capabilities={capabilities}
            onQuickAdd={onQuickAdd}
            linkComponent={linkComponent}
            isWishlisted={wishlistIds ? wishlistIds.includes(product.id) : false}
            onToggleWishlist={onToggleWishlist}
          />
        </div>
      ))}
    </ProductRailScroller>
  )
}
