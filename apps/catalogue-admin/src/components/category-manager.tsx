"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  buildCategoryTree,
  categoryAndDescendantIds,
  flattenTree,
  MENU_PRODUCT_LIMIT,
  newestFirst,
  slugify,
  type CategoryRow,
} from "@dtc/catalogue-core"
import {
  deleteCategory,
  removeCategoryImage,
  reorderCategories,
  saveCategory,
  saveMenuProducts,
  uploadCategoryImage,
} from "@/app/actions/categories"
import type { CategoriesState, ProductOption } from "@/lib/data"
import { BannerImage, MigrationNotice, MoveButtons, moveItem, SeoFields } from "./store-ui"
import { Badge, Button, Card, Field, Notice, Select, TextArea, TextInput } from "./ui"

type Category = CategoriesState["categories"][number]
type Result = { ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> }

/**
 * Categories as a tree. Top-level categories become the site's menu; each
 * can show up to 2 picked products in its menu panel.
 */
export function CategoryManager({ state }: { state: CategoriesState }) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [newName, setNewName] = useState("")
  const [newParent, setNewParent] = useState("")
  const ready = !state.migrationMissing

  const tree = useMemo(() => flattenTree(buildCategoryTree(state.categories)), [state.categories])
  const byId = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories])

  const productsIn = (id: string) => {
    const ids = categoryAndDescendantIds(state.categories, id)
    return state.products.filter((p) => p.categoryId && ids.has(p.categoryId))
  }

  const run = (action: () => Promise<Result>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error ?? "Something went wrong")
      else after?.()
      router.refresh()
    })
  }

  const move = (node: (typeof tree)[number], direction: -1 | 1) => {
    const parentId = node.trail.length > 1 ? node.trail[node.trail.length - 2] : null
    const siblings = tree.filter((n) => (n.trail.length > 1 ? n.trail[n.trail.length - 2] : null) === parentId).map((n) => n.row.id)
    const index = siblings.indexOf(node.row.id)
    run(() => reorderCategories(moveItem(siblings, index, direction)))
  }

  return (
    <Card title="Categories">
      <div className="space-y-4">
        <p className="text-sm text-brand-muted">
          Top-level categories are the menu on the site. Put a category inside another with Parent, for example T-Shirts &gt; Drop shoulder. Categories
          without published products stay hidden on the site.
        </p>
        {!ready && <MigrationNotice feature="Subcategories, category banners, search fields and menu products" />}
        {error && <Notice tone="error">{error}</Notice>}

        {tree.length === 0 && <p className="text-sm text-brand-muted">No categories yet.</p>}
        <ul className="divide-y divide-brand-border rounded-base border border-brand-border">
          {tree.map((node) => {
            const parentId = node.trail.length > 1 ? node.trail[node.trail.length - 2] : null
            const siblings = tree.filter((n) => (n.trail.length > 1 ? n.trail[n.trail.length - 2] : null) === parentId)
            const index = siblings.findIndex((n) => n.row.id === node.row.id)
            const category = byId.get(node.row.id) as Category
            const products = productsIn(category.id)
            const published = products.filter((p) => p.status === "published").length
            return (
              <li key={category.id} className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-3" style={{ paddingLeft: `${node.depth * 24}px` }}>
                  {node.depth > 0 && (
                    <span className="text-brand-muted-light" aria-hidden>
                      &#8627;
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-left font-semibold hover:underline"
                      onClick={() => setOpen(open === category.id ? null : category.id)}
                      aria-expanded={open === category.id}
                    >
                      {category.name}
                    </button>
                    <span className="ml-3 text-xs text-brand-muted">{ready ? node.href : `/${category.slug}`}</span>
                  </div>
                  <span className="text-xs text-brand-muted">
                    {published} published{products.length > published ? `, ${products.length - published} draft` : ""}
                  </span>
                  {published === 0 && <Badge tone="warn">Hidden: no products</Badge>}
                  {ready && category.show_in_menu === false && <Badge>Not in menu</Badge>}
                  <MoveButtons label={category.name} disabled={pending} isFirst={index === 0} isLast={index === siblings.length - 1} onMove={(d) => move(node, d)} />
                  <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setOpen(open === category.id ? null : category.id)}>
                    {open === category.id ? "Close" : "Edit"}
                  </Button>
                </div>
                {open === category.id && (
                  <CategoryEditor
                    key={category.id}
                    category={category}
                    categories={state.categories}
                    products={products}
                    picks={state.menuPicks[category.id] ?? []}
                    isTopLevel={node.depth === 0}
                    ready={ready}
                    onDone={() => {
                      setOpen(null)
                      router.refresh()
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>

        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            const name = newName.trim()
            if (!name) return
            run(
              () => saveCategory(null, { name, slug: slugify(name), ...(ready ? { parentId: newParent || null } : {}) }),
              () => {
                setNewName("")
                setNewParent("")
              }
            )
          }}
        >
          <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Hoodies" className="max-w-xs" aria-label="New category name" />
          {ready && (
            <Select value={newParent} onChange={(e) => setNewParent(e.target.value)} className="max-w-xs" aria-label="Parent of the new category">
              <option value="">Top level</option>
              {tree.map((n) => (
                <option key={n.row.id} value={n.row.id}>
                  Inside {n.trailNames.join(" / ")}
                </option>
              ))}
            </Select>
          )}
          <Button type="submit" variant="secondary" disabled={pending}>
            Add category
          </Button>
        </form>
      </div>
    </Card>
  )
}

function CategoryEditor({
  category,
  categories,
  products,
  picks,
  isTopLevel,
  ready,
  onDone,
}: {
  category: Category
  categories: CategoryRow[]
  products: ProductOption[]
  picks: string[]
  isTopLevel: boolean
  ready: boolean
  onDone: () => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState({
    name: category.name,
    slug: category.slug,
    parentId: category.parent_id ?? "",
    description: category.description ?? "",
    showInMenu: category.show_in_menu !== false,
    seoTitle: category.seo_title ?? "",
    seoDescription: category.seo_description ?? "",
  })
  const [menuPicks, setMenuPicks] = useState<string[]>(picks)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const tree = flattenTree(buildCategoryTree(categories))
  const blocked = categoryAndDescendantIds(categories, category.id)
  const parentOptions = tree.filter((n) => !blocked.has(n.row.id))

  const act = (action: () => Promise<Result>, success?: string, after?: () => void) => {
    setNotice(null)
    setErrors({})
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setNotice({ tone: "error", text: Object.values(result.fieldErrors ?? {})[0] ?? result.error ?? "Something went wrong" })
        return
      }
      setNotice({ tone: "success", text: success ?? result.message ?? "Saved" })
      after?.()
      router.refresh()
    })
  }

  const save = () =>
    act(() =>
      saveCategory(
        category.id,
        ready
          ? { ...draft, parentId: draft.parentId || null }
          : { name: draft.name, slug: draft.slug }
      )
    )

  const remove = () => {
    const warning = products.length > 0 ? ` Its ${products.length} product${products.length === 1 ? "" : "s"} stay, without a category.` : ""
    if (!confirm(`Delete the ${category.name} category?${warning} Subcategories move to the top level.`)) return
    act(() => deleteCategory(category.id), "Deleted", onDone)
  }

  const upload = (file: File) => {
    const data = new FormData()
    data.set("file", file)
    setNotice({ tone: "info", text: "Converting and uploading..." })
    act(() => uploadCategoryImage(category.id, data))
  }

  const published = products.filter((p) => p.status === "published")
  const fallback = newestFirst(published).slice(0, MENU_PRODUCT_LIMIT)
  const pickOptions = [...published, ...products.filter((p) => p.status !== "published")]

  return (
    <div className="mt-4 space-y-5 rounded-base bg-brand-bone p-4">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={errors.name}>
          <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="URL slug" error={errors.slug} hint="Changing it changes the page address">
          <div className="flex gap-2">
            <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })} />
            <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, slug: slugify(draft.name) })} title="Make the slug from the name">
              From name
            </Button>
          </div>
        </Field>
        {ready && (
          <>
            <Field label="Parent" error={errors.parentId}>
              <Select value={draft.parentId} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
                <option value="">None (top level)</option>
                {parentOptions.map((n) => (
                  <option key={n.row.id} value={n.row.id}>
                    {n.trailNames.join(" / ")}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.showInMenu}
                onChange={(e) => setDraft({ ...draft, showInMenu: e.target.checked })}
                className="h-4 w-4 accent-brand-graphite"
              />
              Show in the menu
            </label>
            <Field label="Description" error={errors.description} hint="A line or two shown at the top of the category page" className="md:col-span-2">
              <TextArea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={600} className="min-h-[72px]" />
            </Field>
          </>
        )}
      </div>

      {ready && (
        <>
          <SeoFields
            title={draft.seoTitle}
            description={draft.seoDescription}
            titlePlaceholder={`${draft.name} | AFK THEORY`}
            descriptionPlaceholder={draft.description || `Shop ${draft.name} from AFK THEORY.`}
            errors={errors}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
          />
          <BannerImage
            imageUrl={category.imageUrl}
            disabled={pending}
            hint="Banner and menu tile. A 4:5 portrait or wide photo, converted to webp like product photos."
            onUpload={upload}
            onRemove={() => act(() => removeCategoryImage(category.id), "Image removed")}
          />
        </>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="danger" onClick={remove} disabled={pending}>
          Delete category
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving" : "Save category"}
        </Button>
      </div>

      {ready && isTopLevel && (
        <div className="space-y-3 border-t border-brand-border pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Menu products</p>
            <p className="text-sm text-brand-muted">
              Up to {MENU_PRODUCT_LIMIT} products shown with photos in this category&apos;s menu panel.{" "}
              {fallback.length > 0
                ? `With none picked, the newest show: ${fallback.map((p) => p.name).join(", ")}.`
                : "This category has no published products yet, so it is not in the menu."}
            </p>
          </div>
          {Array.from({ length: MENU_PRODUCT_LIMIT }, (_, slot) => {
            const value = menuPicks[slot] ?? ""
            const picked = products.find((p) => p.id === value)
            return (
              <div key={slot} className="flex flex-wrap items-center gap-3">
                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-soft bg-brand-stone">
                  {picked?.thumbUrl && <img src={picked.thumbUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <Select
                  value={value}
                  onChange={(e) => {
                    const next = [...menuPicks]
                    next[slot] = e.target.value
                    setMenuPicks(next.filter(Boolean))
                  }}
                  className="max-w-sm"
                  aria-label={`Menu product ${slot + 1}`}
                  disabled={slot > menuPicks.length}
                >
                  <option value="">{slot === 0 ? "Newest products (automatic)" : "None"}</option>
                  {pickOptions
                    .filter((p) => p.id === value || !menuPicks.includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.status === "published" ? "" : " (draft)"}
                      </option>
                    ))}
                </Select>
                {picked && picked.status !== "published" && <Badge tone="warn">Draft: hidden until published</Badge>}
              </div>
            )
          })}
          {picks.some((id) => !products.some((p) => p.id === id)) && (
            <Notice tone="info">A saved pick is no longer in this category, so the site ignores it. Save to clear it.</Notice>
          )}
          <Button type="button" variant="secondary" disabled={pending} onClick={() => act(() => saveMenuProducts(category.id, menuPicks), "Menu products saved")}>
            Save menu products
          </Button>
        </div>
      )}
    </div>
  )
}

