import Link from "next/link"
import { ProductList } from "@/components/product-list"
import { Notice } from "@/components/ui"
import { loadProductList } from "@/lib/data"
import { DbError } from "@/components/db-error"

export default async function ProductsPage() {
  let products
  try {
    products = await loadProductList()
  } catch (err) {
    return <DbError error={err} />
  }

  const published = products.filter((p) => p.status === "published").length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {products.length} total, {published} published. Drag rows to change the order on the site.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex h-10 items-center rounded-base bg-brand-graphite px-4 text-sm font-semibold text-brand-bone hover:bg-brand-graphite-light"
        >
          New product
        </Link>
      </div>
      {products.length === 0 ? (
        <Notice tone="info">
          No products yet. Create one, or load the starter product with <code>pnpm catalogue-admin:seed</code>.
        </Notice>
      ) : (
        <ProductList initial={products} />
      )}
    </div>
  )
}
