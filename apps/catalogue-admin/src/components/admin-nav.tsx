import Link from "next/link"
import { loadPublishStatus, type PublishStatus } from "@/lib/data"
import { PublishButton } from "./publish-button"

const NAV_LINKS = [
  { href: "/", label: "Products" },
  { href: "/products/new", label: "New product" },
  { href: "/categories", label: "Categories" },
  { href: "/collections", label: "Collections" },
  { href: "/site-pages", label: "Pages" },
  { href: "/homepage", label: "Homepage" },
  { href: "/settings", label: "Settings" },
]

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
      <div className="mx-auto flex min-h-[4rem] max-w-content items-center gap-6 px-6 py-2">
        <Link href="/" className="font-display text-lg font-bold uppercase tracking-tight">
          AFK <span className="text-brand-accent">Theory</span>
          <span className="ml-2 text-xs font-medium tracking-[0.2em] text-brand-muted-light">ADMIN</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-accent">
              {link.label}
            </Link>
          ))}
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
