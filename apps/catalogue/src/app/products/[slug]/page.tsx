import type { Metadata } from "next"
import { SEO_LIMITS, truncateText } from "@dtc/catalogue-core"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"
import { ProductView } from "@/components/product/product-view"
import { breadcrumbJsonLd, hasReturnPolicyPage, JsonLd, productJsonLd, returnPolicyId } from "@/components/seo/json-ld"
import { absoluteUrl, getCatalogue, getProduct, getRelated } from "@/lib/catalogue"

export const dynamicParams = false

export async function generateStaticParams() {
  const { products } = await getCatalogue()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const image = product.images[0]
  const largest = image.sources[image.sources.length - 1]
  // Search title and description from the admin win; otherwise name and tagline.
  const fullTitle = product.seoTitle || `${product.name} | AFK THEORY`
  const description =
    product.seoDescription || product.tagline || truncateText(product.description, SEO_LIMITS.description) || `${product.name} by AFK THEORY.`
  return {
    title: product.seoTitle ? { absolute: product.seoTitle } : product.name,
    description,
    alternates: { canonical: `/products/${product.slug}/` },
    openGraph: {
      title: fullTitle,
      description,
      url: `/products/${product.slug}/`,
      images: [{ url: absoluteUrl(largest.src), width: largest.width, height: Math.round((largest.width * image.height) / image.width), alt: image.alt }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [absoluteUrl(largest.src)] },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const catalogue = await getCatalogue()
  const product = await getProduct(slug)
  if (!product) notFound()
  const related = getRelated(catalogue, product)
  const policyId = hasReturnPolicyPage(catalogue.pages) ? returnPolicyId() : null

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          ...(product.category ? [{ name: product.category.name, href: product.category.href }] : [{ name: "Shop", href: "/shop/" }]),
          { name: product.name, href: `/products/${product.slug}/` },
        ])}
      />
      <JsonLd data={productJsonLd(product, policyId)} />
      <ProductView product={product} settings={catalogue.settings} />
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="bg-brand-bone py-20 text-brand-graphite md:py-28">
          <div className="mx-auto max-w-editorial px-5 md:px-10">
            <h2 id="related-title" className="display text-5xl md:text-6xl">
              Also in the collection
            </h2>
            <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} sizes="(min-width: 1024px) 22vw, 50vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
