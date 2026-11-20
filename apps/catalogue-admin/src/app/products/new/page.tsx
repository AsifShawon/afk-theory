import Link from "next/link"
import { DEFAULT_SIZES, type ProductInput } from "@dtc/catalogue-core"
import { DbError } from "@/components/db-error"
import { ProductForm } from "@/components/product-form"
import { loadCategories } from "@/lib/data"

const EMPTY: ProductInput = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  priceBdt: 0,
  compareAtBdt: null,
  categoryId: null,
  status: "draft",
  isFeatured: false,
  sizes: DEFAULT_SIZES,
  soldOutSizes: [],
  details: {},
  sizeChart: { columns: [], rows: [] },
}

export default async function NewProductPage() {
  let categories
  try {
    categories = await loadCategories()
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <Link href="/" className="text-sm font-semibold text-brand-muted hover:text-brand-graphite">
        Back to products
      </Link>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">New product</h1>
      <p className="text-sm text-brand-muted">Fill in the basics and create it as a draft. You can add images on the next screen.</p>
      <ProductForm
        id={null}
        initial={{ ...EMPTY, categoryId: categories[0]?.id ?? null }}
        initialColors={[{ name: "Graphite Black", hex: "#20241F", inStock: true }]}
        categories={categories}
        imageCount={0}
      />
    </div>
  )
}
