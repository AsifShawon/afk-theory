import Link from "next/link"
import { DbError } from "@/components/db-error"
import { SettingsForm } from "@/components/settings-form"
import { SizeGuideManager } from "@/components/size-guide-manager"
import { loadSettings, loadSizeGuides } from "@/lib/data"

export default async function SettingsPage() {
  let settings
  let sizeGuides
  try {
    ;[{ settings }, sizeGuides] = await Promise.all([loadSettings(), loadSizeGuides()])
  } catch (err) {
    return <DbError error={err} />
  }

  return (
    <div className="mx-auto max-w-narrow space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Settings</h1>
      <p className="text-sm text-brand-muted">
        Categories now have their own screen:{" "}
        <Link href="/categories" className="font-semibold text-brand-graphite underline">
          Categories
        </Link>
        .
      </p>
      <SizeGuideManager state={sizeGuides} />
      <SettingsForm initial={settings} />
    </div>
  )
}
