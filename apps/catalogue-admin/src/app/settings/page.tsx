import { CategoryManager } from "@/components/category-manager"
import { DbError } from "@/components/db-error"
import { SettingsForm } from "@/components/settings-form"
import { SizeGuideManager } from "@/components/size-guide-manager"
import { loadCategories, loadSettings, loadSizeGuides } from "@/lib/data"

export default async function SettingsPage() {
  let settings
  let categories
  let sizeGuides
  try {
    ;[{ settings }, categories, sizeGuides] = await Promise.all([loadSettings(), loadCategories(), loadSizeGuides()])
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Settings</h1>
      <CategoryManager categories={categories} />
      <SizeGuideManager state={sizeGuides} />
      <SettingsForm initial={settings} />
    </div>
  )
}
