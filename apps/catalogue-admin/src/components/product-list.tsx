"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { clsx } from "clsx"
import { formatBdt } from "@dtc/catalogue-core"
import { reorderProducts, setProductFlags } from "@/app/actions/products"
import type { ProductListItem } from "@/lib/data"
import { Badge, Notice } from "./ui"

export function ProductList({ initial }: { initial: ProductListItem[] }) {
  const [items, setItems] = useState(initial)
  const [dragId, setDragId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setItems(next)
    startTransition(async () => {
      const result = await reorderProducts(next.map((i) => i.id))
      if (!result.ok) setError(result.error)
    })
  }

  const toggle = (item: ProductListItem, flags: { status?: "draft" | "published"; isFeatured?: boolean }) => {
    if (flags.status === "published" && item.imageCount === 0) {
      setError(`${item.name} needs at least one image before it can be published.`)
      return
    }
    setError(null)
    setItems((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, status: flags.status ?? p.status, isFeatured: flags.isFeatured ?? p.isFeatured } : p
      )
    )
    startTransition(async () => {
      const result = await setProductFlags(item.id, flags)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <ul className={clsx("divide-y divide-brand-border overflow-hidden rounded-panel border border-brand-border bg-white", pending && "opacity-80")}>
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              const from = items.findIndex((i) => i.id === dragId)
              move(from, index)
            }}
            className={clsx("flex items-center gap-4 px-4 py-3", dragId === item.id && "bg-brand-bone")}
          >
            <span className="cursor-grab select-none text-brand-muted-light" aria-hidden>
              ⋮⋮
            </span>
            <div className="flex flex-col">
              <button aria-label={`Move ${item.name} up`} className="text-xs text-brand-muted hover:text-brand-graphite" onClick={() => move(index, index - 1)}>
                ▲
              </button>
              <button aria-label={`Move ${item.name} down`} className="text-xs text-brand-muted hover:text-brand-graphite" onClick={() => move(index, index + 1)}>
                ▼
              </button>
            </div>
            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-soft bg-brand-stone">
              {item.thumbUrl && <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${item.id}`} className="font-semibold hover:underline">
                {item.name}
              </Link>
              <p className="truncate text-xs text-brand-muted">
                /{item.slug} {item.categoryName ? ` · ${item.categoryName}` : ""} · {item.imageCount} images
              </p>
            </div>
            <span className="w-24 text-right text-sm font-semibold">{formatBdt(item.priceBdt)}</span>
            <button
              onClick={() => toggle(item, { isFeatured: !item.isFeatured })}
              className={clsx("w-24 text-xs font-bold uppercase tracking-wider", item.isFeatured ? "text-brand-graphite" : "text-brand-muted-light hover:text-brand-graphite")}
              title="Featured products lead the home page"
            >
              {item.isFeatured ? "★ Featured" : "☆ Feature"}
            </button>
            <button onClick={() => toggle(item, { status: item.status === "published" ? "draft" : "published" })} title="Click to switch">
              <Badge tone={item.status === "published" ? "live" : "neutral"}>{item.status}</Badge>
            </button>
            <Link href={`/products/${item.id}`} className="text-sm font-semibold text-brand-muted hover:text-brand-graphite">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
