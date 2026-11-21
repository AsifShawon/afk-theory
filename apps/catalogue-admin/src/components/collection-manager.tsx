"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { slugify } from "@dtc/catalogue-core"
import {
  deleteCollection,
  removeCollectionImage,
  reorderCollections,
  saveCollection,
  uploadCollectionImage,
} from "@/app/actions/collections"
import type { CollectionsState, ProductOption } from "@/lib/data"
import { BannerImage, MigrationNotice, MoveButtons, moveItem, SeoFields } from "./store-ui"
import { Badge, Button, Card, Field, Notice, Select, TextArea, TextInput } from "./ui"

type Saved = CollectionsState["collections"][number]

interface Draft {
  key: string
  id: string | null
  name: string
  slug: string
  description: string
  showOnHome: boolean
  seoTitle: string
  seoDescription: string
  productIds: string[]
}

const toDraft = (c: Saved): Draft => ({
  key: c.id,
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  showOnHome: c.show_on_home,
  seoTitle: c.seo_title,
  seoDescription: c.seo_description,
  productIds: c.productIds,
})

const blankDraft = (): Draft => ({
  key: `new-${Date.now()}`,
  id: null,
  name: "",
  slug: "",
  description: "",
  showOnHome: false,
  seoTitle: "",
  seoDescription: "",
  productIds: [],
})

/** Collections group products across categories, for example "Drop 01". */
export function CollectionManager({ state }: { state: CollectionsState }) {
  const router = useRouter()
  const [extra, setExtra] = useState<Draft[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (state.migrationMissing) {
    return (
      <Card title="Collections">
        <MigrationNotice feature="Collections" />
      </Card>
    )
  }

  const move = (index: number, direction: -1 | 1) => {
    const ids = moveItem(
      state.collections.map((c) => c.id),
      index,
      direction
    )
    setError(null)
    startTransition(async () => {
      const result = await reorderCollections(ids)
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  const drafts = [...state.collections.map(toDraft), ...extra]

  return (
    <Card
      title="Collections"
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
          New collection
        </Button>
      }
    >
      <p className="mb-4 text-sm text-brand-muted">
        A collection mixes products from any category, for example &quot;Drop 01&quot; or &quot;Eid edit&quot;. Each gets a page at /collections/name/.
        Collections without published products stay hidden. New and Sale lists are made automatically.
      </p>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {drafts.length === 0 && <p className="text-sm text-brand-muted">No collections yet.</p>}
      <ul className="divide-y divide-brand-border">
        {drafts.map((draft, index) => {
          const saved = state.collections.find((c) => c.id === draft.id)
          const published = draft.productIds.filter((id) => state.products.find((p) => p.id === id)?.status === "published").length
          return (
            <li key={draft.key} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(open === draft.key ? null : draft.key)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={open === draft.key}
                >
                  <span className="font-semibold">{draft.name || "Untitled collection"}</span>
                  <span className="ml-3 text-xs text-brand-muted">
                    {draft.id ? `${published} published product${published === 1 ? "" : "s"}` : "not saved"}
                  </span>
                </button>
                {draft.showOnHome && <Badge tone="live">On home</Badge>}
                {draft.id && published === 0 && <Badge tone="warn">Hidden: no products</Badge>}
                {saved && (
                  <MoveButtons
                    label={draft.name}
                    disabled={pending}
                    isFirst={index === 0}
                    isLast={index === state.collections.length - 1}
                    onMove={(d) => move(index, d)}
                  />
                )}
                <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setOpen(open === draft.key ? null : draft.key)}>
                  {open === draft.key ? "Close" : "Edit"}
                </Button>
              </div>
              {open === draft.key && (
                <CollectionEditor
                  initial={draft}
                  imageUrl={saved?.imageUrl ?? null}
                  products={state.products}
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

function CollectionEditor({
  initial,
  imageUrl,
  products,
  onDiscard,
  onCreated,
}: {
  initial: Draft
  imageUrl: string | null
  products: ProductOption[]
  onDiscard: () => void
  onCreated: (id: string) => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const [adding, setAdding] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const byId = new Map(products.map((p) => [p.id, p]))
  const available = products.filter((p) => !draft.productIds.includes(p.id))

  const act = (action: () => Promise<{ ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> }>, after?: () => void) => {
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
      const result = await saveCollection(draft.id, {
        name: draft.name,
        slug: draft.slug,
        description: draft.description,
        showOnHome: draft.showOnHome,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        productIds: draft.productIds,
      })
      if (result.ok && !draft.id) {
        // The saved collection now comes from the server list; keep it open there.
        onCreated(result.data.id)
      }
      return result
    })

  const remove = () => {
    if (!draft.id) {
      onDiscard()
      return
    }
    if (!confirm(`Delete the "${draft.name}" collection? Its products stay in the shop.`)) return
    act(() => deleteCollection(draft.id as string), onDiscard)
  }

  const upload = (file: File) => {
    if (!draft.id) return
    const data = new FormData()
    data.set("file", file)
    setNotice({ tone: "info", text: "Converting and uploading..." })
    act(() => uploadCollectionImage(draft.id as string, data))
  }

  return (
    <div className="mt-4 space-y-5 rounded-base bg-brand-bone p-4">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={errors.name}>
          <TextInput
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value
              setDraft((d) => ({ ...d, name, slug: slugTouched ? d.slug : slugify(name) }))
            }}
            placeholder="Drop 01"
          />
        </Field>
        <Field label="URL slug" error={errors.slug} hint={`Page address: /collections/${draft.slug || "..."}/`}>
          <TextInput
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setDraft({ ...draft, slug: e.target.value.toLowerCase() })
            }}
          />
        </Field>
        <Field label="Description" error={errors.description} hint="A line or two at the top of the collection page" className="md:col-span-2">
          <TextArea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={600} className="min-h-[72px]" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.showOnHome}
            onChange={(e) => setDraft({ ...draft, showOnHome: e.target.checked })}
            className="h-4 w-4 accent-brand-graphite"
          />
          Show on the homepage (collection spotlight)
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Products, in display order</p>
        {errors.productIds && <p className="text-xs text-red-700">{errors.productIds}</p>}
        {draft.productIds.length === 0 && <p className="text-sm text-brand-muted">No products yet.</p>}
        <ul className="space-y-2">
          {draft.productIds.map((id, index) => {
            const product = byId.get(id)
            return (
              <li key={id} className="flex items-center gap-3 rounded-base border border-brand-border bg-white p-2">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-soft bg-brand-stone">
                  {product?.thumbUrl && <img src={product.thumbUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{product?.name ?? "Deleted product"}</span>
                {product && product.status !== "published" && <Badge tone="warn">Draft</Badge>}
                <MoveButtons
                  label={product?.name ?? "product"}
                  isFirst={index === 0}
                  isLast={index === draft.productIds.length - 1}
                  onMove={(d) => setDraft({ ...draft, productIds: moveItem(draft.productIds, index, d) })}
                />
                <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setDraft({ ...draft, productIds: draft.productIds.filter((x) => x !== id) })}>
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
        {available.length > 0 && (
          <div className="flex gap-2">
            <Select value={adding} onChange={(e) => setAdding(e.target.value)} className="max-w-sm" aria-label="Product to add">
              <option value="">Choose a product</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.status === "published" ? "" : " (draft)"}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              disabled={!adding}
              onClick={() => {
                setDraft({ ...draft, productIds: [...draft.productIds, adding] })
                setAdding("")
              }}
            >
              Add product
            </Button>
          </div>
        )}
      </div>

      <SeoFields
        title={draft.seoTitle}
        description={draft.seoDescription}
        titlePlaceholder={`${draft.name || "Collection"} | AFK THEORY`}
        descriptionPlaceholder={draft.description || "Shown in Google and link previews"}
        errors={errors}
        onChange={(patch) => setDraft({ ...draft, ...patch })}
      />

      {draft.id ? (
        <BannerImage
          imageUrl={imageUrl}
          disabled={pending}
          hint="Banner for the collection page and the homepage spotlight. A wide photo works best."
          onUpload={upload}
          onRemove={() => act(() => removeCollectionImage(draft.id as string))}
        />
      ) : (
        <p className="text-xs text-brand-muted">Save the collection first, then add a banner image.</p>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="danger" onClick={remove} disabled={pending}>
          {draft.id ? "Delete collection" : "Discard"}
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving" : "Save collection"}
        </Button>
      </div>
    </div>
  )
}
