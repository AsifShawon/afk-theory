import { CategoryManager } from "@/components/category-manager"
import { DbError } from "@/components/db-error"
import { loadCategoriesState } from "@/lib/data"

export default async function CategoriesPage() {
  let state
  try {
    state = await loadCategoriesState()
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Categories</h1>
      <CategoryManager state={state} />
    </div>
  )
}
