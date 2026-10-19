"use client"

import React, { useMemo } from "react"
import {
  AddressFormView,
  BANGLADESH_DISTRICTS,
  BANGLADESH_DIVISIONS,
  BANGLADESH_SHIPPING_RATES,
  determineBangladeshShippingZone,
  isValidBangladeshPhone,
} from "@dtc/commerce-contracts"
import { Input } from "../ui/input"

export interface AddressFormProps {
  formData: AddressFormView
  onChange: (data: AddressFormView) => void
  errors?: Partial<Record<keyof AddressFormView | "district", string>>
  disabled?: boolean
}

export function AddressForm({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: AddressFormProps) {
  const updateField = (field: keyof AddressFormView, value: string) => {
    const updated = {
      ...formData,
      [field]: value,
    }

    // Auto-update division when district is selected
    if (field === "district") {
      const match = BANGLADESH_DISTRICTS.find(
        (d) => d.name.toLowerCase() === value.toLowerCase() || d.id === value.toLowerCase()
      )
      if (match) {
        updated.division = match.division
        // Set province to division/district for Medusa schema compatibility
        updated.province = match.division
        if (!updated.city) {
          updated.city = match.name
        }
      }
    }

    onChange(updated)
  }

  // Calculate estimated shipping zone live for instant customer feedback
  const detectedZone = useMemo(() => {
    return determineBangladeshShippingZone(
      formData.district || formData.city,
      formData.city,
      formData.address1
    )
  }, [formData.district, formData.city, formData.address1])

  const zoneInfo = BANGLADESH_SHIPPING_RATES[detectedZone]

  const phoneValid = !formData.phone || isValidBangladeshPhone(formData.phone)

  return (
    <div className="space-y-4">
      {/* Recipient Full Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          error={errors.firstName}
          required
          disabled={disabled}
          autoComplete="given-name"
          placeholder="e.g. Asif"
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          error={errors.lastName}
          required
          disabled={disabled}
          autoComplete="family-name"
          placeholder="e.g. Shawon"
        />
      </div>

      {/* Bangladeshi Mobile Number */}
      <div>
        <Input
          label="Mobile Phone Number (11-digit BD Mobile)"
          value={formData.phone || ""}
          onChange={(e) => updateField("phone", e.target.value)}
          error={
            errors.phone ||
            (!phoneValid
              ? "Please enter a valid 11-digit BD mobile number (e.g. 01712345678)"
              : undefined)
          }
          placeholder="01712345678 or +8801712345678"
          required
          disabled={disabled}
          autoComplete="tel"
        />
        <p className="mt-1 text-[11px] text-brand-muted">
          Used by courier delivery personnel for delivery call and OTP handover.
        </p>
      </div>

      {/* District & Division Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-brand-primary">
            District <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.district || ""}
            onChange={(e) => updateField("district", e.target.value)}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-lg text-xs font-sans text-brand-primary focus:outline-none focus:border-brand-primary transition-colors disabled:opacity-50"
          >
            <option value="">Select your district (64 Districts)</option>
            {BANGLADESH_DIVISIONS.map((division) => (
              <optgroup key={division} label={`${division} Division`}>
                {BANGLADESH_DISTRICTS.filter((d) => d.division === division).map(
                  (district) => (
                    <option key={district.id} value={district.name}>
                      {district.name} ({district.bnName})
                    </option>
                  )
                )}
              </optgroup>
            ))}
          </select>
          {errors.district && (
            <p className="text-xs text-red-500 mt-0.5">{errors.district}</p>
          )}
        </div>

        <Input
          label="Thana / City / Area"
          value={formData.city}
          onChange={(e) => updateField("city", e.target.value)}
          error={errors.city}
          placeholder="e.g. Banani, Dhanmondi, or Sadar"
          required
          disabled={disabled}
          autoComplete="address-level2"
        />
      </div>

      {/* Street Address Details */}
      <Input
        label="Street Address, House & Road No."
        value={formData.address1}
        onChange={(e) => updateField("address1", e.target.value)}
        error={errors.address1}
        placeholder="e.g. House 42, Road 11, Block D"
        required
        disabled={disabled}
        autoComplete="street-address"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Apartment, Floor, Holding No. (Optional)"
          value={formData.address2 || ""}
          onChange={(e) => updateField("address2", e.target.value)}
          placeholder="e.g. Flat 4B, 3rd Floor"
          disabled={disabled}
        />
        <Input
          label="Postal Code (Optional)"
          value={formData.postalCode || ""}
          onChange={(e) => updateField("postalCode", e.target.value)}
          error={errors.postalCode}
          placeholder="e.g. 1213"
          disabled={disabled}
          autoComplete="postal-code"
        />
      </div>

      {/* Optional Delivery Notes / Landmark */}
      <div className="space-y-1">
        <label className="block text-xs font-heading font-semibold uppercase tracking-wider text-brand-primary">
          Delivery Notes &amp; Nearby Landmark (Optional)
        </label>
        <input
          type="text"
          value={formData.notes || ""}
          onChange={(e) => updateField("notes", e.target.value)}
          disabled={disabled}
          placeholder="e.g. Near Banani Graveyard gate, deliver after 2 PM"
          className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-lg text-xs font-sans text-brand-primary placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-primary transition-colors disabled:opacity-50"
        />
      </div>

      {/* Live Zone Estimate Notice */}
      <div className="p-3 bg-brand-surface border border-brand-border rounded-lg flex items-center justify-between text-xs">
        <div>
          <span className="font-heading font-bold uppercase tracking-wider text-brand-primary">
            Courier Zone: {zoneInfo.name}
          </span>
          <span className="block text-[11px] text-brand-muted">
            Delivery Charge: ৳{zoneInfo.rateBdt} • Est. {zoneInfo.estimatedDays}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-brand-accent text-brand-primary">
          Cash On Delivery
        </span>
      </div>
    </div>
  )
}
