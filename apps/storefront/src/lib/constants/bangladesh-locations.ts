/**
 * Bangladesh Locations and Shipping Zones
 * Used for address validation, district selection, and courier zone determination.
 */

export {
  BANGLADESH_DIVISIONS,
  BANGLADESH_DISTRICTS,
  DHAKA_SUBURBAN_KEYWORDS,
  BANGLADESH_SHIPPING_RATES,
  determineBangladeshShippingZone,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
  type BangladeshDivision,
  type BangladeshShippingZone,
  type BangladeshDistrictInfo,
} from "@dtc/commerce-contracts"

import {
  determineBangladeshShippingZone,
  type BangladeshShippingZone,
} from "@dtc/commerce-contracts"

/**
 * Expected Medusa shipping option naming tokens mapped to Bangladesh delivery zones
 */
export const ZONE_SHIPPING_OPTION_PATTERNS: Record<BangladeshShippingZone, RegExp[]> = {
  inside_dhaka: [/inside\s*dhaka/i, /dhaka\s*metro/i, /dhaka\s*city/i],
  dhaka_suburban: [/dhaka\s*suburban/i, /suburban/i, /sub-urban/i],
  outside_dhaka: [/outside\s*dhaka/i, /all\s*bangladesh/i, /nationwide/i, /district/i],
}

/**
 * Matches a Medusa shipping option name to its corresponding Bangladesh shipping zone
 */
export function matchShippingOptionToZone(
  optionName: string
): BangladeshShippingZone | null {
  for (const [zone, patterns] of Object.entries(ZONE_SHIPPING_OPTION_PATTERNS) as [
    BangladeshShippingZone,
    RegExp[]
  ][]) {
    if (patterns.some((pattern) => pattern.test(optionName))) {
      return zone
    }
  }
  return null
}

/**
 * Validates whether a selected shipping option is legally compatible with the customer's shipping address.
 * Prevents choosing Inside Dhaka (৳60) when shipping to Outside Dhaka (৳130) or vice versa.
 */
export function validateShippingOptionForAddress(
  shippingOptionName: string,
  district?: string,
  cityOrArea?: string,
  addressLine?: string
): { isValid: boolean; expectedZone: BangladeshShippingZone; optionZone: BangladeshShippingZone | null; message?: string } {
  const expectedZone = determineBangladeshShippingZone(district, cityOrArea, addressLine)
  const optionZone = matchShippingOptionToZone(shippingOptionName)

  // If option is zone-neutral or unclassifiable, allow it
  if (!optionZone) {
    return { isValid: true, expectedZone, optionZone: null }
  }

  if (expectedZone !== optionZone) {
    const zoneLabels: Record<BangladeshShippingZone, string> = {
      inside_dhaka: "Inside Dhaka (৳60)",
      dhaka_suburban: "Dhaka Suburban (৳100)",
      outside_dhaka: "Outside Dhaka (৳130)",
    }

    return {
      isValid: false,
      expectedZone,
      optionZone,
      message: `The selected shipping method "${shippingOptionName}" does not match your delivery destination (${district || "your address"}). Please select ${zoneLabels[expectedZone]}.`,
    }
  }

  return { isValid: true, expectedZone, optionZone }
}
