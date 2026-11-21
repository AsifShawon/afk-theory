import type { Metadata } from "next"
import { ListingHero, ListingShell } from "@/components/shop/listing-hero"
import { ProductListing } from "@/components/shop/product-listing"
import { getCatalogue } from "@/lib/catalogue"
import { productsBySlugs } from "@/lib/store"

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The newest AFK THEORY pieces.",
  alternates: { canonical: "/new/" },
}

export default async function NewArrivalsPage() {
  const catalogue = await getCatalogue()
  const products = productsBySlugs(catalogue, catalogue.autoCollections.new)
  return (
    <ListingShell>
      <ListingHero eyebrow="Just dropped" title="New arrivals" crumbs={[{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }]} />
      <ProductListing
        products={products}
        categoryOptions={catalogue.categoryTree
          .filter((n) => products.some((p) => p.category?.trail.includes(n.id)))
          .map((n) => ({ id: n.id, name: n.name, slug: n.slug }))}
        emptyText="Nothing new this week. Check back soon."
      />
    </ListingShell>
  )
}
