import type { Metadata } from "next"
import { ListingHero, ListingShell } from "@/components/shop/listing-hero"
import { ProductListing } from "@/components/shop/product-listing"
import { getCatalogue } from "@/lib/catalogue"
import { productsBySlugs } from "@/lib/store"

export const metadata: Metadata = {
  title: "Sale",
  description: "AFK THEORY pieces at a lower price, while they last.",
  alternates: { canonical: "/sale/" },
}

export default async function SalePage() {
  const catalogue = await getCatalogue()
  const products = productsBySlugs(catalogue, catalogue.autoCollections.sale)
  return (
    <ListingShell>
      <ListingHero eyebrow="Lower prices" title="Sale" crumbs={[{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }]} />
      <ProductListing products={products} emptyText="Nothing on sale right now." />
    </ListingShell>
  )
}
