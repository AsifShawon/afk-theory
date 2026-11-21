"use client"

import { useRef } from "react"
import { clsx } from "clsx"
import { SEO_LIMITS, STORE_STRUCTURE_MIGRATION } from "@dtc/catalogue-core"
import { Button, Field, Notice, TextArea, TextInput } from "./ui"

/** Shown wherever a feature needs migration 20261122000000. */
export function MigrationNotice({ feature }: { feature: string }) {
  return (
    <Notice tone="info">
      {feature} need one more database step. In Supabase open the SQL editor, paste{" "}
      <code>apps/catalogue-admin/supabase/migrations/{STORE_STRUCTURE_MIGRATION}</code>, run it, then reload this page. The site keeps working
      until then.
    </Notice>
  )
}

function Counter({ length, limit }: { length: number; limit: number }) {
  return <span className={clsx("ml-2 normal-case tracking-normal", length > limit ? "text-amber-700" : "text-brand-muted-light")}>{`${length}/${limit}`}</span>
}

/** Search title and description with length counters. Empty fields fall back on the site. */
export function SeoFields({
  title,
  description,
  titlePlaceholder,
  descriptionPlaceholder,
  errors = {},
  onChange,
}: {
  title: string
  description: string
  titlePlaceholder: string
  descriptionPlaceholder: string
  errors?: Record<string, string>
  onChange: (patch: { seoTitle?: string; seoDescription?: string }) => void
}) {
  return (
    <div className="grid gap-4">
      <Field label="Search title" error={errors.seoTitle} hint="Shown in Google and link previews. Leave empty to use the name.">
        <div className="relative">
          <TextInput value={title} onChange={(e) => onChange({ seoTitle: e.target.value })} placeholder={titlePlaceholder} maxLength={70} />
          <span className="pointer-events-none absolute right-3 top-2.5 text-xs">
            <Counter length={title.length} limit={SEO_LIMITS.title} />
          </span>
        </div>
      </Field>
      <Field label="Search description" error={errors.seoDescription}>
        <div className="relative">
          <TextArea
            value={description}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
            placeholder={descriptionPlaceholder}
            maxLength={200}
            className="min-h-[72px] pr-16"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-xs">
            <Counter length={description.length} limit={SEO_LIMITS.description} />
          </span>
        </div>
      </Field>
    </div>
  )
}

/** Banner image for a category or collection: preview, replace and remove. */
export function BannerImage({
  imageUrl,
  disabled,
  hint,
  onUpload,
  onRemove,
}: {
  imageUrl: string | null
  disabled?: boolean
  hint: string
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-soft bg-brand-stone text-[10px] font-semibold uppercase text-brand-muted">
        {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : "No image"}
      </div>
      <div className="space-y-2">
        <p className="text-xs text-brand-muted">{hint}</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
            {imageUrl ? "Replace image" : "Upload image"}
          </Button>
          {imageUrl && (
            <Button type="button" variant="ghost" disabled={disabled} onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}

/** Up and down buttons for lists that are ordered by hand. */
export function MoveButtons({
  label,
  disabled,
  isFirst,
  isLast,
  onMove,
}: {
  label: string
  disabled?: boolean
  isFirst: boolean
  isLast: boolean
  onMove: (direction: -1 | 1) => void
}) {
  return (
    <div className="flex shrink-0">
      <Button type="button" variant="ghost" className="h-8 px-2" disabled={disabled || isFirst} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}>
        Up
      </Button>
      <Button type="button" variant="ghost" className="h-8 px-2" disabled={disabled || isLast} onClick={() => onMove(1)} aria-label={`Move ${label} down`}>
        Down
      </Button>
    </div>
  )
}

/** A copy of the list with one item moved one place up or down. */
export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
