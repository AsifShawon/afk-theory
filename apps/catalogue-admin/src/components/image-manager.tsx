"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { clsx } from "clsx"
import { IMAGE_ROLES, type ImageRole, type ProductColorRow } from "@dtc/catalogue-core"
import { deleteImage, reorderImages, updateImage, uploadImages } from "@/app/actions/images"
import type { AdminImage } from "@/lib/data"
import { Button, Card, Notice, Select, TextInput } from "./ui"

const ROLE_LABELS: Record<ImageRole, string> = {
  front: "Front (flat)",
  back: "Back (flat)",
  model: "On model",
  detail: "Detail",
}

export function ImageManager({ productId, images, colors }: { productId: string; images: AdminImage[]; colors: ProductColorRow[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState(images)
  const [uploadRole, setUploadRole] = useState<ImageRole>("model")
  const [uploadColor, setUploadColor] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => setItems(images), [images])

  const upload = (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    const data = new FormData()
    list.forEach((f) => data.append("files", f))
    data.set("role", uploadRole)
    data.set("colorId", uploadColor)
    setNotice({ tone: "info", text: `Converting and uploading ${list.length} image${list.length > 1 ? "s" : ""}...` })
    startTransition(async () => {
      const result = await uploadImages(productId, data)
      if (!result.ok) {
        setNotice({ tone: "error", text: result.error })
      } else {
        const { uploaded, failed } = result.data
        setNotice(
          failed.length > 0
            ? { tone: "error", text: `Uploaded ${uploaded}. Failed: ${failed.join("; ")}` }
            : { tone: "success", text: `Uploaded ${uploaded} image${uploaded === 1 ? "" : "s"}.` }
        )
      }
      if (inputRef.current) inputRef.current.value = ""
      router.refresh()
    })
  }

  const saveImage = (image: AdminImage, patch: Partial<Pick<AdminImage, "color_id" | "role" | "alt">>) => {
    const next = { ...image, ...patch }
    setItems((prev) => prev.map((i) => (i.id === image.id ? next : i)))
    startTransition(async () => {
      const result = await updateImage({ id: next.id, colorId: next.color_id, role: next.role, alt: next.alt })
      if (!result.ok) setNotice({ tone: "error", text: result.error })
    })
  }

  const moveTo = (fromId: string, toIndex: number) => {
    const from = items.findIndex((i) => i.id === fromId)
    if (from === -1 || from === toIndex) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(toIndex, 0, moved)
    setItems(next)
    startTransition(async () => {
      const result = await reorderImages(productId, next.map((i) => i.id))
      if (!result.ok) setNotice({ tone: "error", text: result.error })
    })
  }

  const remove = (image: AdminImage) => {
    if (!confirm("Delete this image from storage? This cannot be undone.")) return
    setItems((prev) => prev.filter((i) => i.id !== image.id))
    startTransition(async () => {
      const result = await deleteImage(image.id)
      if (!result.ok) setNotice({ tone: "error", text: result.error })
      router.refresh()
    })
  }

  return (
    <Card title={`Images (${items.length})`}>
      <div className="space-y-4">
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault()
              setDragOver(true)
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            if (e.dataTransfer.files.length > 0) {
              e.preventDefault()
              setDragOver(false)
              upload(e.dataTransfer.files)
            }
          }}
          className={clsx(
            "flex flex-col items-center gap-3 rounded-panel border-2 border-dashed p-8 text-center transition-colors",
            dragOver ? "border-brand-graphite bg-brand-accent/20" : "border-brand-border"
          )}
        >
          <p className="font-semibold">Drop photos here</p>
          <p className="text-xs text-brand-muted">
            JPG, PNG or WEBP up to 15 MB. Each photo is converted to webp at 640, 1080 and 1600 px wide. Use a 4:5 portrait crop for the best look.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Select value={uploadRole} onChange={(e) => setUploadRole(e.target.value as ImageRole)} className="w-40" aria-label="Role for new images">
              {IMAGE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <Select value={uploadColor} onChange={(e) => setUploadColor(e.target.value)} className="w-48" aria-label="Color for new images">
              <option value="">Any color</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => inputRef.current?.click()}>
              {pending ? "Working" : "Choose files"}
            </Button>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
          </div>
        </div>

        {items.length > 0 && (
          <>
            <p className="text-xs text-brand-muted">
              Drag to reorder. The first image is the product card. Tag a second &quot;On model&quot; image so cards swap on hover.
            </p>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {items.map((image, index) => (
                <li
                  key={image.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(image.id)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(e) => {
                    if (dragId) e.preventDefault()
                  }}
                  onDrop={(e) => {
                    if (dragId) {
                      e.preventDefault()
                      moveTo(dragId, index)
                    }
                  }}
                  className={clsx("space-y-2 rounded-base border border-brand-border p-2", dragId === image.id && "opacity-40")}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-soft bg-brand-stone">
                    <img src={image.thumbUrl} alt={image.alt} className="h-full w-full cursor-grab object-cover" />
                    {index === 0 && <span className="absolute left-2 top-2 rounded-pill bg-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase">Cover</span>}
                  </div>
                  <Select value={image.role} onChange={(e) => saveImage(image, { role: e.target.value as ImageRole })} aria-label="Image role">
                    {IMAGE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                  <Select value={image.color_id ?? ""} onChange={(e) => saveImage(image, { color_id: e.target.value || null })} aria-label="Image color">
                    <option value="">Any color</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <AltInput value={image.alt} onSave={(alt) => saveImage(image, { alt })} />
                  <div className="flex items-center justify-between text-[11px] text-brand-muted">
                    <span>
                      {image.width} x {image.height}
                    </span>
                    <button type="button" onClick={() => remove(image)} className="font-semibold text-red-700 hover:underline">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  )
}

function AltInput({ value, onSave }: { value: string; onSave: (alt: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <TextInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onSave(draft)}
      placeholder="Describe the photo"
      aria-label="Alt text"
      className="h-8 text-xs"
    />
  )
}
