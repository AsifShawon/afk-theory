import Link from "next/link"
import { notFound } from "next/navigation"
import { DbError } from "@/components/db-error"
import { ImageManager } from "@/components/image-manager"
import { ProductForm } from "@/components/product-form"
import { Badge } from "@/components/ui"
import { loadCategories, loadProduct } from "@/lib/data"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()

  let data
  let categories
  try {
    ;[data, categories] = await Promise.all([loadProduct(id), loadCategories()])
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

      <ImageManager productId={product.id} images={images} colors={colors} />

      <ProductForm
        key={product.updated_at}
        id={product.id}
        imageCount={images.length}
        categories={categories}
        initial={{
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          description: product.description,
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
