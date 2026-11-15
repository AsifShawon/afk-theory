import { HttpTypes } from "@medusajs/types"
import {
  CategoryView,
  CollectionView,
  createMoneyView,
  MoneyView,
  ImageView,
  ProductOptionView,
  ProductVariantView,
  ProductView,
} from "@dtc/commerce-contracts"
import { normalizeImageUrl } from "@lib/util/image-url"

export function toImageView(image: { id?: string; url: string }): ImageView {
  const url = normalizeImageUrl(image.url) || image.url
  return {
    id: image.id || image.url,
    url,
    altText: "AFK THEORY Streetwear Apparel",
  }
}

export function toProductView(medusaProduct: HttpTypes.StoreProduct, currencyCode: string = "bdt"): ProductView {
  const images: ImageView[] = (medusaProduct.images || []).map(toImageView)
  const thumbnail: ImageView | undefined = medusaProduct.thumbnail
    ? toImageView({ id: medusaProduct.id, url: medusaProduct.thumbnail })
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
  let minOriginalPrice: MoneyView | undefined = undefined

  const variants: ProductVariantView[] = (medusaProduct.variants || []).map((v) => {
    // Determine price
    const calculatedPrice = v.calculated_price?.calculated_amount ?? 0
    const rawOriginalPrice = v.calculated_price?.original_amount

    // Genuine discount rule: original price must be strictly greater than calculated price
    const hasGenuineDiscount =
      typeof rawOriginalPrice === "number" &&
      !Number.isNaN(rawOriginalPrice) &&
      rawOriginalPrice > calculatedPrice

    const originalPriceView = hasGenuineDiscount
      ? createMoneyView(rawOriginalPrice, currencyCode)
      : undefined

    if (calculatedPrice < minAmount) {
      minAmount = calculatedPrice
      minOriginalPrice = originalPriceView
    }
    if (calculatedPrice > maxAmount) {
      maxAmount = calculatedPrice
    }

    const optionMap: Record<string, string> = {}
    if (v.options) {
      v.options.forEach((optVal) => {
        // Find matching option title
        const optDef = medusaProduct.options?.find((o) => o.id === optVal.option_id)
        if (optDef) {
          // Provide both lowercase and raw title for robust resolution
          optionMap[optDef.title.toLowerCase()] = optVal.value
          optionMap[optDef.title] = optVal.value
        }
      })
    }

    // Accurate Medusa inventory semantics: do not invent 10
    const manageInventory = Boolean(v.manage_inventory)
    const allowBackorder = Boolean(v.allow_backorder)
    const inventoryQty =
      typeof v.inventory_quantity === "number" ? v.inventory_quantity : undefined

    let inStock = true
    if (manageInventory && !allowBackorder) {
      inStock = inventoryQty !== undefined ? inventoryQty > 0 : false
    }

    return {
      id: v.id,
      title: v.title || "Default",
      sku: v.sku || v.id,
      price: createMoneyView(calculatedPrice, currencyCode),
      originalPrice: originalPriceView,
      options: optionMap,
      inventoryQuantity: inventoryQty,
      manageInventory,
      inStock,
    }
  })

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
  const isSale = variants.some((v) => Boolean(v.originalPrice))

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
    minOriginalPrice,
    isNewArrival,
    isBestSeller,
    isSale,
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
