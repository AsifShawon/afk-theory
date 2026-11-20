"use client"

import Link from "next/link"
import type { SizeChart, SizeGuideRow } from "@dtc/catalogue-core"
import { SizeChartTable } from "./size-chart-table"
import { Button, Card, Field, Select, TextInput } from "./ui"

const CUSTOM = "custom"

/**
 * Pick a shared size guide (managed in Settings) or write a chart that only
 * this product uses.
 */
export function SizeGuidePicker({
  guides,
  guidesAvailable,
  sizes,
  guideId,
  chart,
  onGuideChange,
  onChartChange,
}: {
  guides: SizeGuideRow[]
  guidesAvailable: boolean
  sizes: string[]
  guideId: string | null
  chart: SizeChart
  onGuideChange: (id: string | null) => void
  onChartChange: (chart: SizeChart) => void
}) {
  const guide = guides.find((g) => g.id === guideId) ?? null
  const hasCustom = chart.columns.length > 0
  const mode = guide ? guide.id : hasCustom ? CUSTOM : ""

  // Custom charts follow the product's sizes.
  const customRows = sizes.map((size) => ({
    size,
    values: chart.columns.map((_, i) => chart.rows.find((r) => r.size === size)?.values[i] ?? ""),
  }))
  const missingFromGuide = guide ? sizes.filter((s) => !guide.rows.some((r) => r.size.toUpperCase() === s.toUpperCase())) : []

  return (
    <Card title="Size guide">
      <div className="space-y-4">
        <Field
          label="Size guide for this product"
          hint={guidesAvailable ? "Create and edit shared guides in Settings." : "Shared guides need the new database step. See Settings."}
        >
          <Select
            value={mode}
            onChange={(e) => {
              const next = e.target.value
              if (next === CUSTOM) {
                onGuideChange(null)
                if (!hasCustom) onChartChange({ columns: ["Chest", "Length", "Sleeve"], rows: [], unit: "inches" })
              } else if (next === "") {
                onGuideChange(null)
                onChartChange({ columns: [], rows: [] })
              } else {
                onGuideChange(next)
              }
            }}
          >
            <option value="">No size guide</option>
            {guides.length > 0 && (
              <optgroup label="Shared guides">
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
            )}
            <option value={CUSTOM}>Custom chart for this product only</option>
          </Select>
        </Field>

        {guide && (
          <div className="rounded-base border border-brand-border bg-brand-bone p-4">
            <div className="overflow-x-auto">
              <table className="text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                    <th className="pb-2 pr-6">Size</th>
                    {guide.columns.map((c) => (
                      <th key={c} className="pb-2 pr-6">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rows.map((r) => (
                    <tr key={r.size}>
                      <td className="py-1 pr-6 font-bold">{r.size}</td>
                      {guide.columns.map((c, i) => (
                        <td key={c} className="py-1 pr-6">
                          {r.values[i] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-brand-muted">
              {guide.unit && `In ${guide.unit}. `}
              To change these numbers, edit the guide in{" "}
              <Link href="/settings" className="font-semibold underline">
                Settings
              </Link>
              . Every product using it updates.
            </p>
            {missingFromGuide.length > 0 && (
              <p className="mt-2 text-xs font-semibold text-amber-800">
                This guide has no row for {missingFromGuide.join(", ")}. Add {missingFromGuide.length === 1 ? "it" : "them"} to the guide so customers can see those sizes.
              </p>
            )}
          </div>
        )}

        {!guide && hasCustom && (
          <div className="space-y-3">
            <SizeChartTable
              value={{ columns: chart.columns, rows: customRows }}
              onChange={(next) => onChartChange({ ...chart, ...next })}
            />
            <Field label="Unit" className="max-w-[200px]">
              <TextInput value={chart.unit ?? ""} onChange={(e) => onChartChange({ ...chart, unit: e.target.value })} placeholder="inches" />
            </Field>
            {guidesAvailable && (
              <p className="text-xs text-brand-muted">
                Using the same chart on several products?{" "}
                <Link href="/settings" className="font-semibold underline">
                  Make it a shared guide
                </Link>{" "}
                instead.
              </p>
            )}
          </div>
        )}

        {!guide && !hasCustom && (
          <p className="text-sm text-brand-muted">Without a size guide, the Size guide button is hidden on the product page.</p>
        )}

        {guideId && !guide && (
          <div className="flex items-center gap-3 text-sm text-amber-800">
            The linked guide no longer exists.
            <Button type="button" variant="secondary" onClick={() => onGuideChange(null)}>
              Clear it
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
