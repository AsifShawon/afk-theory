"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { DEFAULT_SIZES, type SizeGuideRow } from "@dtc/catalogue-core"
import { deleteSizeGuide, saveSizeGuide } from "@/app/actions/size-guides"
import type { SizeGuidesState } from "@/lib/data"
import { SizeChartTable } from "./size-chart-table"
import { Button, Card, Field, Notice, TextInput } from "./ui"

type Draft = Omit<SizeGuideRow, "id" | "sort_order"> & { id: string | null; key: string }

const toDraft = (g: SizeGuideRow): Draft => ({ ...g, key: g.id })

function blankDraft(): Draft {
  const columns = ["Chest", "Length", "Sleeve"]
  return {
    id: null,
    key: `new-${Date.now()}`,
    name: "",
    unit: "inches",
    note: "Measured flat across the garment.",
    columns,
    rows: DEFAULT_SIZES.map((size) => ({ size, values: columns.map(() => "") })),
  }
}

/**
 * Size guides are written once here and picked on each product, so one
 * change updates every product that uses the guide.
 */
export function SizeGuideManager({ state }: { state: SizeGuidesState }) {
  const [drafts, setDrafts] = useState<Draft[]>(state.guides.map(toDraft))
  const [open, setOpen] = useState<string | null>(null)

  if (state.migrationMissing) {
    return (
      <Card title="Size guides">
        <Notice tone="info">
          Size guides need one more database step. In Supabase open the SQL editor, paste{" "}
          <code>apps/catalogue-admin/supabase/migrations/20261121000000_size_guides_seo.sql</code>, run it, then reload this page.
        </Notice>
      </Card>
    )
  }

  return (
    <Card
      title="Size guides"
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const draft = blankDraft()
            setDrafts((d) => [...d, draft])
            setOpen(draft.key)
          }}
        >
          New size guide
        </Button>
      }
    >
      <p className="mb-4 text-sm text-brand-muted">
        Write each chart once, for example &quot;Oversized tee&quot; or &quot;Regular hoodie&quot;, then pick it on any product. Editing a guide updates every product that uses it.
      </p>
      {drafts.length === 0 && <p className="text-sm text-brand-muted">No size guides yet.</p>}
      <ul className="divide-y divide-brand-border">
        {drafts.map((draft) => (
          <GuideItem
            key={draft.key}
            draft={draft}
            usedBy={draft.id ? state.usage[draft.id] ?? 0 : 0}
            open={open === draft.key}
            onToggle={() => setOpen(open === draft.key ? null : draft.key)}
            onDiscard={() => setDrafts((d) => d.filter((x) => x.key !== draft.key))}
          />
        ))}
      </ul>
    </Card>
  )
}

function GuideItem({
  draft: initial,
  usedBy,
  open,
  onToggle,
  onDiscard,
}: {
  draft: Draft
  usedBy: number
  open: boolean
  onToggle: () => void
  onDiscard: () => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () => {
    setNotice(null)
    setErrors({})
    startTransition(async () => {
      const result = await saveSizeGuide(draft.id, {
        name: draft.name,
        unit: draft.unit,
        note: draft.note,
        columns: draft.columns,
        rows: draft.rows,
      })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setNotice({ tone: "error", text: Object.values(result.fieldErrors ?? {})[0] ?? result.error })
        return
      }
      setDraft((d) => ({ ...d, id: result.data.id }))
      setNotice({ tone: "success", text: usedBy > 0 ? `Saved. ${usedBy} product${usedBy === 1 ? "" : "s"} will show the new chart after you publish.` : "Saved." })
      router.refresh()
    })
  }

  const remove = () => {
    if (!draft.id) {
      onDiscard()
      return
    }
    const warning = usedBy > 0 ? ` ${usedBy} product${usedBy === 1 ? " uses" : "s use"} it and will show no size guide until you pick another.` : ""
    if (!confirm(`Delete the "${draft.name}" size guide?${warning}`)) return
    startTransition(async () => {
      const result = await deleteSizeGuide(draft.id as string)
      if (!result.ok) {
        setNotice({ tone: "error", text: result.error })
        return
      }
      onDiscard()
      router.refresh()
    })
  }

  return (
    <li className="py-3">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={open}>
        <span>
          <span className="font-semibold">{draft.name || "Untitled guide"}</span>
          <span className="ml-3 text-xs text-brand-muted">
            {draft.rows.map((r) => r.size).filter(Boolean).join(" / ") || "No sizes"} · {draft.id ? `used by ${usedBy} product${usedBy === 1 ? "" : "s"}` : "not saved"}
          </span>
        </span>
        <span className="text-sm font-semibold text-brand-muted">{open ? "Close" : "Edit"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="Guide name" error={errors.name} hint="Only you see this name">
              <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Oversized tee" />
            </Field>
            <Field label="Unit" error={errors.unit}>
              <TextInput value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="inches" />
            </Field>
          </div>
          <SizeChartTable
            editableSizes
            value={{ columns: draft.columns, rows: draft.rows }}
            onChange={(chart) => setDraft({ ...draft, ...chart })}
          />
          <Field label="Note under the chart" error={errors.note} hint="Shown to customers, e.g. how to measure">
            <TextInput value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </Field>
          <div className="flex justify-between gap-3">
            <Button type="button" variant="danger" onClick={remove} disabled={pending}>
              {draft.id ? "Delete guide" : "Discard"}
            </Button>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? "Saving" : "Save guide"}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
