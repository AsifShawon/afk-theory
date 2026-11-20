"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { clsx } from "clsx"
import {
  DEFAULT_SIZES,
  slugify,
  type CategoryRow,
  type ColorInput,
  type ProductDetails,
  type ProductInput,
} from "@dtc/catalogue-core"
import { deleteProduct, saveProduct } from "@/app/actions/products"
import { Button, Card, Field, Notice, Select, TextArea, TextInput } from "./ui"

const SIZE_PRESETS = ["XS", ...DEFAULT_SIZES, "XXXL"]

const DETAIL_FIELDS: { key: keyof ProductDetails; label: string; hint: string }[] = [
  { key: "fabric", label: "Fabric", hint: "100% combed cotton" },
  { key: "gsm", label: "Weight (GSM)", hint: "240 GSM" },
  { key: "fit", label: "Fit", hint: "Oversized with dropped shoulders" },
  { key: "origin", label: "Origin", hint: "Made in Bangladesh" },
  { key: "care", label: "Care", hint: "Wash cold inside out" },
]

export interface ProductFormProps {
  id: string | null
  initial: ProductInput
  initialColors: ColorInput[]
  categories: CategoryRow[]
  imageCount: number
}

export function ProductForm({ id, initial, initialColors, categories, imageCount }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<ProductInput>(initial)
  const [colors, setColors] = useState<ColorInput[]>(initialColors)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [customSize, setCustomSize] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const toggleSize = (size: string) => {
    const has = form.sizes.includes(size)
    const sizes = has ? form.sizes.filter((s) => s !== size) : orderSizes([...form.sizes, size])
    setForm((f) => ({ ...f, sizes, soldOutSizes: f.soldOutSizes.filter((s) => sizes.includes(s)) }))
  }

  const toggleSoldOut = (size: string) =>
    set("soldOutSizes", form.soldOutSizes.includes(size) ? form.soldOutSizes.filter((s) => s !== size) : [...form.soldOutSizes, size])

  const submit = () => {
    setNotice(null)
    setErrors({})
    if (form.status === "published" && imageCount === 0) {
      setNotice({ tone: "error", text: "Add at least one image before publishing. Save as draft first, then upload images." })
      return
    }
    startTransition(async () => {
      const result = await saveProduct(id, form, colors)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setNotice({ tone: "error", text: result.error })
        return
      }
      setNotice({ tone: "success", text: id ? "Saved. Publish when you are ready to update the site." : "Product created. Now add images." })
      if (!id) {
        router.push(`/products/${result.data.id}`)
      } else {
        router.refresh()
      }
    })
  }

  const remove = () => {
    if (!id || !confirm(`Delete ${form.name} and all its images? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (result.ok) {
        router.push("/")
      } else {
        setNotice({ tone: "error", text: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <Card title="Basics">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <TextInput
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
              }}
              placeholder="Drop 02 Heavyweight Tee"
            />
          </Field>
          <Field label="URL slug" error={errors.slug} hint={`Page address: /products/${form.slug || "..."}`}>
            <TextInput
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set("slug", e.target.value.toLowerCase())
              }}
            />
          </Field>
          <Field label="Tagline" error={errors.tagline} hint="One short line under the name" className="md:col-span-2">
            <TextInput value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Description" error={errors.description} className="md:col-span-2">
            <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} />
          </Field>
          <Field label="Price (BDT)" error={errors.priceBdt}>
            <TextInput type="number" min={0} value={form.priceBdt} onChange={(e) => set("priceBdt", Number(e.target.value))} />
          </Field>
          <Field label="Compare-at price (BDT)" error={errors.compareAtBdt} hint="Optional. Shows the old price crossed out.">
            <TextInput
              type="number"
              min={0}
              value={form.compareAtBdt ?? ""}
              onChange={(e) => set("compareAtBdt", e.target.value === "" ? null : Number(e.target.value))}
            />
          </Field>
          <Field label="Category" error={errors.categoryId} hint="Manage categories in Settings">
            <Select value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-6">
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value as ProductInput["status"])}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <label className="flex h-10 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="h-4 w-4 accent-brand-graphite" />
              Featured on home
            </label>
          </div>
        </div>
      </Card>

      <Card title="Sizes">
        <p className="mb-3 text-sm text-brand-muted">Pick the sizes this product comes in. Mark a size sold out to disable it on the site.</p>
        <div className="flex flex-wrap gap-2">
          {orderSizes([...new Set([...SIZE_PRESETS, ...form.sizes])]).map((size) => {
            const active = form.sizes.includes(size)
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={clsx(
                  "h-10 min-w-12 rounded-base border px-3 text-sm font-bold",
                  active ? "border-brand-graphite bg-brand-graphite text-brand-bone" : "border-brand-border bg-white text-brand-muted"
                )}
              >
                {size}
              </button>
            )
          })}
          <div className="flex gap-2">
            <TextInput value={customSize} onChange={(e) => setCustomSize(e.target.value.toUpperCase())} placeholder="Other" className="w-24" />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const s = customSize.trim()
                if (s && !form.sizes.includes(s)) set("sizes", [...form.sizes, s])
                setCustomSize("")
              }}
            >
              Add
            </Button>
          </div>
        </div>
        {errors.sizes && <p className="mt-2 text-xs text-red-700">{errors.sizes}</p>}
        {form.sizes.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">Sold out</p>
            <div className="flex flex-wrap gap-4">
              {form.sizes.map((size) => (
                <label key={size} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.soldOutSizes.includes(size)} onChange={() => toggleSoldOut(size)} className="h-4 w-4 accent-brand-graphite" />
                  {size}
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Colors"
        actions={
          <Button type="button" variant="secondary" onClick={() => setColors([...colors, { name: "", hex: "#20241F", inStock: true }])}>
            Add color
          </Button>
        }
      >
        {colors.length === 0 && <p className="text-sm text-brand-muted">No colors. Add one so customers can choose it, or leave empty for a single-color product.</p>}
        <div className="space-y-3">
          {colors.map((color, index) => (
            <div key={color.id ?? `new-${index}`} className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={color.hex}
                onChange={(e) => setColors(colors.map((c, i) => (i === index ? { ...c, hex: e.target.value.toUpperCase() } : c)))}
                className="h-10 w-12 cursor-pointer rounded-base border border-brand-border bg-white"
                aria-label="Color swatch"
              />
              <TextInput
                value={color.name}
                onChange={(e) => setColors(colors.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)))}
                placeholder="Graphite Black"
                className="max-w-xs"
              />
              <TextInput
                value={color.hex}
                onChange={(e) => setColors(colors.map((c, i) => (i === index ? { ...c, hex: e.target.value } : c)))}
                className="w-28 font-mono"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={color.inStock}
                  onChange={(e) => setColors(colors.map((c, i) => (i === index ? { ...c, inStock: e.target.checked } : c)))}
                  className="h-4 w-4 accent-brand-graphite"
                />
                In stock
              </label>
              <Button type="button" variant="ghost" disabled={index === 0} onClick={() => setColors(swap(colors, index, index - 1))} aria-label="Move up">
                Up
              </Button>
              <Button type="button" variant="ghost" onClick={() => setColors(colors.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        {Object.entries(errors)
          .filter(([key]) => /^\d+\./.test(key))
          .map(([key, message]) => (
            <p key={key} className="mt-2 text-xs text-red-700">
              Color {Number(key.split(".")[0]) + 1}: {message}
            </p>
          ))}
      </Card>

      <Card title="Details">
        <div className="grid gap-5 md:grid-cols-2">
          {DETAIL_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint} className={field.key === "care" ? "md:col-span-2" : undefined}>
              <TextInput value={form.details[field.key] ?? ""} onChange={(e) => set("details", { ...form.details, [field.key]: e.target.value })} />
            </Field>
          ))}
        </div>
      </Card>

      <SizeChartEditor form={form} onChange={(sizeChart) => set("sizeChart", sizeChart)} />

      <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-4 border-t border-brand-border bg-brand-bone/95 px-6 py-4 backdrop-blur">
        <div>{id && <Button type="button" variant="danger" onClick={remove} disabled={pending}>Delete product</Button>}</div>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving" : id ? "Save changes" : "Create product"}
        </Button>
      </div>
    </div>
  )
}

function SizeChartEditor({ form, onChange }: { form: ProductInput; onChange: (chart: ProductInput["sizeChart"]) => void }) {
  const chart = form.sizeChart
  const valueFor = (size: string, col: number) => chart.rows.find((r) => r.size === size)?.values[col] ?? ""

  const setValue = (size: string, col: number, value: string) => {
    const rows = form.sizes.map((s) => {
      const existing = chart.rows.find((r) => r.size === s)
      const values = chart.columns.map((_, i) => existing?.values[i] ?? "")
      if (s === size) values[col] = value
      return { size: s, values }
    })
    onChange({ ...chart, rows })
  }

  const setColumns = (columns: string[]) => {
    onChange({
      ...chart,
      columns,
      rows: form.sizes.map((s) => ({ size: s, values: columns.map((_, i) => chart.rows.find((r) => r.size === s)?.values[i] ?? "") })),
    })
  }

  return (
    <Card
      title="Size chart"
      actions={
        <div className="flex gap-2">
          {chart.columns.length === 0 && (
            <Button type="button" variant="secondary" onClick={() => setColumns(["Chest", "Length", "Sleeve"])}>
              Start with chest, length, sleeve
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => setColumns([...chart.columns, `Measure ${chart.columns.length + 1}`])}>
            Add column
          </Button>
        </div>
      }
    >
      {chart.columns.length === 0 ? (
        <p className="text-sm text-brand-muted">Optional. Without a chart, the size guide button is hidden on the site.</p>
      ) : (
        <div className="space-y-3 overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th className="pr-3 text-left text-xs uppercase text-brand-muted">Size</th>
                {chart.columns.map((col, i) => (
                  <th key={i} className="pr-3">
                    <div className="flex items-center gap-1">
                      <TextInput
                        value={col}
                        onChange={(e) => setColumns(chart.columns.map((c, j) => (j === i ? e.target.value : c)))}
                        className="w-28"
                      />
                      <button type="button" className="text-xs text-red-700" onClick={() => setColumns(chart.columns.filter((_, j) => j !== i))} aria-label={`Remove ${col}`}>
                        x
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.sizes.map((size) => (
                <tr key={size}>
                  <td className="pr-3 font-bold">{size}</td>
                  {chart.columns.map((_, col) => (
                    <td key={col} className="pr-3 pt-2">
                      <TextInput value={valueFor(size, col)} onChange={(e) => setValue(size, col, e.target.value)} className="w-28" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Field label="Unit" className="max-w-[200px]">
            <TextInput value={chart.unit ?? ""} onChange={(e) => onChange({ ...chart, unit: e.target.value })} placeholder="inches" />
          </Field>
        </div>
      )}
    </Card>
  )
}

const SIZE_RANK = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]

function orderSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const i = SIZE_RANK.indexOf(s)
    return i === -1 ? 100 : i
  }
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, undefined, { numeric: true }))
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}
