import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ListingHero, ListingShell } from "@/components/shop/listing-hero"
import { ProductListing } from "@/components/shop/product-listing"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"
import { coverImage, productsBySlugs } from "@/lib/store"

export const dynamicParams = false

/** Static export needs at least one path; it renders as a 404 and is left out of the sitemap. */
const EMPTY_PLACEHOLDER = "__none"

export async function generateStaticParams() {
  const { collections } = await getCatalogue()
  if (collections.length === 0) return [{ slug: EMPTY_PLACEHOLDER }]
  return collections.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const catalogue = await getCatalogue()
  const collection = catalogue.collections.find((c) => c.slug === slug)
  if (!collection) return {}
  const image = coverImage(collection.image, productsBySlugs(catalogue, collection.productSlugs))
  return {
    title: collection.seoTitle ? { absolute: collection.seoTitle } : collection.name,
    description: collection.seoDescription || collection.description || `The ${collection.name} collection from AFK THEORY.`,
    alternates: { canonical: collection.href },
    openGraph: image ? { images: [{ url: absoluteUrl(image.sources[image.sources.length - 1].src) }] } : undefined,
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const catalogue = await getCatalogue()
  const collection = catalogue.collections.find((c) => c.slug === slug)
  if (!collection) notFound()
  const products = productsBySlugs(catalogue, collection.productSlugs)

  return (
    <ListingShell>
      <ListingHero
        eyebrow="Collection"
        title={collection.name}
        description={collection.description}
        crumbs={[{ name: "Home", href: "/" }, { name: "Collections", href: "/collections/" }]}
        image={collection.image}
      />
      <ProductListing
        products={products}
        categoryOptions={catalogue.categoryTree
          .filter((n) => products.some((p) => p.category?.trail.includes(n.id)))
          .map((n) => ({ id: n.id, name: n.name, slug: n.slug }))}
      />
    </ListingShell>
  )
}
