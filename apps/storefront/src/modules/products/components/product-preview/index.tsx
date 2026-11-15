import { HttpTypes } from "@medusajs/types"
import StorefrontProductCard from "../product-card-client"
import { toProductView } from "@adapters/medusa/catalog"
import { DEFAULT_MEDUSA_CAPABILITIES } from "@dtc/commerce-contracts"

export default function ProductPreview({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const productView = toProductView(product, region.currency_code)
  const countryCode = region.countries?.[0]?.iso_2 || "bd"

  return (
    <StorefrontProductCard
      product={productView}
      href={`/products/${product.handle}`}
      countryCode={countryCode}
      capabilities={DEFAULT_MEDUSA_CAPABILITIES}
    />
  )
}
