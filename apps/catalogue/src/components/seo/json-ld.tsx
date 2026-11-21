import type { CatalogueProduct } from "@dtc/catalogue-core"
import { absoluteUrl } from "@/lib/catalogue"

/** Structured data for search engines. `<` is escaped so text cannot close the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
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
 * Site-wide entities: the brand (Organization) and the site (WebSite). Google
 * uses these to understand the brand and its name in search results.
 */
export function siteJsonLd(settings: { instagramHandle: string; whatsappNumber: string }) {
  const sameAs = [
    settings.instagramHandle ? `https://instagram.com/${settings.instagramHandle}` : null,
  ].filter((v): v is string => Boolean(v))
  const phone = settings.whatsappNumber ? `+${settings.whatsappNumber.replace(/\D/g, "")}` : null
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AFK THEORY",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/brand/afk-theory-logo.webp"),
      ...(sameAs.length ? { sameAs } : {}),
      ...(phone ? { contactPoint: { "@type": "ContactPoint", telephone: phone, contactType: "customer service", areaServed: "BD" } } : {}),
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
