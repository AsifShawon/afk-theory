"use client"

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void
      queue?: unknown[]
      loaded?: boolean
      version?: string
    }
    _fbq?: unknown
    __META_PIXEL_EVENTS__?: Array<{ event: string; params?: unknown; options?: unknown }>
  }
}

/** Production hostnames permitted to load the live Meta Pixel. */
const PRODUCTION_HOSTNAMES = ["afktheory.com", "www.afktheory.com"]

export interface MetaTrackingOptions {
  pixelId?: string
  hostname?: string
  doNotTrack?: boolean
  consentDenied?: boolean
  testMode?: boolean
}

/**
 * Checks whether Meta Pixel tracking is permitted based on production hostname,
 * valid pixel ID, and user privacy consent settings.
 */
export function isTrackingAllowed(opts?: MetaTrackingOptions): boolean {
  if (typeof window === "undefined" && !opts?.hostname) return false

  const pixelId = opts?.pixelId ?? process.env.NEXT_PUBLIC_META_PIXEL_ID
  if (!pixelId || !pixelId.trim()) return false

  const testMode = opts?.testMode ?? false
  const hostname = opts?.hostname ?? (typeof window !== "undefined" ? window.location.hostname : "")

  const isProd = PRODUCTION_HOSTNAMES.includes(hostname)
  if (!isProd && !testMode) return false

  // Check consent: Do Not Track header or explicit denial in storage
  const dnt =
    opts?.doNotTrack ??
    ((typeof navigator !== "undefined" && navigator.doNotTrack === "1") ||
      (typeof window !== "undefined" && (window as unknown as { doNotTrack?: string }).doNotTrack === "1"))
  if (dnt) return false

  const consentDenied =
    opts?.consentDenied ??
    (typeof window !== "undefined" &&
      (window.localStorage.getItem("cookie_consent") === "denied" || window.localStorage.getItem("afk_consent") === "denied"))
  if (consentDenied) return false

  return true
}

/**
 * Injects and initializes the official Meta Pixel script if permitted.
 */
export function initMetaPixel(opts?: MetaTrackingOptions): boolean {
  if (typeof window === "undefined") return false
  if (!isTrackingAllowed(opts)) return false

  const pixelId = (opts?.pixelId ?? process.env.NEXT_PUBLIC_META_PIXEL_ID)!.trim()

  // Standard Meta Pixel snippet
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (window.__META_PIXEL_EVENTS__) {
        window.__META_PIXEL_EVENTS__.push({ event: String(args[0]), params: args[1], options: args[2] })
      }
      if (fbq.queue) fbq.queue.push(args)
    } as unknown as Window["fbq"] & { queue: unknown[]; loaded: boolean; version: string }
    fbq.queue = []
    fbq.loaded = true
    fbq.version = "2.0"
    window.fbq = fbq
    window._fbq = fbq

    if (!window.__META_PIXEL_EVENTS__) {
      const script = document.createElement("script")
      script.async = true
      script.src = "https://connect.facebook.net/en_US/fbevents.js"
      document.head.appendChild(script)
    }
  }

  window.fbq("consent", "grant")
  window.fbq("init", pixelId)
  return true
}

let lastTrackedPath: string | null = null

/**
 * Tracks PageView on initial load and route changes.
 * Deduplicates consecutive calls with the same pathname.
 */
export function trackPageView(pathname?: string, opts?: MetaTrackingOptions): boolean {
  if (!isTrackingAllowed(opts)) return false
  if (typeof window === "undefined") return false

  const currentPath = pathname ?? window.location.pathname
  if (lastTrackedPath === currentPath) return false
  lastTrackedPath = currentPath

  if (window.fbq) {
    window.fbq("track", "PageView")
    return true
  }
  return false
}

/**
 * Resets the last tracked path (for testing route changes).
 */
export function resetLastTrackedPath(): void {
  lastTrackedPath = null
}

export interface ViewContentProduct {
  metaContentId?: string | null
  name: string
  priceBdt: number
}

/**
 * Tracks ViewContent on a mapped product page.
 * Products without a verified Meta Content ID MUST NOT emit events with guessed IDs.
 */
export function trackViewContent(product: ViewContentProduct, opts?: MetaTrackingOptions): boolean {
  if (!isTrackingAllowed(opts)) return false
  if (!product.metaContentId || !product.metaContentId.trim()) return false

  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: [product.metaContentId.trim()],
      content_type: "product",
      content_name: product.name,
      value: Number(product.priceBdt),
      currency: "BDT",
    })
    return true
  }
  return false
}

export interface AddToCartItem {
  metaContentId?: string | null
  name: string
  unitPriceBdt: number
  quantity: number
}

/**
 * Tracks AddToCart after a successful cart addition or buy now click.
 * Emits only if the product has a verified Meta Content ID.
 */
export function trackAddToCart(item: AddToCartItem, opts?: MetaTrackingOptions): boolean {
  if (!isTrackingAllowed(opts)) return false
  if (!item.metaContentId || !item.metaContentId.trim()) return false

  if (window.fbq) {
    window.fbq("track", "AddToCart", {
      content_ids: [item.metaContentId.trim()],
      content_type: "product",
      content_name: item.name,
      value: Number(item.unitPriceBdt * Math.max(1, item.quantity)),
      currency: "BDT",
    })
    return true
  }
  return false
}

export interface PurchaseLine {
  slug: string
  quantity: number
  unitPriceBdt: number
}

export interface PurchaseOrder {
  code: string
  order: {
    totalBdt: number
    lines: PurchaseLine[]
  }
}

/**
 * Tracks Purchase on successful order placement (/api/order result).
 * Uses server-priced lines and total, deduplicates by order code in sessionStorage,
 * and strictly excludes all customer contact details (PII) from the payload.
 */
export function trackPurchase(
  order: PurchaseOrder,
  metaIdMap?: Record<string, string | null | undefined>,
  opts?: MetaTrackingOptions
): boolean {
  if (!isTrackingAllowed(opts)) return false
  if (typeof window === "undefined") return false
  if (!order || !order.code || !order.order) return false

  const dedupeKey = `afk_meta_purchased_${order.code}`
  try {
    if (window.sessionStorage.getItem(dedupeKey)) {
      return false // Duplicate response or refresh, skip!
    }
    window.sessionStorage.setItem(dedupeKey, "1")
  } catch {
    // If sessionStorage is unavailable, continue
  }

  // Map server-priced lines to exact Meta Content IDs
  const mappedLines = order.order.lines
    .map((l) => ({
      metaId: metaIdMap ? metaIdMap[l.slug]?.trim() : null,
      quantity: l.quantity,
      price: l.unitPriceBdt,
    }))
    .filter((l): l is { metaId: string; quantity: number; price: number } => Boolean(l.metaId))

  const payload: Record<string, unknown> = {
    content_type: "product",
    value: Number(order.order.totalBdt),
    currency: "BDT",
    num_items: order.order.lines.reduce((n, l) => n + l.quantity, 0),
  }

  if (mappedLines.length > 0) {
    payload.content_ids = mappedLines.map((l) => l.metaId)
    payload.contents = mappedLines.map((l) => ({
      id: l.metaId,
      quantity: l.quantity,
      item_price: l.price,
    }))
  }

  if (window.fbq) {
    // Pass order.code as eventID for Meta deduplication
    window.fbq("track", "Purchase", payload, { eventID: order.code })
    return true
  }
  return false
}

/**
 * Tracks chat clicks (Order on WhatsApp or Messenger) separately from purchases.
 * Strictly excludes any customer contact details.
 */
export function trackChatClick(channel: "whatsapp" | "messenger", opts?: MetaTrackingOptions): boolean {
  if (!isTrackingAllowed(opts)) return false
  if (typeof window === "undefined") return false

  if (window.fbq) {
    window.fbq("trackCustom", "ChatOrderClick", { channel })
    return true
  }
  return false
}
