import { DbError } from "@/components/db-error"
import { HomeSectionsManager } from "@/components/home-sections-manager"
import { loadHomepageState } from "@/lib/data"

export default async function HomepagePage() {
  let state
  try {
    state = await loadHomepageState()
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Homepage</h1>
      <HomeSectionsManager state={state} />
    </div>
  )
}
