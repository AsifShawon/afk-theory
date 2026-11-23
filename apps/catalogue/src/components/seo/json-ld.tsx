import type { CatalogueProduct } from "@dtc/catalogue-core"
import { absoluteUrl } from "@/lib/catalogue"

/** Structured data for search engines. `<` is escaped so text cannot close the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}

/** Stable absolute identifier for the store's return and exchange policy. */
export function returnPolicyId(): string {
  return absoluteUrl("/delivery-returns/#return-policy")
}

/**
 * Checks whether the catalogue contains a published, non-empty return policy page.
 * Returns false if the page is missing, has empty HTML, or contains only whitespace/tags.
 */
export function hasReturnPolicyPage(pages?: { slug: string; html?: string }[]): boolean {
  const page = pages?.find((p) => p.slug === "delivery-returns")
  if (!page || !page.html) return false
  return page.html.replace(/<[^>]*>/g, "").trim().length > 0
}

/**
 * MerchantReturnPolicy structured data using Google's organization-level link option.
 * Points to the canonical /delivery-returns/ page for the full exchange terms.
 */
export function returnPolicyJsonLd() {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": returnPolicyId(),
    applicableCountry: "BD",
    merchantReturnLink: absoluteUrl("/delivery-returns/"),
  }
}

/** Breadcrumb trail, top first, ending with the current page. */
export function breadcrumbJsonLd(trail: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  }
}

/** The products a listing page shows, in order. */
export function itemListJsonLd(products: CatalogueProduct[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}/`),
      name: p.name,
    })),
  }
}

/**
 * Product structured data for search engines.
 * A valid Offer satisfies Google's product snippet requirement.
 * Links to the store-wide return policy if available.
 */
export function productJsonLd(product: CatalogueProduct, policyId?: string | null) {
  const images = product.images
    .map((img) => (img.sources.length ? absoluteUrl(img.sources[img.sources.length - 1].src) : null))
    .filter((src): src is string => Boolean(src))

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.tagline,
    image: images,
    brand: { "@type": "Brand", name: "AFK THEORY" },
    offers: {
      "@type": "Offer",
      price: product.priceBdt,
      priceCurrency: "BDT",
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: absoluteUrl(`/products/${product.slug}/`),
      ...(policyId ? { hasMerchantReturnPolicy: { "@id": policyId } } : {}),
    },
  }
}

/**
 * Site-wide entities: the brand (Organization) and the site (WebSite). Google
 * uses these to understand the brand and its name in search results.
 * When a published return policy exists, the Organization entity is extended
 * with hasMerchantReturnPolicy.
 */
export function siteJsonLd(
  settings: { instagramHandle: string; whatsappNumber: string },
  pages?: { slug: string; html?: string }[]
) {
  const sameAs = [
    settings.instagramHandle ? `https://instagram.com/${settings.instagramHandle}` : null,
  ].filter((v): v is string => Boolean(v))
  const phone = settings.whatsappNumber ? `+${settings.whatsappNumber.replace(/\D/g, "")}` : null
  const hasPolicy = hasReturnPolicyPage(pages)

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: "AFK THEORY",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/brand/afk-theory-logo.webp"),
      ...(sameAs.length ? { sameAs } : {}),
      ...(phone ? { contactPoint: { "@type": "ContactPoint", telephone: phone, contactType: "customer service", areaServed: "BD" } } : {}),
      ...(hasPolicy ? { hasMerchantReturnPolicy: returnPolicyJsonLd() } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "AFK THEORY",
      url: absoluteUrl("/"),
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/search/?q={search_term_string}") },
        "query-input": "required name=search_term_string",
      },
    },
  ]
}
