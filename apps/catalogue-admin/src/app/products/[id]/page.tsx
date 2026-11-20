import Link from "next/link"
import { notFound } from "next/navigation"
import { DbError } from "@/components/db-error"
import { ImageManager } from "@/components/image-manager"
import { ProductForm } from "@/components/product-form"
import { Badge, Notice } from "@/components/ui"
import { descriptionToHtml } from "@dtc/catalogue-core"
import { loadCategories, loadProduct, loadSizeGuides } from "@/lib/data"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const { id } = await params
  const { created } = await searchParams
  if (!UUID.test(id)) notFound()

  let data
  let categories
  let sizeGuides
  try {
    ;[data, categories, sizeGuides] = await Promise.all([loadProduct(id), loadCategories(), loadSizeGuides()])
  } catch (err) {
    return <DbError error={err} />
  }
  if (!data) notFound()

  const { product, colors, images } = data

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <Link href="/" className="text-sm font-semibold text-brand-muted hover:text-brand-graphite">
        Back to products
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{product.name}</h1>
        <Badge tone={product.status === "published" ? "live" : "neutral"}>{product.status}</Badge>
      </div>

      {created && images.length === 0 && (
        <Notice tone="success">
          <strong>{product.name} is created as a draft.</strong> Next, drop its photos below. Then set Status to Published, save, and press Publish at the top.
          {created === "publish" && " It was saved as a draft because a product needs photos before it can go live."}
        </Notice>
      )}

      <ImageManager productId={product.id} images={images} colors={colors} />

      <ProductForm
        key={product.updated_at}
        id={product.id}
        imageCount={images.length}
        categories={categories}
        sizeGuides={sizeGuides.guides}
        guidesAvailable={!sizeGuides.migrationMissing}
        initial={{
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          // Older plain-text descriptions open in the editor as paragraphs.
          description: descriptionToHtml(product.description),
          seoTitle: product.seo_title ?? "",
          seoDescription: product.seo_description ?? "",
          sizeGuideId: product.size_guide_id ?? null,
          priceBdt: product.price_bdt,
          compareAtBdt: product.compare_at_bdt,
          categoryId: product.category_id,
          status: product.status,
          isFeatured: product.is_featured,
          sizes: product.sizes,
          soldOutSizes: product.sold_out_sizes,
          details: product.details ?? {},
          sizeChart: product.size_chart ?? { columns: [], rows: [] },
        }}
        initialColors={colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, inStock: c.in_stock }))}
      />
    </div>
  )
}
