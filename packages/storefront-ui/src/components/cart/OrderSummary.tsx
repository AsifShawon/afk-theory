"use client"

import React, { useState } from "react"
import Image from "next/image"
import { CartItemView, CartTotalsView, StoreCapabilities } from "@dtc/commerce-contracts"
import { BadgeCheckIcon, ShieldCheckIcon, TagIcon, TrashIcon, TruckIcon, CheckIcon } from "../icons"
import { Button } from "../ui/button"

export interface OrderSummaryProps {
  totals: CartTotalsView
  items?: CartItemView[]
  promotions?: Array<{
    code: string
    description?: string
  }>
  onApplyPromoCode?: (code: string) => Promise<boolean | void> | boolean | void
  onRemovePromoCode?: (code: string) => Promise<void> | void
  promoError?: string
  capabilities?: StoreCapabilities
  checkoutButtonSlot?: React.ReactNode
  onProceedToCheckout?: () => void
  isSubmitting?: boolean
  className?: string
}

export function OrderSummary({
  totals,
  items,
  promotions = [],
  onApplyPromoCode,
  onRemovePromoCode,
  promoError,
  capabilities,
  checkoutButtonSlot,
  onProceedToCheckout,
  isSubmitting = false,
  className = "",
}: OrderSummaryProps) {
  const [inputCode, setInputCode] = useState("")
  const [isLoadingPromo, setIsLoadingPromo] = useState(false)
  const [localError, setLocalError] = useState("")

  const subtotalAmount = totals.subtotal.amount
  const threshold = 2000
  const progress = Math.min(100, Math.round((subtotalAmount / threshold) * 100))
  const isFreeShipping = subtotalAmount >= threshold
  const remaining = Math.max(0, threshold - subtotalAmount)

  const handleApply = async (e?: React.FormEvent, codeToApply?: string) => {
    e?.preventDefault()
    const code = (codeToApply || inputCode).trim()
    if (!code || !onApplyPromoCode) return

    setLocalError("")
    setIsLoadingPromo(true)
    try {
      const result = await onApplyPromoCode(code)
      if (result !== false) {
        setInputCode("")
      }
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Failed to apply promotional code")
    } finally {
      setIsLoadingPromo(false)
    }
  }

  const activeError = promoError || localError

  return (
    <div className={`bg-brand-surface border border-brand-border p-6 sm:p-7 space-y-6 shadow-xs ${className}`}>
      <h3 className="font-heading font-bold text-sm text-brand-primary uppercase tracking-wider pb-3 border-b border-brand-border">
        Order Summary
      </h3>

      {/* Items Preview */}
      {items && items.length > 0 && (
        <div className="space-y-3 pb-3 border-b border-brand-border">
          <div className="flex items-center justify-between text-xs font-heading font-semibold text-brand-primary">
            <span className="uppercase tracking-wider">Garments ({items.reduce((s, i) => s + i.quantity, 0)})</span>
          </div>
          <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
            {items.map((item) => {
              let imgUrl = item.thumbnail?.url
              if (imgUrl) {
                if (imgUrl.startsWith("http://localhost:9000/") && !imgUrl.startsWith("http://localhost:9000/static/")) {
                  imgUrl = imgUrl.replace("http://localhost:9000/", "http://localhost:9000/static/")
                } else if (imgUrl.startsWith("http://127.0.0.1:9000/") && !imgUrl.startsWith("http://127.0.0.1:9000/static/")) {
                  imgUrl = imgUrl.replace("http://127.0.0.1:9000/", "http://127.0.0.1:9000/static/")
                }
              }
              const itemTitle = item.title || item.productTitle || "Garment"

              return (
                <div key={item.id} className="flex items-center gap-3 text-xs">
                  <div className="relative aspect-[3/4] w-12 bg-brand-secondary border border-brand-border flex-shrink-0 overflow-hidden">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={item.thumbnail?.altText || itemTitle}
                        fill
                        sizes="48px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted text-[8px] font-mono select-none bg-brand-surface">
                        <span>AFK</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-brand-primary truncate text-xs">
                      {itemTitle}
                    </p>
                    <p className="text-[11px] text-brand-muted truncate">
                      {item.variantTitle ? `${item.variantTitle} • ` : ""}Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-heading font-bold text-xs text-brand-primary">
                      {item.totalPrice.formatted}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Free Shipping Progress Meter */}
      <div className="p-3.5 bg-brand-secondary/70 border border-brand-border/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          {isFreeShipping ? (
            <span className="font-heading font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Complimentary Express Delivery Unlocked!</span>
            </span>
          ) : (
            <span className="font-heading font-medium text-brand-primary">
              Add <strong className="font-bold">৳{remaining.toLocaleString()}</strong> more for Free Delivery
            </span>
          )}
          <span className="font-mono text-[11px] text-brand-muted">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-brand-border/60 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFreeShipping ? "bg-emerald-700" : "bg-brand-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Breakdown lines */}
      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-brand-primary">
          <span className="text-brand-muted">Subtotal</span>
          <span className="font-heading font-bold">{totals.subtotal.formatted}</span>
        </div>

        {totals.discount && (
          <div className="flex justify-between text-emerald-700">
            <span>Promotion Discount</span>
            <span className="font-heading font-bold">-{totals.discount.formatted}</span>
          </div>
        )}

        <div className="flex justify-between text-brand-primary">
          <span className="text-brand-muted">Shipping</span>
          <span className="font-heading font-medium">
            {isFreeShipping ? "FREE" : totals.shipping ? totals.shipping.formatted : "Calculated at checkout"}
          </span>
        </div>

        {totals.tax && (
          <div className="flex justify-between text-brand-muted">
            <span>Estimated VAT (Included)</span>
            <span>{totals.tax.formatted}</span>
          </div>
        )}

        <div className="pt-3 border-t border-brand-border flex items-baseline justify-between">
          <div>
            <span className="font-heading font-bold text-base text-brand-primary">Total</span>
            {totals.total.approxUsd && (
              <span className="block text-[11px] text-brand-muted font-mono mt-0.5">
                ≈ ${totals.total.approxUsd} USD
              </span>
            )}
          </div>
          <span className="font-heading font-bold text-lg sm:text-xl text-brand-primary">
            {totals.total.formatted}
          </span>
        </div>
      </div>

      {/* Promo Code Input */}
      {onApplyPromoCode && (
        <div className="space-y-3 pt-2 border-t border-brand-border">
          <form onSubmit={handleApply} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Promo code (e.g. AFK10)"
              className="flex-1 px-3.5 py-2.5 bg-white border border-brand-border rounded-lg text-xs font-mono uppercase text-brand-primary placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              disabled={isLoadingPromo || !inputCode.trim()}
              className="px-4 py-2.5 rounded-lg bg-brand-primary text-white text-xs font-heading font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-40"
            >
              {isLoadingPromo ? "..." : "Apply"}
            </button>
          </form>

          {/* Quick Promo Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-brand-muted font-heading">Suggestions:</span>
            <button
              type="button"
              onClick={() => handleApply(undefined, "AFK10")}
              className="px-2 py-0.5 rounded bg-brand-secondary border border-brand-border text-brand-primary font-mono text-[10px] hover:border-brand-primary transition-colors"
            >
              AFK10 (10% Off)
            </button>
            <button
              type="button"
              onClick={() => handleApply(undefined, "DHAKAFREE")}
              className="px-2 py-0.5 rounded bg-brand-secondary border border-brand-border text-brand-primary font-mono text-[10px] hover:border-brand-primary transition-colors"
            >
              DHAKAFREE (Free Express)
            </button>
          </div>

          {activeError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg font-medium">
              {activeError}
            </p>
          )}

          {/* Applied Promotions List */}
          {promotions.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {promotions.map((promo) => (
                <div
                  key={promo.code}
                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
                >
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    <TagIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{promo.code}</span>
                    {promo.description && (
                      <span className="text-[11px] font-sans font-normal text-emerald-800">
                        • {promo.description}
                      </span>
                    )}
                  </div>
                  {onRemovePromoCode && (
                    <button
                      type="button"
                      onClick={() => onRemovePromoCode(promo.code)}
                      className="text-emerald-800 hover:text-rose-700 transition-colors p-1"
                      title="Remove promo code"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Button */}
      <div className="pt-2">
        {checkoutButtonSlot || (
          <button
            type="button"
            onClick={onProceedToCheckout}
            disabled={isSubmitting}
            className="w-full h-12 bg-brand-accent hover:bg-brand-accent-hover text-brand-primary text-xs font-heading font-extrabold uppercase tracking-widest flex items-center justify-center transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Proceed to Checkout →"}
          </button>
        )}
      </div>

      {/* Trust Badges */}
      <div className="pt-4 border-t border-brand-border/60 space-y-2.5 text-brand-muted text-[11px] font-sans">
        <div className="flex items-center gap-2">
          <BadgeCheckIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
          <span>100% Cash on Delivery across all 64 districts</span>
        </div>
        <div className="flex items-center gap-2">
          <TruckIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
          <span>Dhaka Express (24–48h) • Nationwide (3–5 days)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
          <span>7-Day doorstep size exchange guarantee</span>
        </div>
      </div>
    </div>
  )
}
