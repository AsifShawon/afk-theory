import { HOME_SECTION_IDS, type HomeSection, type HomeSectionId, type SitePageSlug } from "./types"

export const HOME_SECTION_LABELS: Record<HomeSectionId, { label: string; hint: string }> = {
  categories: { label: "Shop by category", hint: "Tiles for each top-level category" },
  "new-arrivals": { label: "New arrivals", hint: "A swipeable row of the newest products" },
  bestsellers: { label: "Best sellers", hint: "Products marked Bestseller or Featured" },
  "shop-teaser": { label: "The collection", hint: "Six products with a Shop all link" },
  "collection-spotlight": { label: "Collection spotlight", hint: "A banner for a collection set to show on home" },
  lookbook: { label: "Lookbook", hint: "On-model photos" },
  trust: { label: "Trust strip", hint: "Cash on delivery, delivery times, exchanges" },
  "how-to-order": { label: "How to order", hint: "The WhatsApp and Messenger steps" },
  faq: { label: "FAQ", hint: "Short FAQ from Settings" },
}

export const DEFAULT_HOME_SECTIONS: HomeSection[] = HOME_SECTION_IDS.map((id) => ({ id, enabled: true }))

const isSectionId = (value: unknown): value is HomeSectionId =>
  typeof value === "string" && (HOME_SECTION_IDS as readonly string[]).includes(value)

/**
 * The saved order with unknown and repeated ids dropped. Sections added to
 * the site after the list was saved are appended, switched on, so a new
 * section never silently stays hidden.
 */
export function normalizeHomeSections(stored: unknown): HomeSection[] {
  const result: HomeSection[] = []
  const seen = new Set<HomeSectionId>()
  if (Array.isArray(stored)) {
    for (const item of stored) {
      const id = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined
      if (!isSectionId(id) || seen.has(id)) continue
      seen.add(id)
      result.push({ id, enabled: (item as { enabled?: unknown }).enabled !== false })
    }
  }
  for (const section of DEFAULT_HOME_SECTIONS) {
    if (!seen.has(section.id)) result.push({ ...section })
  }
  return result
}

export const SITE_PAGE_DEFAULTS: Record<SitePageSlug, { title: string; hint: string }> = {
  about: { title: "About AFK THEORY", hint: "Who you are and how the clothes are made" },
  "delivery-returns": { title: "Delivery and returns", hint: "Delivery areas, times, fees and the exchange policy" },
  contact: { title: "Contact", hint: "WhatsApp, Messenger, Instagram and opening hours" },
  privacy: { title: "Privacy policy", hint: "What you do with names, phone numbers and addresses from orders" },
  terms: { title: "Terms", hint: "Order, payment and exchange terms" },
}
