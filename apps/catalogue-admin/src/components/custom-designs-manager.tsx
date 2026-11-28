"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import type { CustomDesignRow, ProductStatus } from "@dtc/catalogue-core"
import {
  deleteCustomDesign,
  removeCustomDesignImage,
  reorderCustomDesigns,
  saveCustomDesign,
  uploadCustomDesignImage,
} from "@/app/actions/custom-designs"
import type { CustomDesignsState } from "@/lib/data"
import { BannerImage, MoveButtons, moveItem } from "./store-ui"
import { Badge, Button, Card, Field, Notice, Select, TextInput } from "./ui"

type Saved = CustomDesignsState["designs"][number]

interface Draft {
  key: string
  id: string | null
  title: string
  garmentType: string
  status: ProductStatus
  isFeatured: boolean
  imageAlt: string
  detailImageAlt: string
}

const toDraft = (d: Saved): Draft => ({
  key: d.id,
  id: d.id,
  title: d.title,
  garmentType: d.garment_type,
  status: d.status,
  isFeatured: d.is_featured,
  imageAlt: d.image_alt,
  detailImageAlt: d.detail_image_alt,
})

const blankDraft = (): Draft => ({
  key: `new-${Date.now()}`,
  id: null,
  title: "",
  garmentType: "Drop-shoulder tee",
  status: "draft",
  isFeatured: false,
  imageAlt: "",
  detailImageAlt: "",
})

/** Manages the /custom-design/ gallery examples outside regular stock. */
export function CustomDesignsManager({ state }: { state: CustomDesignsState }) {
  const router = useRouter()
  const [extra, setExtra] = useState<Draft[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (state.migrationMissing) {
    return (
      <Card title="Custom gallery">
        <Notice tone="info">
          Custom gallery needs one database step. In Supabase open the SQL editor, paste{" "}
          <code>apps/catalogue-admin/supabase/migrations/20261128000000_custom_designs.sql</code>, run it, then reload this page. The rest of the site
          keeps working until then.
        </Notice>
      </Card>
    )
  }

  const move = (index: number, direction: -1 | 1) => {
    const ids = moveItem(
      state.designs.map((d) => d.id),
      index,
      direction
    )
    setError(null)
    startTransition(async () => {
      const result = await reorderCustomDesigns(ids)
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  const drafts = [...state.designs.map(toDraft), ...extra]

  return (
    <Card
      title="Custom gallery (/custom-design/)"
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const draft = blankDraft()
            setExtra((d) => [...d, draft])
            setOpen(draft.key)
          }}
        >
          New custom example
        </Button>
      }
    >
      <p className="mb-4 text-sm text-brand-muted">
        Real custom pieces you have printed for the public <code>/custom-design/</code> gallery. Examples stay completely separate from regular stock and
        cart checkout. Upload an approved full garment photo first, add descriptive alt text, and optionally add a back or print close-up. Mark one
        published piece as featured to lead the hero.
      </p>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {drafts.length === 0 && (
        <p className="text-sm text-brand-muted">
          No custom examples uploaded yet. Add an example to prepare the gallery, then press Publish when ready.
        </p>
      )}
      <ul className="divide-y divide-brand-border">
        {drafts.map((draft, index) => {
          const saved = state.designs.find((d) => d.id === draft.id)
          const hasPhoto = Boolean(saved?.imageUrl)
          return (
            <li key={draft.key} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-soft bg-brand-stone">
                  {saved?.imageUrl && <img src={saved.imageUrl} alt={draft.imageAlt || draft.title} className="h-full w-full object-cover" />}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(open === draft.key ? null : draft.key)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={open === draft.key}
                >
                  <span className="block truncate font-semibold">{draft.title || "Untitled custom example"}</span>
                  <span className="block text-xs text-brand-muted">{draft.garmentType || "Garment type not set"}</span>
                </button>
                {draft.isFeatured && <Badge tone="live">Lead hero</Badge>}
                {draft.status === "published" ? <Badge tone="live">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
                {draft.id && !hasPhoto && <Badge tone="warn">Needs photo</Badge>}
                {saved && (
                  <MoveButtons
                    label={draft.title}
                    disabled={pending}
                    isFirst={index === 0}
                    isLast={index === state.designs.length - 1}
                    onMove={(d) => move(index, d)}
                  />
                )}
                <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setOpen(open === draft.key ? null : draft.key)}>
                  {open === draft.key ? "Close" : "Edit"}
                </Button>
              </div>
              {open === draft.key && (
                <CustomDesignEditor
                  initial={draft}
                  saved={saved ?? null}
                  onDiscard={() => {
                    setExtra((d) => d.filter((x) => x.key !== draft.key))
                    setOpen(null)
                  }}
                  onCreated={(id) => {
                    setExtra((d) => d.filter((x) => x.key !== draft.key))
                    setOpen(id)
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function CustomDesignEditor({
  initial,
  saved,
  onDiscard,
  onCreated,
}: {
  initial: Draft
  saved: Saved | null
  onDiscard: () => void
  onCreated: (id: string) => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const act = (
    action: () => Promise<{ ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> }>,
    after?: () => void
  ) => {
    setNotice(null)
    setErrors({})
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setNotice({ tone: "error", text: Object.values(result.fieldErrors ?? {})[0] ?? result.error ?? "Something went wrong" })
        return
      }
      setNotice({ tone: "success", text: result.message ?? "Saved" })
      after?.()
      router.refresh()
    })
  }

  const save = () =>
    act(async () => {
      const result = await saveCustomDesign(draft.id, {
        title: draft.title,
        garmentType: draft.garmentType,
        status: draft.status,
        isFeatured: draft.isFeatured,
        imageAlt: draft.imageAlt,
        detailImageAlt: draft.detailImageAlt,
      })
      if (result.ok && !draft.id) {
        onCreated(result.data.id)
      }
      return result
    })

  const remove = () => {
    if (!draft.id) {
      onDiscard()
      return
    }
    if (!confirm(`Delete "${draft.title}" and its photos from storage?`)) return
    act(() => deleteCustomDesign(draft.id as string), onDiscard)
  }

  const uploadSlot = (slot: "main" | "detail", file: File) => {
    if (!draft.id) return
    const data = new FormData()
    data.set("file", file)
    setNotice({ tone: "info", text: "Converting to WebP and uploading..." })
    act(() => uploadCustomDesignImage(draft.id as string, slot, data))
  }

  const removeSlot = (slot: "main" | "detail") => {
    if (!draft.id) return
    act(() => removeCustomDesignImage(draft.id as string, slot), () => {
      if (slot === "main" && draft.status === "published") {
        setDraft((d) => ({ ...d, status: "draft" }))
      }
    })
  }

  const formatDimensions = (row: CustomDesignRow | null, slot: "main" | "detail") => {
    if (!row) return ""
    const w = slot === "main" ? row.image_width : row.detail_image_width
    const h = slot === "main" ? row.image_height : row.detail_image_height
    return w && h ? `${w} x ${h} WebP` : ""
  }

  return (
    <div className="mt-4 space-y-5 rounded-base bg-brand-bone p-4">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Short title" error={errors.title} hint="Example title shown in gallery and WhatsApp reference">
          <TextInput
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Lantern graphic custom tee"
            maxLength={120}
          />
        </Field>
        <Field label="Garment type" error={errors.garmentType} hint="Shown under the title, e.g. Drop-shoulder tee or Heavyweight hoodie">
          <TextInput
            value={draft.garmentType}
            onChange={(e) => setDraft({ ...draft, garmentType: e.target.value })}
            placeholder="Drop-shoulder tee"
            maxLength={80}
          />
        </Field>
        <Field label="Status" error={errors.status}>
          <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ProductStatus })}>
            <option value="draft">Draft (hidden on site)</option>
            <option value="published">Published (visible on /custom-design/)</option>
          </Select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.isFeatured}
            onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })}
            className="h-4 w-4 accent-brand-graphite"
          />
          Feature as the lead hero image on /custom-design/
        </label>
      </div>

      {draft.id ? (
        <div className="grid gap-6 border-t border-brand-border pt-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Full garment photo (Required to publish) {formatDimensions(saved, "main") && `· ${formatDimensions(saved, "main")}`}
            </p>
            <BannerImage
              imageUrl={saved?.imageUrl ?? null}
              disabled={pending}
              hint="Shows the garment fit and overall print. Converted to WebP at 640, 1080 and 1600 px."
              onUpload={(file) => uploadSlot("main", file)}
              onRemove={() => removeSlot("main")}
            />
            <Field label="Main photo alt text" error={errors.imageAlt} hint="Describe garment color, fit, and print details">
              <TextInput
                value={draft.imageAlt}
                onChange={(e) => setDraft({ ...draft, imageAlt: e.target.value })}
                placeholder="Graphite drop-shoulder tee with white screen-printed back artwork"
                maxLength={200}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Back view or print close-up (Optional) {formatDimensions(saved, "detail") && `· ${formatDimensions(saved, "detail")}`}
            </p>
            <BannerImage
              imageUrl={saved?.detailImageUrl ?? null}
              disabled={pending}
              hint="Secondary view showing print texture, back artwork, or detail when available."
              onUpload={(file) => uploadSlot("detail", file)}
              onRemove={() => removeSlot("detail")}
            />
            <Field label="Detail photo alt text" error={errors.detailImageAlt}>
              <TextInput
                value={draft.detailImageAlt}
                onChange={(e) => setDraft({ ...draft, detailImageAlt: e.target.value })}
                placeholder="Close-up of crisp puff-print back graphic on heavyweight cotton"
                maxLength={200}
              />
            </Field>
          </div>
        </div>
      ) : (
        <p className="text-xs text-brand-muted">Save the entry as a draft first, then upload its main garment photo and optional close-up.</p>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="danger" onClick={remove} disabled={pending}>
          {draft.id ? "Delete example" : "Discard"}
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving" : "Save example"}
        </Button>
      </div>
    </div>
  )
}
