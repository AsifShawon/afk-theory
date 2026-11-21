import Link from "next/link"
import { DEFAULT_SIZES, type ProductInput } from "@dtc/catalogue-core"
import { DbError } from "@/components/db-error"
import { ProductForm } from "@/components/product-form"
import { loadCategories, loadSizeGuides, loadColorPresets, loadProductStoreOptions } from "@/lib/data"

const EMPTY: ProductInput = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  sizeGuideId: null,
  priceBdt: 0,
  compareAtBdt: null,
  categoryId: null,
  status: "draft",
  isFeatured: false,
  sizes: DEFAULT_SIZES,
  soldOutSizes: [],
  details: {},
  sizeChart: { columns: [], rows: [] },
  badge: "none",
  designGroup: "",
  collectionIds: [],
}

export default async function NewProductPage() {
  let categories
  let sizeGuides
  let colorPresets
  let storeOptions
  try {
    ;[categories, sizeGuides, colorPresets, storeOptions] = await Promise.all([
      loadCategories(),
      loadSizeGuides(),
      loadColorPresets(),
      loadProductStoreOptions(null),
    ])
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
        initialDesigns={[]}
        categories={categories}
        imageCount={0}
        sizeGuides={sizeGuides.guides}
        guidesAvailable={!sizeGuides.migrationMissing}
        colorPresets={colorPresets}
        storeOptions={storeOptions}
      />
    </div>
  )
}
