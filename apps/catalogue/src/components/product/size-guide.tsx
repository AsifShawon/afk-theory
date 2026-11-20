"use client"

import { useEffect, useRef } from "react"
import type { SizeChart } from "@dtc/catalogue-core"
import { useLenis } from "@/components/motion/smooth-scroll"
import { CloseIcon } from "@/components/ui/icons"

export function SizeGuide({ chart, open, onClose }: { chart: SizeChart; open: boolean; onClose: () => void }) {
  const lenis = useLenis()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      lenis?.start()
      window.removeEventListener("keydown", onKey)
    }
  }, [open, lenis, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg animate-sheet-enter bg-brand-bone p-6 text-brand-graphite md:animate-enter md:p-8"
      >
        <div className="flex items-start justify-between">
          <h2 id="size-guide-title" className="display text-3xl">
            Size guide
          </h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close size guide" className="p-1">
            <CloseIcon />
          </button>
        </div>
        <p className="mt-2 text-sm text-brand-olive">
          {chart.note || "Measured flat across the garment."}
          {chart.unit ? ` All measurements in ${chart.unit}.` : ""}
        </p>
        <div className="mt-6 overflow-x-auto" data-lenis-prevent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-graphite/20">
                <th className="font-hud py-2 pr-4 text-[10px]">Size</th>
                {chart.columns.map((col) => (
                  <th key={col} className="font-hud py-2 pr-4 text-[10px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row) => (
                <tr key={row.size} className="border-b border-brand-graphite/10">
                  <th scope="row" className="display py-3 pr-4 text-lg">
                    {row.size}
                  </th>
                  {chart.columns.map((col, i) => (
                    <td key={col} className="font-hud py-3 pr-4 tracking-normal">
                      {row.values[i] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
