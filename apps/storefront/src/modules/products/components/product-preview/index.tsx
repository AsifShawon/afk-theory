import { HttpTypes } from "@medusajs/types"
import { toProductView } from "@adapters/medusa/catalog"
import QuickAddProductCard from "./quick-add-card"

export default function ProductPreview({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const productView = toProductView(product, region.currency_code)

  return (
    <QuickAddProductCard
      product={productView}
      href={`/products/${product.handle}`}
    />
  )
}
