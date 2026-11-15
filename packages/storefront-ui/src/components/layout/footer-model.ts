export interface FooterLinkItem {
  label: string
  href: string
}

export const DEFAULT_CATEGORIES: FooterLinkItem[] = [
  { label: "Drop Shoulder T-Shirts", href: "/categories/drop-shoulder-t-shirts" },
  { label: "Regular T-Shirts", href: "/categories/regular-t-shirts" },
  { label: "Streetwear Shirts", href: "/categories/shirts" },
  { label: "Trousers & Pants", href: "/categories/trousers-&-pants" },
  { label: "Accessories", href: "/categories/accessories" },
]

export const DEFAULT_COLLECTIONS: FooterLinkItem[] = [
  { label: "Drop 01: Offline by Choice", href: "/collections/drop-01-offline-by-choice" },
  { label: "Essentials", href: "/collections/essentials" },
  { label: "Archive Releases", href: "/collections/archive" },
  { label: "All Streetwear", href: "/store" },
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
