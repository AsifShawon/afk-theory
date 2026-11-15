"use client"

import React, { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { useWishlist } from "@lib/context/wishlist-context"
import { getWishlistProducts } from "@lib/data/wishlist"
import { addToCart } from "@lib/data/cart"
import { toProductView } from "@adapters/medusa/catalog"
import { ProductView, resolvePriceDisplay } from "@dtc/commerce-contracts"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon, TrashIcon, CheckIcon } from "@dtc/storefront-ui"
import { MobileQuickAddSheet } from "@dtc/storefront-ui"
import { HttpTypes } from "@medusajs/types"

interface WishlistClientProps {
  countryCode: string
  currencyCode: string
}

export default function WishlistClient({
  countryCode,
  currencyCode,
}: WishlistClientProps) {
  const { wishlistIds, toggleWishlist, isLoading: isContextLoading } = useWishlist()
  const [products, setProducts] = useState<ProductView[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [quickAddProduct, setQuickAddProduct] = useState<ProductView | null>(null)
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null)
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Load product views for active wishlist IDs
  useEffect(() => {
    let isMounted = true

    async function load() {
      if (wishlistIds.length === 0) {
        if (isMounted) {
          setProducts([])
          setIsLoadingProducts(false)
        }
        return
      }

      setIsLoadingProducts(true)
      try {
        const rawProducts = await getWishlistProducts({
          productIds: wishlistIds,
          countryCode,
        })
        if (isMounted) {
          const views = (rawProducts || []).map((p: HttpTypes.StoreProduct) =>
            toProductView(p, currencyCode)
          )
          setProducts(views)
        }
      } catch (err) {
        console.error("Failed to load wishlist products:", err)
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false)
        }
      }
    }

    if (!isContextLoading) {
      load()
    }

    return () => {
      isMounted = false
    }
  }, [wishlistIds, countryCode, currencyCode, isContextLoading])

  const handleRemove = (productId: string) => {
    startTransition(() => {
      toggleWishlist(productId)
    })
  }

  const handleQuickAdd = async (req: { productId: string; variantId: string; quantity: number }) => {
    setAddingVariantId(req.variantId)
    try {
      await addToCart({
        variantId: req.variantId,
        quantity: req.quantity || 1,
        countryCode,
      })
      setAddedVariantId(req.variantId)
      setTimeout(() => setAddedVariantId(null), 2000)
      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to add to bag.",
      }
    } finally {
      setAddingVariantId(null)
    }
  }

  if (isContextLoading || (isLoadingProducts && wishlistIds.length > 0)) {
    return (
      <div className="editorial-container py-16 sm:py-24 text-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-heading font-semibold uppercase tracking-wider text-brand-muted">
          Loading Saved Garments...
        </p>
      </div>
    )
  }

  if (wishlistIds.length === 0 || products.length === 0) {
    return (
      <div className="editorial-container py-16 sm:py-24">
        <div className="max-w-md mx-auto text-center space-y-6 bg-brand-surface border border-brand-border p-8 sm:p-12 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-white border border-brand-border/80 flex items-center justify-center mx-auto text-brand-primary">
            <HeartIcon className="w-8 h-8 text-brand-muted" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading font-bold text-lg uppercase tracking-wider text-brand-primary">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs text-brand-muted leading-relaxed">
              You haven&apos;t saved any garments to your wishlist yet. Explore our foundational streetwear collection and keep your style paused until you&apos;re ready.
            </p>
          </div>

          <div className="pt-2">
            <LocalizedClientLink
              href="/store"
              className="inline-block px-8 py-3.5 bg-brand-primary text-white text-xs font-heading font-bold uppercase tracking-wider hover:bg-black transition-all shadow-subtle"
            >
              Explore Garments
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="editorial-container py-8 sm:py-12 lg:py-16 space-y-8">
      {/* Header */}
      <div className="border-b border-brand-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-[11px] font-heading uppercase tracking-wider text-brand-muted mb-2">
            <LocalizedClientLink href="/" className="hover:text-brand-primary">Home</LocalizedClientLink>
            <span className="mx-2">/</span>
            <span className="text-brand-primary font-bold">Wishlist</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-primary tracking-tight">
            SAVED PIECES
          </h1>
          <p className="text-xs font-heading text-brand-muted mt-1 uppercase tracking-wider">
            {products.length} {products.length === 1 ? "Garment" : "Garments"} in your personal collection
          </p>
        </div>

        <LocalizedClientLink
          href="/store"
          className="text-xs font-heading font-bold uppercase tracking-wider text-brand-primary underline hover:text-black self-start sm:self-auto"
        >
          Continue Shopping →
        </LocalizedClientLink>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {products.map((product) => {
          const priceDisplay = resolvePriceDisplay(product.minPrice, product.minOriginalPrice)
          const primaryImage = product.thumbnail || product.images[0]
          const isSoldOut = !product.inStock

          return (
            <article
              key={product.id}
              className="group relative flex flex-col bg-white border border-brand-border hover:border-brand-primary transition-all duration-300 shadow-xs overflow-hidden"
            >
              {/* Product Thumbnail & Quick Remove */}
              <div className="relative aspect-[3/4] w-full bg-brand-secondary overflow-hidden">
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="block w-full h-full relative"
                >
                  {primaryImage?.url ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.altText || product.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs font-mono font-bold tracking-wider">
                      {"// AFK THEORY"}
                    </div>
                  )}
                </LocalizedClientLink>

                {/* Remove button (Heart toggle) */}
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  aria-label={`Remove ${product.title} from wishlist`}
                  className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#20241F] text-rose-400 hover:text-white border border-[#20241F] flex items-center justify-center transition-all shadow-xs cursor-pointer hover:scale-110"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>

                {/* Status Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                  {priceDisplay.hasDiscount && (
                    <span className="bg-rose-950 text-rose-200 border border-rose-800 text-[9px] font-heading font-extrabold uppercase tracking-widest px-2.5 py-0.5 shadow-xs">
                      SALE {priceDisplay.discountFormatted}
                    </span>
                  )}
                  {isSoldOut ? (
                    <span className="bg-rose-950 text-rose-200 border border-rose-800 text-[9px] font-heading font-bold uppercase tracking-widest px-2.5 py-0.5 shadow-xs">
                      SOLD OUT
                    </span>
                  ) : (
                    <span className="bg-emerald-900 text-emerald-100 text-[9px] font-heading font-bold uppercase tracking-widest px-2 py-0.5 shadow-xs">
                      IN STOCK
                    </span>
                  )}
                </div>
              </div>

              {/* Details & Action */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                <div className="space-y-1">
                  <LocalizedClientLink
                    href={`/products/${product.handle}`}
                    className="block hover:underline"
                  >
                    <h3 className="font-heading font-bold text-sm text-brand-primary line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                  </LocalizedClientLink>
                  <p className="text-[11px] text-brand-primary/60 truncate">
                    {product.material || product.subtitle || "Premium Heavyweight Streetwear"}
                  </p>
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-brand-border/50 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-heading font-bold text-sm text-brand-primary">
                      {priceDisplay.currentPrice.formatted}
                    </span>
                    {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                      <span className="text-xs text-brand-muted line-through">
                        {priceDisplay.originalPrice.formatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add CTA */}
                <div className="pt-1">
                  {isSoldOut ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-10 rounded border border-brand-border bg-brand-surface text-brand-muted text-xs font-heading font-semibold uppercase tracking-wider cursor-not-allowed opacity-50"
                    >
                      Sold Out
                    </button>
                  ) : product.variants.length === 1 ? (
                    <button
                      type="button"
                      disabled={addingVariantId === product.variants[0].id}
                      onClick={() =>
                        handleQuickAdd({
                          productId: product.id,
                          variantId: product.variants[0].id,
                          quantity: 1,
                        })
                      }
                      className="w-full h-10 rounded bg-brand-primary hover:bg-black text-white text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {addingVariantId === product.variants[0].id ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : addedVariantId === product.variants[0].id ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5 text-brand-accent" />
                          <span>Added to Bag ✓</span>
                        </>
                      ) : (
                        <span>+ Add to Bag</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQuickAddProduct(product)}
                      className="w-full h-10 rounded bg-white hover:bg-brand-primary hover:text-white border border-brand-border text-brand-primary text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Select Size &amp; Add</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Quick Add Sheet */}
      {quickAddProduct && (
        <MobileQuickAddSheet
          isOpen={Boolean(quickAddProduct)}
          onClose={() => setQuickAddProduct(null)}
          product={quickAddProduct}
          href={`/products/${quickAddProduct.handle}`}
          onQuickAdd={handleQuickAdd}
          linkComponent={LocalizedClientLink}
        />
      )}
    </div>
  )
}
