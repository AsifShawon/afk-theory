"use client"

import { Button, TextInput } from "./ui"

export interface ChartValue {
  columns: string[]
  rows: { size: string; values: string[] }[]
}

/**
 * Measurement table editor. With `editableSizes`, sizes are rows you add and
 * rename (shared guides). Without it, rows follow the product's sizes.
 */
export function SizeChartTable({
  value,
  onChange,
  editableSizes = false,
}: {
  value: ChartValue
  onChange: (next: ChartValue) => void
  editableSizes?: boolean
}) {
  const { columns, rows } = value
  const normalize = (r: { size: string; values: string[] }) => ({ size: r.size, values: columns.map((_, i) => r.values[i] ?? "") })

  const setCell = (rowIndex: number, col: number, cell: string) =>
    onChange({
      columns,
      rows: rows.map((r, i) => {
        const row = normalize(r)
        if (i === rowIndex) row.values[col] = cell
        return row
      }),
    })

  const setColumns = (next: string[], removed?: number) =>
    onChange({
      columns: next,
      rows: rows.map((r) => {
        const values = [...r.values]
        if (removed !== undefined) values.splice(removed, 1)
        return { size: r.size, values: next.map((_, i) => values[i] ?? "") }
      }),
    })

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-3 text-left text-xs uppercase tracking-wider text-brand-muted">Size</th>
              {columns.map((col, i) => (
                <th key={i} className="pb-2 pr-3">
                  <div className="flex items-center gap-1">
                    <TextInput
                      value={col}
                      onChange={(e) => setColumns(columns.map((c, j) => (j === i ? e.target.value : c)))}
                      className="w-28 font-semibold"
                      aria-label={`Measurement ${i + 1} name`}
                    />
                    <button
                      type="button"
                      className="px-1 text-xs font-bold text-red-700"
                      onClick={() => setColumns(columns.filter((_, j) => j !== i), i)}
                      aria-label={`Remove ${col || "column"}`}
                    >
                      x
                    </button>
                  </div>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="pr-3 pt-2">
                  {editableSizes ? (
                    <TextInput
                      value={row.size}
                      onChange={(e) =>
                        onChange({ columns, rows: rows.map((r, i) => (i === rowIndex ? { ...normalize(r), size: e.target.value.toUpperCase() } : normalize(r))) })
                      }
                      className="w-20 font-bold"
                      aria-label={`Size in row ${rowIndex + 1}`}
                    />
                  ) : (
                    <span className="font-bold">{row.size}</span>
                  )}
                </td>
                {columns.map((col, c) => (
                  <td key={c} className="pr-3 pt-2">
                    <TextInput
                      value={row.values[c] ?? ""}
                      onChange={(e) => setCell(rowIndex, c, e.target.value)}
                      className="w-28"
                      inputMode="decimal"
                      aria-label={`${row.size || "Size"} ${col}`}
                    />
                  </td>
                ))}
                <td className="pt-2">
                  {editableSizes && (
                    <button
                      type="button"
                      className="px-1 text-xs font-semibold text-brand-muted hover:text-red-700"
                      onClick={() => onChange({ columns, rows: rows.filter((_, i) => i !== rowIndex) })}
                      aria-label={`Remove size ${row.size}`}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {editableSizes && (
          <Button type="button" variant="secondary" onClick={() => onChange({ columns, rows: [...rows.map(normalize), { size: "", values: columns.map(() => "") }] })}>
            Add size
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => setColumns([...columns, ""])}>
          Add measurement
        </Button>
      </div>
    </div>
  )
}
