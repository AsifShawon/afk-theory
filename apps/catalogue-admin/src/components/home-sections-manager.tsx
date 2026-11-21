"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { clsx } from "clsx"
import { DEFAULT_HOME_SECTIONS, HOME_SECTION_LABELS, type HomeSection } from "@dtc/catalogue-core"
import { saveHomeSections } from "@/app/actions/content"
import type { HomepageState } from "@/lib/data"
import { MigrationNotice, MoveButtons, moveItem } from "./store-ui"
import { Button, Card, Notice } from "./ui"

/** Order and visibility of the homepage sections below the hero. */
export function HomeSectionsManager({ state }: { state: HomepageState }) {
  const router = useRouter()
  const [sections, setSections] = useState<HomeSection[]>(state.sections)
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  if (state.migrationMissing) {
    return (
      <Card title="Homepage sections">
        <MigrationNotice feature="Homepage sections" />
      </Card>
    )
  }

  const changed = JSON.stringify(sections) !== JSON.stringify(state.sections)

  const save = () => {
    setNotice(null)
    startTransition(async () => {
      const result = await saveHomeSections(sections)
      setNotice(result.ok ? { tone: "success", text: result.message ?? "Saved" } : { tone: "error", text: result.error })
      router.refresh()
    })
  }

  return (
    <Card title="Homepage sections">
      <div className="space-y-4">
        <p className="text-sm text-brand-muted">
          The hero, the marquee and the featured product always lead the page. Choose the order of everything below them and switch sections off. A section
          with nothing to show (for example no collection set to show on home) is skipped on its own.
        </p>
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        <ol className="divide-y divide-brand-border rounded-base border border-brand-border">
          {sections.map((section, index) => {
            const info = HOME_SECTION_LABELS[section.id]
            return (
              <li key={section.id} className={clsx("flex items-center gap-4 px-4 py-3", !section.enabled && "bg-brand-bone")}>
                <span className="w-6 text-right text-sm font-bold text-brand-muted">{index + 1}</span>
                <label className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(e) => setSections(sections.map((s) => (s.id === section.id ? { ...s, enabled: e.target.checked } : s)))}
                    className="h-4 w-4 accent-brand-graphite"
                  />
                  <span className="min-w-0">
                    <span className={clsx("block font-semibold", !section.enabled && "text-brand-muted line-through")}>{info.label}</span>
                    <span className="block text-xs text-brand-muted">{info.hint}</span>
                  </span>
                </label>
                <MoveButtons
                  label={info.label}
                  disabled={pending}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                  onMove={(d) => setSections(moveItem(sections, index, d))}
                />
              </li>
            )
          })}
        </ol>
        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setSections(DEFAULT_HOME_SECTIONS.map((s) => ({ ...s })))}>
            Reset to default
          </Button>
          <Button type="button" onClick={save} disabled={pending || !changed}>
            {pending ? "Saving" : changed ? "Save homepage" : "Saved"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
