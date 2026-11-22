/**
 * Online checkout switch. Set NEXT_PUBLIC_CHECKOUT=1 in the hosting
 * provider's build settings once the order endpoint and email are set up
 * (see README). Off: the site orders through WhatsApp and Messenger only, as
 * before. Next inlines the value at build time.
 */
export const CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_CHECKOUT === "1"

/** sessionStorage key for the order just placed, read by /order/confirmed/. */
export const LAST_ORDER_KEY = "afk-last-order-v1"

/** Random key for one checkout attempt, so a retry never places a second order. */
export function newIdempotencyKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return `co_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`
}

/** What the header, tab bar and drawer call the list of picked items. */
export const CART_LABEL = CHECKOUT_ENABLED ? "Cart" : "Order list"

/** One line on how ordering works, for meta descriptions. */
export const ORDER_HOW = CHECKOUT_ENABLED ? "Order online or on WhatsApp" : "Order on WhatsApp or Messenger"
