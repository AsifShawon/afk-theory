/**
 * Bangladesh Locations and Shipping Zones
 * Used for address validation, district selection, and courier zone determination.
 */

export {
  BANGLADESH_DIVISIONS,
  BANGLADESH_DISTRICTS,
  DHAKA_SUBURBAN_KEYWORDS,
  BANGLADESH_SHIPPING_RATES,
  ZONE_DISPLAY_LABELS,
  ZONE_SHIPPING_OPTION_PATTERNS,
  findBangladeshDistrict,
  classifyBangladeshDeliveryAddress,
  determineBangladeshShippingZone,
  matchShippingOptionToZone,
  validateShippingOptionForAddress,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
  type BangladeshDivision,
  type BangladeshShippingZone,
  type BangladeshDistrictInfo,
  type DeliveryClassificationResult,
} from "@dtc/commerce-contracts"
