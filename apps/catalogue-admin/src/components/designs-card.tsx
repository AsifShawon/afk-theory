"use client"

import type { DesignInput } from "@dtc/catalogue-core"
import { MigrationNotice, MoveButtons, moveItem } from "./store-ui"
import { Button, Card, TextInput } from "./ui"

const SUGGESTIONS = ["Front design", "Back design"]

/**
 * Optional Design option next to Color, for example Front design and Back
 * design. Products without designs show color only on the site.
 */
export function DesignsCard({
  designs,
  available,
  errors,
  onChange,
}: {
  designs: DesignInput[]
  /** False until the store structure migration has run. */
  available: boolean
  errors: Record<string, string>
  onChange: (designs: DesignInput[]) => void
}) {
  if (!available) {
    return (
      <Card title="Design options">
        <MigrationNotice feature="Design options" />
      </Card>
    )
  }

  const taken = new Set(designs.map((d) => d.name.trim().toLowerCase()))
  const update = (index: number, patch: Partial<DesignInput>) => onChange(designs.map((d, i) => (i === index ? { ...d, ...patch } : d)))

  return (
    <Card
      title="Design options"
      actions={
        <Button type="button" variant="secondary" onClick={() => onChange([...designs, { name: "", inStock: true }])}>
          Add design
        </Button>
      }
    >
      <p className="mb-4 text-sm text-brand-muted">
        Use this when the same product comes in different prints, for example Front design and Back design. Customers pick a design next to the color, and
        each photo can be tagged with its design under Images. Leave empty for color only.
      </p>

      {designs.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase())).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange([...designs, { name, inStock: true }])}
              className="h-9 rounded-pill border border-brand-border bg-white px-3 text-sm font-semibold hover:border-brand-graphite"
            >
              {name} +
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {designs.map((design, index) => (
          <div key={design.id ?? `new-${index}`} className="flex flex-wrap items-center gap-3">
            <div className="w-full min-w-0 flex-1 sm:w-64 sm:flex-none">
              <TextInput
                value={design.name}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="Back design"
                maxLength={40}
                aria-label={`Design ${index + 1} name`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={design.inStock}
                onChange={(e) => update(index, { inStock: e.target.checked })}
                className="h-4 w-4 accent-brand-graphite"
              />
              In stock
            </label>
            <div className="ml-auto flex">
              <MoveButtons
                label={design.name || "design"}
                isFirst={index === 0}
                isLast={index === designs.length - 1}
                onMove={(d) => onChange(moveItem(designs, index, d))}
              />
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => {
                  if (design.id && !confirm(`Remove ${design.name || "this design"}? Its photos stay and show for every design.`)) return
                  onChange(designs.filter((_, i) => i !== index))
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {designs.length > 0 && designs.every((d) => !d.inStock) && (
        <p className="mt-3 text-xs text-amber-700">No design is in stock, so the product shows as sold out.</p>
      )}
      {Object.entries(errors)
        .filter(([key]) => key.startsWith("designs."))
        .map(([key, message]) => (
          <p key={key} className="mt-2 text-xs text-red-700">
            Design {Number(key.split(".")[1]) + 1}: {message}
          </p>
        ))}
    </Card>
  )
}
