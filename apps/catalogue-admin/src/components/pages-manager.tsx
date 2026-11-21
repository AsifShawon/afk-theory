"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { SITE_PAGE_DEFAULTS, SITE_PAGE_SLUGS, type SitePageRow, type SitePageSlug } from "@dtc/catalogue-core"
import { saveSitePage } from "@/app/actions/content"
import type { PagesState } from "@/lib/data"
import { RichTextEditor } from "./rich-text-editor"
import { MigrationNotice, SeoFields } from "./store-ui"
import { Badge, Button, Card, Field, Notice, TextInput } from "./ui"

/** One editor per content page. Empty pages are hidden on the site. */
export function PagesManager({ state }: { state: PagesState }) {
  const [open, setOpen] = useState<SitePageSlug | null>(null)

  if (state.migrationMissing) {
    return (
      <Card title="Pages">
        <MigrationNotice feature="Content pages" />
      </Card>
    )
  }

  return (
    <Card title="Pages">
      <p className="mb-4 text-sm text-brand-muted">
        Text pages linked from the menu and footer. The page title is the main heading, so start sections with Heading (H2). A page with no text stays
        hidden on the site.
      </p>
      <ul className="divide-y divide-brand-border">
        {SITE_PAGE_SLUGS.map((slug) => {
          const row = state.pages.find((p) => p.slug === slug) ?? null
          return (
            <li key={slug} className="py-3">
              <button type="button" onClick={() => setOpen(open === slug ? null : slug)} className="flex w-full items-center gap-3 text-left" aria-expanded={open === slug}>
                <span className="font-semibold">{row?.title || SITE_PAGE_DEFAULTS[slug].title}</span>
                <span className="text-xs text-brand-muted">/{slug}/</span>
                {row?.html ? <Badge tone="live">Written</Badge> : <Badge tone="warn">Empty: hidden</Badge>}
                <span className="ml-auto text-sm font-semibold text-brand-muted">{open === slug ? "Close" : "Edit"}</span>
              </button>
              {open === slug && <PageEditor slug={slug} row={row} />}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function PageEditor({ slug, row }: { slug: SitePageSlug; row: SitePageRow | null }) {
  const router = useRouter()
  const [draft, setDraft] = useState({
    title: row?.title || SITE_PAGE_DEFAULTS[slug].title,
    html: row?.html ?? "",
    seoTitle: row?.seo_title ?? "",
    seoDescription: row?.seo_description ?? "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () => {
    setNotice(null)
    setErrors({})
    startTransition(async () => {
      const result = await saveSitePage({ slug, ...draft })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setNotice({ tone: "error", text: Object.values(result.fieldErrors ?? {})[0] ?? result.error })
        return
      }
      setNotice({ tone: "success", text: `${result.message ?? "Saved"} Press Publish to update the site.` })
      router.refresh()
    })
  }

  return (
    <div className="mt-4 space-y-5 rounded-base bg-brand-bone p-4">
      <p className="text-sm text-brand-muted">{SITE_PAGE_DEFAULTS[slug].hint}.</p>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <Field label="Page title" error={errors.title}>
        <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Text</span>
        <RichTextEditor value={draft.html} onChange={(html) => setDraft((d) => ({ ...d, html }))} label={`${draft.title} text`} />
        {errors.html && <span className="text-xs text-red-700">{errors.html}</span>}
      </div>
      <SeoFields
        title={draft.seoTitle}
        description={draft.seoDescription}
        titlePlaceholder={`${draft.title} | AFK THEORY`}
        descriptionPlaceholder="Shown in Google and link previews"
        errors={errors}
        onChange={(patch) => setDraft({ ...draft, ...patch })}
      />
      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving" : "Save page"}
        </Button>
      </div>
    </div>
  )
}
