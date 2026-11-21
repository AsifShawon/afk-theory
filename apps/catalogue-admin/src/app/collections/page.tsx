import { CollectionManager } from "@/components/collection-manager"
import { DbError } from "@/components/db-error"
import { loadCollectionsState } from "@/lib/data"

export default async function CollectionsPage() {
  let state
  try {
    state = await loadCollectionsState()
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Collections</h1>
      <CollectionManager state={state} />
    </div>
  )
}
