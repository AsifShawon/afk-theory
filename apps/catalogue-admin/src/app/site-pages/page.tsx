import { DbError } from "@/components/db-error"
import { PagesManager } from "@/components/pages-manager"
import { loadPagesState } from "@/lib/data"

export default async function SitePagesPage() {
  let state
  try {
    state = await loadPagesState()
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Pages</h1>
      <PagesManager state={state} />
    </div>
  )
}
