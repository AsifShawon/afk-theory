"use client"

import React, { useState } from "react"
import Image from "next/image"
import { AddressFormView, CartItemView, ShippingMethodView } from "@dtc/commerce-contracts"
import { MapPinIcon, TruckIcon } from "../icons"

export interface OrderReviewProps {
  email: string
  shippingAddress: AddressFormView
  shippingMethod?: ShippingMethodView
  items: CartItemView[]
  onEditAddress?: () => void
  onEditShipping?: () => void
}

function ReviewItemRow({ item }: { item: CartItemView }) {
  const [imageError, setImageError] = useState(false)
  let imageUrl = item.thumbnail?.url
  if (imageUrl) {
    if (imageUrl.startsWith("http://localhost:9000/") && !imageUrl.startsWith("http://localhost:9000/static/")) {
      imageUrl = imageUrl.replace("http://localhost:9000/", "http://localhost:9000/static/")
    } else if (imageUrl.startsWith("http://127.0.0.1:9000/") && !imageUrl.startsWith("http://127.0.0.1:9000/static/")) {
      imageUrl = imageUrl.replace("http://127.0.0.1:9000/", "http://127.0.0.1:9000/static/")
    }
  }

  const showImage = Boolean(imageUrl && !imageError)
  const title = item.title || item.productTitle || "Garment"

  return (
    <div className="p-3 flex items-center gap-3">
      <div className="relative aspect-[3/4] w-12 sm:w-14 bg-brand-secondary border border-brand-border flex-shrink-0 overflow-hidden">
        {showImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.thumbnail?.altText || title}
            fill
            sizes="56px"
            className="object-cover object-center"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted text-[8px] font-mono tracking-wider select-none bg-brand-surface">
            <span>AFK</span>
            <span>THEORY</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-xs text-brand-primary truncate">
          {title}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-brand-muted mt-0.5">
          {item.variantTitle && <span>{item.variantTitle}</span>}
          <span>• Qty: {item.quantity}</span>
        </div>
      </div>
      <div className="text-right">
        <span className="font-heading font-bold text-xs text-brand-primary">
          {item.totalPrice.formatted}
        </span>
      </div>
    </div>
  )
}

export function OrderReview({
  email,
  shippingAddress,
  shippingMethod,
  items,
  onEditAddress,
  onEditShipping,
}: OrderReviewProps) {
  return (
    <div className="space-y-4 text-xs">
      {/* Contact & Shipping Summary Card */}
      <div className="border border-brand-border bg-brand-surface p-4 space-y-4">
        {/* Recipient & Address */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-brand-border">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-heading font-semibold uppercase tracking-wider text-brand-primary text-[11px]">
              <MapPinIcon className="w-3.5 h-3.5" />
              <span>Delivery Destination</span>
            </div>
            <p className="font-bold text-brand-primary">
              {shippingAddress.firstName} {shippingAddress.lastName} • {shippingAddress.phone}
            </p>
            <p className="text-brand-muted">
              {shippingAddress.address1}
              {shippingAddress.address2 ? `, ${shippingAddress.address2}` : ""},{" "}
              {shippingAddress.city} {shippingAddress.postalCode}
            </p>
            <p className="text-[11px] text-brand-muted">Email updates: {email}</p>
          </div>
          {onEditAddress && (
            <button
              type="button"
              onClick={onEditAddress}
              className="text-xs font-semibold text-brand-accent hover:underline uppercase tracking-wider"
            >
              Edit
            </button>
          )}
        </div>

        {/* Shipping Method */}
        {shippingMethod && (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-heading font-semibold uppercase tracking-wider text-brand-primary text-[11px]">
                <TruckIcon className="w-3.5 h-3.5" />
                <span>Selected Delivery Courier</span>
              </div>
              <p className="font-semibold text-brand-primary">
                {shippingMethod.name} — {shippingMethod.price.formatted}
              </p>
              {shippingMethod.estimatedDays && (
                <p className="text-[11px] text-brand-muted">
                  Estimated Arrival: {shippingMethod.estimatedDays}
                </p>
              )}
            </div>
            {onEditShipping && (
              <button
                type="button"
                onClick={onEditShipping}
                className="text-xs font-semibold text-brand-accent hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Ordered Garments Preview */}
        {items && items.length > 0 && (
          <div className="pt-3 border-t border-brand-border space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-heading font-semibold uppercase tracking-wider text-brand-primary">
                Garments in Order ({items.reduce((sum, i) => sum + i.quantity, 0)})
              </span>
            </div>
            <div className="divide-y divide-brand-border/60 border border-brand-border/60 bg-white">
              {items.map((item) => (
                <ReviewItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
