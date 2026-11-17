import { PRODUCT_LINES } from "@dtc/commerce-contracts"

export interface FooterLinkItem {
  label: string
  href: string
}

/** Hoodie styles (Medusa categories). */
export const DEFAULT_CATEGORIES: FooterLinkItem[] = PRODUCT_LINES.flatMap((line) =>
  line.styles.map((style) => ({
    label: style.title,
    href: `/categories/${style.handle}`,
  }))
)

/** Product lines (Medusa collections) plus a link to everything. */
export const DEFAULT_COLLECTIONS: FooterLinkItem[] = [
  ...PRODUCT_LINES.map((line) => ({
    label: line.title,
    href: `/collections/${line.handle}`,
  })),
  { label: "All Pieces", href: "/store" },
]

export const DEFAULT_CUSTOMER_CARE: FooterLinkItem[] = [
  { label: "Size & Fit Guide", href: "/size-guide" },
  { label: "Frequently Asked Questions (FAQ)", href: "/faq" },
  { label: "About The Theory", href: "/about" },
  { label: "Customer Care & Support", href: "/contact" },
  { label: "Shipping & Delivery Rates", href: "/shipping-policy" },
  { label: "Return & Exchange Policy", href: "/return-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
]

export function deduplicateFooterLinks(links: FooterLinkItem[] = []): FooterLinkItem[] {
  const seen = new Set<string>()
  return links.filter((link) => {
    if (!link?.href || seen.has(link.href)) {
      return false
    }
    seen.add(link.href)
    return true
  })
}
