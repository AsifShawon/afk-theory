"use client"

import Link from "next/link"
import { useState } from "react"
import type { ProductBadgeSetting } from "@dtc/catalogue-core"
import type { ProductStoreOptions } from "@/lib/data"
import { MigrationNotice } from "./store-ui"
import { Card, Field, Select, TextInput } from "./ui"

const BADGE_LABELS: Record<ProductBadgeSetting, string> = {
  none: "None (automatic only)",
  new: "New",
  bestseller: "Bestseller",
}

const NEW_GROUP = "__new__"

/** Badge, collections and the "More designs" group of a product. */
export function MerchandisingCard({
  options,
  badge,
  collectionIds,
  designGroup,
  errors,
  onChange,
}: {
  options: ProductStoreOptions
  badge: ProductBadgeSetting
  collectionIds: string[]
  designGroup: string
  errors: Record<string, string>
  onChange: (patch: { badge?: ProductBadgeSetting; collectionIds?: string[]; designGroup?: string }) => void
}) {
  const known = options.designGroups.find((g) => g.name.toLowerCase() === designGroup.trim().toLowerCase())
  const [typing, setTyping] = useState(Boolean(designGroup) && !known)

  if (!options.available) {
    return (
      <Card title="Badge, collections and more designs">
        <MigrationNotice feature="Badges, collections and design groups" />
      </Card>
    )
  }

  const toggleCollection = (id: string) =>
    onChange({ collectionIds: collectionIds.includes(id) ? collectionIds.filter((c) => c !== id) : [...collectionIds, id] })

  return (
    <Card title="Badge, collections and more designs">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Badge" error={errors.badge} hint="Sale and Sold out show automatically. Products added in the last 30 days count as New.">
          <Select value={badge} onChange={(e) => onChange({ badge: e.target.value as ProductBadgeSetting })}>
            {(Object.keys(BADGE_LABELS) as ProductBadgeSetting[]).map((b) => (
              <option key={b} value={b}>
                {BADGE_LABELS[b]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="More designs group"
          error={errors.designGroup}
          hint={
            known && known.products.length > 0
              ? `Shown with: ${known.products.join(", ")}`
              : "Separate products with the same group show each other under More designs."
          }
        >
          {typing ? (
            <div className="flex gap-2">
              <TextInput value={designGroup} onChange={(e) => onChange({ designGroup: e.target.value })} placeholder="Pause graphic" maxLength={60} autoFocus />
              <button
                type="button"
                className="text-sm font-semibold text-brand-muted hover:text-brand-graphite"
                onClick={() => {
                  setTyping(false)
                  onChange({ designGroup: "" })
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <Select
              value={known?.name ?? ""}
              onChange={(e) => {
                if (e.target.value === NEW_GROUP) {
                  setTyping(true)
                  onChange({ designGroup: "" })
                } else {
                  onChange({ designGroup: e.target.value })
                }
              }}
            >
              <option value="">None</option>
              {options.designGroups.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} ({g.products.length} other{g.products.length === 1 ? "" : "s"})
                </option>
              ))}
              <option value={NEW_GROUP}>New group...</option>
            </Select>
          )}
        </Field>

        <div className="md:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">Collections</p>
          {options.collections.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No collections yet. Create them under{" "}
              <Link href="/collections" className="font-semibold underline">
                Collections
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {options.collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={collectionIds.includes(c.id)}
                    onChange={() => toggleCollection(c.id)}
                    className="h-4 w-4 accent-brand-graphite"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
          {errors.collectionIds && <p className="mt-2 text-xs text-red-700">{errors.collectionIds}</p>}
        </div>
      </div>
    </Card>
  )
}
