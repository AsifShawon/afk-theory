"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { slugify, type CategoryRow } from "@dtc/catalogue-core"
import { deleteCategory, saveCategory } from "@/app/actions/settings"
import { Button, Card, Notice, TextInput } from "./ui"

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error ?? "Something went wrong")
      router.refresh()
    })
  }

  return (
    <Card title="Categories">
      <p className="mb-4 text-sm text-brand-muted">Categories become filter chips on the site. Only categories with published products are shown.</p>
      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <ul className="mb-4 divide-y divide-brand-border">
        {categories.map((c) => (
          <CategoryRowItem
            key={c.id}
            category={c}
            disabled={pending}
            onRename={(newName) => run(() => saveCategory(c.id, { name: newName, slug: slugify(newName) }))}
            onDelete={() => {
              if (confirm(`Delete the ${c.name} category? Its products stay, without a category.`)) {
                run(() => deleteCategory(c.id))
              }
            }}
          />
        ))}
      </ul>
      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          run(() => saveCategory(null, { name: name.trim(), slug: slugify(name) }))
          setName("")
        }}
      >
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Hoodies" className="max-w-xs" />
        <Button type="submit" variant="secondary" disabled={pending}>
          Add category
        </Button>
      </form>
    </Card>
  )
}

function CategoryRowItem({
  category,
  disabled,
  onRename,
  onDelete,
}: {
  category: CategoryRow
  disabled: boolean
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(category.name)
  return (
    <li className="flex items-center gap-3 py-2">
      <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} className="max-w-xs" aria-label="Category name" />
      <span className="text-xs text-brand-muted">/{category.slug}</span>
      <div className="ml-auto flex gap-2">
        {draft.trim() && draft !== category.name && (
          <Button type="button" variant="secondary" disabled={disabled} onClick={() => onRename(draft.trim())}>
            Rename
          </Button>
        )}
        <Button type="button" variant="ghost" disabled={disabled} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  )
}
