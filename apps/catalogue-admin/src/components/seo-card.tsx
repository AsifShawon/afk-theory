"use client"

import { clsx } from "clsx"
import { SEO_LIMITS } from "@dtc/catalogue-core"
import { Card, Field, TextArea, TextInput } from "./ui"

/** Quick plain-text version of the editor HTML for the preview. */
function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/**
 * Search result title and description, with a preview of how the product
 * appears in Google and in link previews. Empty fields fall back to the
 * product name and tagline, which is what the site uses too.
 */
export function SeoCard({
  name,
  slug,
  tagline,
  description,
  seoTitle,
  seoDescription,
  errors,
  onChange,
}: {
  name: string
  slug: string
  tagline: string
  description: string
  seoTitle: string
  seoDescription: string
  errors: Record<string, string>
  onChange: (patch: { seoTitle?: string; seoDescription?: string }) => void
}) {
  const fallbackTitle = name ? `${name} | AFK THEORY` : "Product name | AFK THEORY"
  const fallbackDescription = tagline || htmlToText(description)
  const shownTitle = seoTitle || fallbackTitle
  const shownDescription = seoDescription || fallbackDescription

  return (
    <Card title="Search and sharing">
      <div className="space-y-5">
        <p className="text-sm text-brand-muted">
          How this product appears in Google results and when the link is shared on WhatsApp or Facebook. Leave a field empty to use the name and tagline.
        </p>

        <Field label="Search title" error={errors.seoTitle}>
          <TextInput value={seoTitle} onChange={(e) => onChange({ seoTitle: e.target.value })} placeholder={fallbackTitle} maxLength={70} />
        </Field>
        <Counter length={shownTitle.length} limit={SEO_LIMITS.title} usingFallback={!seoTitle} />

        <Field label="Search description" error={errors.seoDescription}>
          <TextArea
            value={seoDescription}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
            placeholder={fallbackDescription || "One or two sentences: what it is, the fabric, the fit."}
            rows={3}
            maxLength={200}
            className="min-h-[72px]"
          />
        </Field>
        <Counter length={shownDescription.length} limit={SEO_LIMITS.description} usingFallback={!seoDescription} min={70} />

        <div className="rounded-base border border-brand-border bg-white p-4" aria-label="Google result preview">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Preview</p>
          <p className="mt-3 truncate text-xs text-[#4d5156]">afktheory › products › {slug || "product-url"}</p>
          <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{clip(shownTitle, SEO_LIMITS.title + 5)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{shownDescription ? clip(shownDescription, SEO_LIMITS.description) : "Add a tagline or search description."}</p>
        </div>

        <ul className="space-y-1 text-xs text-brand-muted">
          <li>Put the most important words first: product type, fabric, fit.</li>
          <li>Describe the photos in the image boxes above. Search engines read those descriptions too.</li>
        </ul>
      </div>
    </Card>
  )
}

function Counter({ length, limit, usingFallback, min = 0 }: { length: number; limit: number; usingFallback: boolean; min?: number }) {
  const tooLong = length > limit
  const tooShort = !usingFallback && length > 0 && length < min
  return (
    <p className={clsx("-mt-3 text-xs", tooLong ? "font-semibold text-amber-800" : "text-brand-muted")}>
      {length} / {limit} characters
      {usingFallback && " (using the default)"}
      {tooLong && ". Search engines cut text after this."}
      {tooShort && `. Aim for at least ${min}.`}
    </p>
  )
}
