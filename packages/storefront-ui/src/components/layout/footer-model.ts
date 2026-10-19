export interface FooterLinkItem {
  label: string
  href: string
}

export const DEFAULT_CATEGORIES: FooterLinkItem[] = [
  { label: "Drop Shoulder T-Shirts", href: "/category?handle=drop-shoulder-tees" },
  { label: "Oversized Tees", href: "/shop" },
  { label: "Streetwear Essentials", href: "/collection?handle=essentials" },
  { label: "Future Drops Archive", href: "/shop" },
]

export const DEFAULT_COLLECTIONS: FooterLinkItem[] = [
  { label: "Drop 01: Offline by Choice", href: "/collection?handle=drop-01" },
  { label: "New Arrivals", href: "/collection?handle=new-arrivals" },
  { label: "Essentials", href: "/collection?handle=essentials" },
  { label: "All Streetwear", href: "/shop" },
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
