import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ListingHero, ListingShell } from "@/components/shop/listing-hero"
import { ProductListing } from "@/components/shop/product-listing"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"
import { allCategoryNodes, categoryAncestors, categoryPathSegments, coverImage, findCategoryByPath, productsInCategory } from "@/lib/store"

export const dynamicParams = false

/** Static export needs at least one path; it renders as a 404 and is left out of the sitemap. */
const EMPTY_PLACEHOLDER = "__none"

export async function generateStaticParams() {
  const nodes = allCategoryNodes(await getCatalogue())
  if (nodes.length === 0) return [{ path: [EMPTY_PLACEHOLDER] }]
  return nodes.map((node) => ({ path: categoryPathSegments(node.href) }))
}

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }): Promise<Metadata> {
  const { path } = await params
  const catalogue = await getCatalogue()
  const node = findCategoryByPath(catalogue, path)
  if (!node) return {}
  const description = node.seoDescription || node.description || `Shop ${node.name} from AFK THEORY. Order on WhatsApp or Messenger, cash on delivery.`
  const image = coverImage(node.image, productsInCategory(catalogue, node.id))
  return {
    title: node.seoTitle ? { absolute: node.seoTitle } : node.name,
    description,
    alternates: { canonical: node.href },
    openGraph: image ? { images: [{ url: absoluteUrl(image.sources[image.sources.length - 1].src) }] } : undefined,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const catalogue = await getCatalogue()
  const node = findCategoryByPath(catalogue, path)
  if (!node) notFound()

  const products = productsInCategory(catalogue, node.id)
  const ancestors = categoryAncestors(catalogue, node)
  const tiles = node.children.map((child) => ({
    name: child.name,
    href: child.href,
    count: child.productCount,
    image: coverImage(child.image, productsInCategory(catalogue, child.id)),
  }))

  return (
    <ListingShell>
      <ListingHero
        eyebrow={`${node.productCount} ${node.productCount === 1 ? "piece" : "pieces"}`}
        title={node.name}
        description={node.description}
        crumbs={[{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }, ...ancestors.map((a) => ({ name: a.name, href: a.href }))]}
        image={node.image}
        tiles={tiles}
      />
      <ProductListing products={products} categoryOptions={node.children.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </ListingShell>
  )
}
