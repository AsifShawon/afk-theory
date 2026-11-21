import type { Metadata } from "next"
import { breadcrumbJsonLd, itemListJsonLd, JsonLd } from "@/components/seo/json-ld"
import { ListingHero, ListingShell } from "@/components/shop/listing-hero"
import { ProductListing } from "@/components/shop/product-listing"
import { getCatalogue } from "@/lib/catalogue"
import { coverImage, productsInCategory } from "@/lib/store"

export const metadata: Metadata = {
  title: "Shop all",
  description: "Every AFK THEORY piece in one place. Filter by category, color, size and price, then order on WhatsApp or Messenger.",
  alternates: { canonical: "/shop/" },
}

export default async function ShopPage() {
  const catalogue = await getCatalogue()
  const tiles = catalogue.categoryTree.map((node) => {
    const products = productsInCategory(catalogue, node.id)
    return { name: node.name, href: node.href, count: node.productCount, image: coverImage(node.image, products) }
  })

  return (
    <ListingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Shop all", href: "/shop/" }])} />
      <JsonLd data={itemListJsonLd(catalogue.products)} />
      <ListingHero eyebrow={`${catalogue.products.length} pieces`} title="Shop all" crumbs={[{ name: "Home", href: "/" }]} tiles={tiles.length > 1 ? tiles : []} />
      <ProductListing
        products={catalogue.products}
        categoryOptions={catalogue.categoryTree.map((n) => ({ id: n.id, name: n.name, slug: n.slug }))}
      />
    </ListingShell>
  )
}
