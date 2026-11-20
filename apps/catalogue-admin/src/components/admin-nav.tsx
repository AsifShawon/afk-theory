import Link from "next/link"
import { loadPublishStatus, type PublishStatus } from "@/lib/data"
import { PublishButton } from "./publish-button"

export async function AdminNav() {
  let status: PublishStatus | null = null
  let error: string | null = null
  try {
    status = await loadPublishStatus()
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-brand-graphite-light bg-brand-graphite text-brand-bone">
      <div className="mx-auto flex h-16 max-w-content items-center gap-8 px-6">
        <Link href="/" className="font-display text-lg font-bold uppercase tracking-tight">
          AFK <span className="text-brand-accent">Theory</span>
          <span className="ml-2 text-xs font-medium tracking-[0.2em] text-brand-muted-light">ADMIN</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/" className="hover:text-brand-accent">Products</Link>
          <Link href="/products/new" className="hover:text-brand-accent">New product</Link>
          <Link href="/settings" className="hover:text-brand-accent">Settings</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {status && (
            <a href={status.previewUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-muted-light hover:text-brand-bone">
              Preview site
            </a>
          )}
          {status ? <PublishButton status={status} /> : <span className="max-w-xs truncate text-xs text-red-300" title={error ?? ""}>Database not reachable</span>}
        </div>
      </div>
    </header>
  )
}
