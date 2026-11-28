import { CustomDesignsManager } from "@/components/custom-designs-manager"
import { DbError } from "@/components/db-error"
import { loadCustomDesignsState } from "@/lib/data"

export default async function CustomDesignsPage() {
  let state
  try {
    state = await loadCustomDesignsState()
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-content space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Custom gallery</h1>
      <CustomDesignsManager state={state} />
    </div>
  )
}
