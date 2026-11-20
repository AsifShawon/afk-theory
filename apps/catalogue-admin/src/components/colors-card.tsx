"use client"

import { useId } from "react"
import type { ColorInput } from "@dtc/catalogue-core"
import type { ColorPreset } from "@/lib/data"
import { Button, Card, TextInput } from "./ui"

const DEFAULT_HEX = "#20241F"

/**
 * Product colors. Colors already used on other products show as one-click
 * swatches, and typing a known name fills in its hex.
 */
export function ColorsCard({
  colors,
  presets,
  errors,
  onChange,
}: {
  colors: ColorInput[]
  presets: ColorPreset[]
  errors: Record<string, string>
  onChange: (colors: ColorInput[]) => void
}) {
  const listId = useId()
  const taken = new Set(colors.map((c) => c.name.trim().toLowerCase()))
  const available = presets.filter((p) => !taken.has(p.name.toLowerCase()))

  const update = (index: number, patch: Partial<ColorInput>) => onChange(colors.map((c, i) => (i === index ? { ...c, ...patch } : c)))

  const setName = (index: number, name: string) => {
    const preset = presets.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())
    const current = colors[index]
    // Fill the hex from a known color unless it was already changed by hand.
    const keepHex = current.hex.toUpperCase() !== DEFAULT_HEX && !presets.some((p) => p.hex === current.hex.toUpperCase())
    update(index, preset && !keepHex ? { name, hex: preset.hex } : { name })
  }

  const move = (index: number) => {
    const next = [...colors]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  return (
    <Card
      title="Colors"
      actions={
        <Button type="button" variant="secondary" onClick={() => onChange([...colors, { name: "", hex: DEFAULT_HEX, inStock: true }])}>
          Add new color
        </Button>
      }
    >
      {available.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">Used on other products. Click to add</p>
          <div className="flex flex-wrap gap-2">
            {available.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange([...colors, { name: preset.name, hex: preset.hex, inStock: true }])}
                className="flex h-9 items-center gap-2 rounded-pill border border-brand-border bg-white pl-1.5 pr-3 text-sm font-semibold transition-colors hover:border-brand-graphite"
                title={`${preset.name} ${preset.hex}`}
              >
                <span className="h-6 w-6 rounded-full border border-black/15" style={{ backgroundColor: preset.hex }} aria-hidden />
                {preset.name}
                <span className="text-brand-muted" aria-hidden>
                  +
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length === 0 && (
        <p className="text-sm text-brand-muted">No colors. Add one so customers can choose it, or leave empty for a single-color product.</p>
      )}

      <datalist id={listId}>
        {presets.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>

      <div className="space-y-3">
        {colors.map((color, index) => (
          <div key={color.id ?? `new-${index}`} className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : DEFAULT_HEX}
              onChange={(e) => update(index, { hex: e.target.value.toUpperCase() })}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-base border border-brand-border bg-white"
              aria-label={`Pick color ${index + 1}`}
            />
            <div className="w-full min-w-0 flex-1 sm:w-56 sm:flex-none">
              <TextInput
                value={color.name}
                onChange={(e) => setName(index, e.target.value)}
                placeholder="Graphite Black"
                list={listId}
                aria-label={`Color ${index + 1} name`}
              />
            </div>
            <div className="w-28 shrink-0">
              <TextInput
                value={color.hex}
                onChange={(e) => update(index, { hex: e.target.value })}
                className="font-mono"
                aria-label={`Color ${index + 1} hex code`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={color.inStock}
                onChange={(e) => update(index, { inStock: e.target.checked })}
                className="h-4 w-4 accent-brand-graphite"
              />
              In stock
            </label>
            <div className="ml-auto flex">
              <Button type="button" variant="ghost" disabled={index === 0} onClick={() => move(index)} aria-label={`Move ${color.name || "color"} up`}>
                Up
              </Button>
              <Button type="button" variant="ghost" onClick={() => onChange(colors.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
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
  )
}
