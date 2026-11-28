import { BANGLADESH_SHIPPING_RATES, classifyBangladeshDeliveryAddress, type BangladeshShippingZone } from "@dtc/commerce-contracts"
import {
  formatCustomDtfDesignSummary,
  getCustomGarmentConfig,
  priceCustomDtfItem,
} from "../custom-hoodie"
import type { DeliveryZone } from "../types"
import { MAX_LINE_QUANTITY, type CheckoutCustomer, type CheckoutLine } from "./schema"

export type ShippingZone = BangladeshShippingZone

/**
 * What the server needs to know about a product to price an order. The order
 * endpoint loads this from Supabase; the site never sends it.
 */
export interface OrderableProduct {
  id: string
  slug: string
  name: string
  priceBdt: number
  published: boolean
  sizes: string[]
  soldOutSizes: string[]
  colors: { name: string; inStock: boolean }[]
  designs: { name: string; inStock: boolean }[]
}

export interface DeliveryQuote {
  zone: ShippingZone
  /** Name of the matching zone in Settings, for example "Inside Dhaka". */
  label: string
  feeBdt: number
  eta: string
}

/** How each courier zone is recognised among the zones written in Settings. */
const ZONE_NAME_PATTERNS: Record<ShippingZone, RegExp> = {
  inside_dhaka: /inside\s*dhaka|dhaka\s*(city|metro)/i,
  dhaka_suburban: /suburb|sub-urban|outskirt/i,
  outside_dhaka: /outside\s*dhaka|all\s*(other|bangladesh)|nationwide/i,
}

/**
 * Delivery fee for an address. The zone comes from the district (and, inside
 * Dhaka district, suburb names in the address); the fee from the matching
 * zone in Settings. If Settings has no matching zone, the standard courier
 * rate is used so an order can always be priced.
 */
export function quoteDelivery(district: string, address: string, zones: DeliveryZone[]): DeliveryQuote | null {
  const result = classifyBangladeshDeliveryAddress({ district, addressLine: address })
  if (!result.isValid || !result.zone) return null
  const zone = result.zone
  const configured = zones.find((z) => ZONE_NAME_PATTERNS[zone].test(z.name))
  if (configured && Number.isInteger(configured.feeBdt) && configured.feeBdt >= 0) {
    return { zone, label: configured.name, feeBdt: configured.feeBdt, eta: configured.eta }
  }
  const fallback = BANGLADESH_SHIPPING_RATES[zone]
  return { zone, label: fallback.name, feeBdt: fallback.rateBdt, eta: fallback.estimatedDays }
}

export interface PricedLine {
  productId: string
  slug: string
  name: string
  color: string | null
  design: string | null
  size: string | null
  quantity: number
  unitPriceBdt: number
  lineTotalBdt: number
}

export interface PricedOrder {
  lines: PricedLine[]
  subtotalBdt: number
  delivery: DeliveryQuote
  totalBdt: number
}

export type OrderProblem =
  | { kind: "unavailable"; slug: string; message: string }
  | { kind: "sold_out"; slug: string; message: string }
  | { kind: "invalid_option"; slug: string; message: string }
  | { kind: "too_many"; slug: string; message: string }
  | { kind: "price_changed"; slug: string; message: string; priceBdt: number }
  | { kind: "delivery"; message: string }

export type PriceResult = { ok: true; order: PricedOrder } | { ok: false; problems: OrderProblem[] }

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Prices an order from the server's own product data. Prices sent by the
 * browser are only compared, never used: a changed price is reported so the
 * customer can see the new total before ordering.
 */
export function priceOrder(input: {
  lines: CheckoutLine[]
  customer: Pick<CheckoutCustomer, "district" | "address">
  products: OrderableProduct[]
  deliveryZones: DeliveryZone[]
}): PriceResult {
  const problems: OrderProblem[] = []
  const bySlug = new Map(input.products.map((p) => [p.slug, p]))
  const merged = new Map<string, PricedLine>()

  for (const line of input.lines) {
    const customGarment = getCustomGarmentConfig(line.slug)
    const lookupSlug = customGarment ? customGarment.baseProductSlug : line.slug
    const product = bySlug.get(lookupSlug)
    if (!product || !product.published) {
      problems.push({ kind: "unavailable", slug: line.slug, message: "This item is no longer available" })
      continue
    }

    const color = resolveOption(product.colors, line.color)
    const design = customGarment ? null : resolveOption(product.designs, line.design)
    const size = line.size ? product.sizes.find((s) => same(s, line.size!)) ?? null : null
    const label = customGarment ? customGarment.customProductName : product.name

    if (color === undefined || design === undefined || (product.sizes.length > 0 && !size) || (product.sizes.length === 0 && line.size)) {
      problems.push({ kind: "invalid_option", slug: line.slug, message: `Pick the color, design and size again for ${label}` })
      continue
    }
    if (
      (color && !color.inStock) ||
      (design && !design.inStock) ||
      (size && product.soldOutSizes.some((s) => same(s, size)))
    ) {
      const variant = [design?.name, color?.name, size].filter(Boolean).join(" / ")
      problems.push({ kind: "sold_out", slug: line.slug, message: `${label}${variant ? ` (${variant})` : ""} is sold out` })
      continue
    }

    const expectedPriceBdt = customGarment
      ? priceCustomDtfItem(line.customDtf?.placements ?? [], customGarment.customBasePriceBdt).unitPriceBdt
      : product.priceBdt

    if (line.unitPriceBdt !== expectedPriceBdt) {
      problems.push({ kind: "price_changed", slug: line.slug, priceBdt: expectedPriceBdt, message: `The price of ${label} is now ${expectedPriceBdt}` })
      continue
    }

    const resolvedDesignName = customGarment
      ? formatCustomDtfDesignSummary(line.customDtf?.placements ?? [], line.customDtf?.artworkNote)
      : design?.name ?? null

    const key = [line.slug, resolvedDesignName ?? "", color?.name ?? "", size ?? ""].join("|")
    const existing = merged.get(key)
    const quantity = (existing?.quantity ?? 0) + line.quantity
    if (quantity > MAX_LINE_QUANTITY) {
      problems.push({ kind: "too_many", slug: line.slug, message: `At most ${MAX_LINE_QUANTITY} of one item per order` })
      continue
    }
    merged.set(key, {
      productId: product.id,
      slug: line.slug,
      name: label,
      color: color?.name ?? null,
      design: resolvedDesignName,
      size,
      quantity,
      unitPriceBdt: expectedPriceBdt,
      lineTotalBdt: expectedPriceBdt * quantity,
    })
  }

  const delivery = quoteDelivery(input.customer.district, input.customer.address, input.deliveryZones)
  if (!delivery) problems.push({ kind: "delivery", message: "Choose your district" })

  if (problems.length > 0 || !delivery) return { ok: false, problems }

  const lines = [...merged.values()]
  const subtotalBdt = lines.reduce((sum, l) => sum + l.lineTotalBdt, 0)
  return { ok: true, order: { lines, subtotalBdt, delivery, totalBdt: subtotalBdt + delivery.feeBdt } }
}

/**
 * The option matching `name`. null when the product has no options of this
 * kind (and none was sent); undefined when the choice is missing or unknown.
 * With a single option and no choice sent, that option is used.
 */
function resolveOption<T extends { name: string }>(options: T[], name: string | null): T | null | undefined {
  if (options.length === 0) return name ? undefined : null
  if (!name) return options.length === 1 ? options[0] : undefined
  return options.find((o) => same(o.name, name))
}
