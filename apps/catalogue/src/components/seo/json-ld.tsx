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
