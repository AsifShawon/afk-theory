"use client"

import React, { useMemo } from "react"
import { sanitizeHtml, formatLegacyMarkdown, enhanceRichHtml } from "../../utils/rich-description"

export { sanitizeHtml, formatLegacyMarkdown, enhanceRichHtml }

export interface RichDescriptionProps {
  content?: string
  fallbackText?: string
  className?: string
}

export function RichDescription({
  content,
  fallbackText,
  className = "",
}: RichDescriptionProps) {
  const renderedHtml = useMemo(() => {
    const raw = content || fallbackText || ""
    if (!raw.trim()) return ""

    // Check if content already contains HTML tags
    const containsHtml = /<[a-z][\s\S]*>/i.test(raw)

    const baseHtml = containsHtml ? sanitizeHtml(raw) : formatLegacyMarkdown(raw)

    // Elevate structure into premium streetwear commerce presentation
    return enhanceRichHtml(baseHtml)
  }, [content, fallbackText])

  if (!renderedHtml) {
    return (
      <p className="text-xs sm:text-sm leading-relaxed text-brand-muted">
        Authentic AFK THEORY garment crafted with high-density streetwear construction.
      </p>
    )
  }

  return (
    <div
      className={`prose prose-sm max-w-none text-[#20241F]
        [&_h2]:font-heading [&_h2]:font-bold [&_h2]:text-sm [&_h2]:sm:text-base [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-[#20241F] [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-brand-border/60
        [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:text-brand-muted [&_h3]:mt-4 [&_h3]:mb-2
        [&_.spec-heading]:font-heading [&_.spec-heading]:font-bold [&_.spec-heading]:text-[11px] [&_.spec-heading]:uppercase [&_.spec-heading]:tracking-widest [&_.spec-heading]:text-brand-primary [&_.spec-heading]:mt-5 [&_.spec-heading]:mb-2.5 [&_.spec-heading]:pb-1.5 [&_.spec-heading]:border-b [&_.spec-heading]:border-brand-border/60
        [&_.editorial-tagline]:text-xs [&_.editorial-tagline]:font-serif [&_.editorial-tagline]:italic [&_.editorial-tagline]:text-brand-primary/80 [&_.editorial-tagline]:mb-3 [&_.editorial-tagline]:tracking-wide
        [&_p]:text-xs [&_p]:sm:text-[13px] [&_p]:leading-relaxed [&_p]:text-[#20241F]/80 [&_p]:mb-2.5 [&_p]:font-sans
        [&_strong]:font-semibold [&_strong]:text-[#20241F]
        [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ul]:pl-0 [&_ul]:list-none
        [&_li]:relative [&_li]:pl-4 [&_li]:text-xs [&_li]:sm:text-[13px] [&_li]:leading-relaxed [&_li]:text-[#20241F]/85 [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[7px] [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:bg-[#20241F] [&_li]:before:rounded-full
        [&_ol]:my-3 [&_ol]:space-y-1.5 [&_ol]:pl-4 [&_ol]:list-decimal [&_ol_li]:before:content-none [&_ol_li]:pl-1
        [&_.fit-card]:my-4 [&_.fit-card]:p-3.5 [&_.fit-card]:rounded-md [&_.fit-card]:bg-[#F5F3ED] [&_.fit-card]:border [&_.fit-card]:border-brand-border [&_.fit-card]:border-l-4 [&_.fit-card]:border-l-[#20241F]
        [&_.fit-card-title]:font-heading [&_.fit-card-title]:font-bold [&_.fit-card-title]:text-[10px] [&_.fit-card-title]:uppercase [&_.fit-card-title]:tracking-widest [&_.fit-card-title]:text-brand-primary [&_.fit-card-title]:block [&_.fit-card-title]:mb-1
        [&_.fit-card-body]:text-xs [&_.fit-card-body]:leading-relaxed [&_.fit-card-body]:text-[#20241F]/80 [&_.fit-card-body]:m-0
        [&_.spec-strip]:my-3 [&_.spec-strip]:p-3 [&_.spec-strip]:bg-brand-surface [&_.spec-strip]:border [&_.spec-strip]:border-brand-border/70 [&_.spec-strip]:rounded [&_.spec-strip]:flex [&_.spec-strip]:flex-col [&_.spec-strip]:sm:flex-row [&_.spec-strip]:sm:items-center [&_.spec-strip]:justify-between [&_.spec-strip]:gap-1
        [&_.spec-strip-label]:text-[10px] [&_.spec-strip-label]:font-heading [&_.spec-strip-label]:font-bold [&_.spec-strip-label]:uppercase [&_.spec-strip-label]:tracking-widest [&_.spec-strip-label]:text-brand-muted
        [&_.spec-strip-val]:text-xs [&_.spec-strip-val]:font-medium [&_.spec-strip-val]:text-brand-primary
        [&_.spec-grid]:grid [&_.spec-grid]:grid-cols-1 [&_.spec-grid]:sm:grid-cols-2 [&_.spec-grid]:gap-2 [&_.spec-grid]:my-4 [&_.spec-grid]:p-3 [&_.spec-grid]:bg-brand-surface [&_.spec-grid]:border [&_.spec-grid]:border-brand-border/70 [&_.spec-grid]:rounded-md
        [&_.spec-item]:flex [&_.spec-item]:flex-col [&_.spec-item]:gap-0.5
        [&_.spec-label]:text-[10px] [&_.spec-label]:font-heading [&_.spec-label]:font-bold [&_.spec-label]:uppercase [&_.spec-label]:tracking-widest [&_.spec-label]:text-brand-muted
        [&_.spec-value]:text-xs [&_.spec-value]:font-medium [&_.spec-value]:text-brand-primary
        ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  )
}
