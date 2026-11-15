import { HttpTypes } from "@medusajs/types"
import {
  CategoryView,
  CollectionView,
  createMoneyView,
  ImageView,
  ProductOptionView,
  ProductVariantView,
  ProductView,
  buildImageAlt,
  resolveVariantStock,
  sumTrackedStock,
} from "@dtc/commerce-contracts"
import { normalizeImageUrl } from "@lib/util/image-url"

export function toImageView(
  image: { id?: string; url: string },
  altText: string = "AFK THEORY Streetwear Apparel"
): ImageView {
  const url = normalizeImageUrl(image.url) || image.url
  return {
    id: image.id || image.url,
    url,
    altText,
  }
}

export function toProductView(medusaProduct: HttpTypes.StoreProduct, currencyCode: string = "bdt"): ProductView {
  const images: ImageView[] = (medusaProduct.images || []).map((image, position) =>
    toImageView(image, buildImageAlt({ productTitle: medusaProduct.title, position }))
  )
  const thumbnail: ImageView | undefined = medusaProduct.thumbnail
    ? toImageView(
        { id: medusaProduct.id, url: medusaProduct.thumbnail },
        buildImageAlt({ productTitle: medusaProduct.title })
      )
    : images[0]

  // Options
  const options: ProductOptionView[] = (medusaProduct.options || []).map((opt) => ({
    id: opt.id,
    title: opt.title,
    values: opt.values ? opt.values.map((v) => v.value) : [],
  }))

  // Variants
  let minAmount = Infinity
  let maxAmount = 0

  const variants: ProductVariantView[] = (medusaProduct.variants || []).map((v) => {
    // Determine price
    const calculatedPrice = v.calculated_price?.calculated_amount ?? 0
    const originalPrice = v.calculated_price?.original_amount

    if (calculatedPrice < minAmount) minAmount = calculatedPrice
    if (calculatedPrice > maxAmount) maxAmount = calculatedPrice

    const optionMap: Record<string, string> = {}
    if (v.options) {
      v.options.forEach((optVal) => {
        // Find matching option title
        const optDef = medusaProduct.options?.find((o) => o.id === optVal.option_id)
        if (optDef) {
          optionMap[optDef.title.toLowerCase()] = optVal.value
        }
      })
    }

    const stock = resolveVariantStock({
      manageInventory: Boolean(v.manage_inventory),
      allowBackorder: Boolean(v.allow_backorder),
      inventoryQuantity: v.inventory_quantity,
    })

    return {
      id: v.id,
      title: v.title || "Default",
      sku: v.sku || v.id,
      price: createMoneyView(calculatedPrice, currencyCode),
      originalPrice: originalPrice ? createMoneyView(originalPrice, currencyCode) : undefined,
      options: optionMap,
      inventoryQuantity: stock.inventoryQuantity,
      manageInventory: Boolean(v.manage_inventory),
      allowBackorder: Boolean(v.allow_backorder),
      inStock: stock.inStock,
      images: (v.images || []).map((image, position) =>
        toImageView(
          image,
          buildImageAlt({
            productTitle: medusaProduct.title,
            color: optionMap["color"] || optionMap["colour"],
            position,
          })
        )
      ),
    }
  })

  const totalStock = sumTrackedStock(variants)

  if (minAmount === Infinity) minAmount = 0
  if (maxAmount === 0) maxAmount = minAmount

  const isNewArrival = Boolean(
    medusaProduct.tags?.some((t) => t.value?.toLowerCase().includes("new")) ||
    medusaProduct.collection?.handle === "new-arrivals"
  )
  const isBestSeller = Boolean(
    medusaProduct.tags?.some((t) => t.value?.toLowerCase().includes("best")) ||
    medusaProduct.collection?.handle === "best-sellers"
  )

  const inStock = variants.length === 0 ? true : variants.some((v) => v.inStock)

  return {
    id: medusaProduct.id,
    title: medusaProduct.title,
    handle: medusaProduct.handle || medusaProduct.id,
    subtitle: medusaProduct.subtitle || undefined,
    description: medusaProduct.description || undefined,
    material: medusaProduct.material || (medusaProduct.metadata?.fabric as string) || undefined,
    thumbnail,
    images,
    options,
    variants,
    collectionTitle: medusaProduct.collection?.title,
    collectionHandle: medusaProduct.collection?.handle,
    categoryNames: medusaProduct.categories?.map((c) => c.name) || [],
    tags: medusaProduct.tags?.map((t) => t.value) || [],
    minPrice: createMoneyView(minAmount, currencyCode),
    maxPrice: createMoneyView(maxAmount, currencyCode),
    isNewArrival,
    isBestSeller,
    totalStock,
    inStock,
    metadata: (medusaProduct.metadata as Record<string, string | number | boolean | null>) || undefined,
  }
}

export function toCategoryView(category: HttpTypes.StoreProductCategory): CategoryView {
  return {
    id: category.id,
    name: category.name,
    handle: category.handle,
    description: category.description || undefined,
    parentCategoryId: category.parent_category_id || undefined,
    productCount: category.products?.length,
  }
}

export function toCollectionView(collection: HttpTypes.StoreCollection): CollectionView {
  return {
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    productCount: collection.products?.length,
  }
}
