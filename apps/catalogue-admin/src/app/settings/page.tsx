import { CategoryManager } from "@/components/category-manager"
import { DbError } from "@/components/db-error"
import { SettingsForm } from "@/components/settings-form"
import { loadCategories, loadSettings } from "@/lib/data"

export default async function SettingsPage() {
  let settings
  let categories
  try {
    ;[{ settings }, categories] = await Promise.all([loadSettings(), loadCategories()])
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Settings</h1>
      <CategoryManager categories={categories} />
      <SettingsForm initial={settings} />
    </div>
  )
}
