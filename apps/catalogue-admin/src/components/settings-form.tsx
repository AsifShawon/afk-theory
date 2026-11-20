"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import type { DeliveryZone, FaqItem, SiteSettings } from "@dtc/catalogue-core"
import { saveSettings } from "@/app/actions/settings"
import { Button, Card, Field, Notice, TextArea, TextInput } from "./ui"

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const [s, setS] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setS((prev) => ({ ...prev, [key]: value }))
  const setZone = (i: number, patch: Partial<DeliveryZone>) =>
    set("deliveryZones", s.deliveryZones.map((z, j) => (j === i ? { ...z, ...patch } : z)))
  const setFaq = (i: number, patch: Partial<FaqItem>) => set("faq", s.faq.map((f, j) => (j === i ? { ...f, ...patch } : f)))

  const submit = () => {
    setNotice(null)
    setErrors({})
    startTransition(async () => {
      const result = await saveSettings({ ...s })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setNotice({ tone: "error", text: result.error })
        return
      }
      setNotice({ tone: "success", text: "Settings saved. Publish to update the site." })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <Card title="Ordering channels">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="WhatsApp number" error={errors.whatsappNumber} hint="With country code, e.g. 8801712345678. 01712345678 also works.">
            <TextInput value={s.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Facebook page username" error={errors.messengerPage} hint="From facebook.com/your-page. Powers the Messenger button.">
            <TextInput value={s.messengerPage} onChange={(e) => set("messengerPage", e.target.value)} />
          </Field>
          <Field label="Instagram handle" error={errors.instagramHandle} hint="Optional, without @">
            <TextInput value={s.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} />
          </Field>
        </div>
        {!s.whatsappNumber && !s.messengerPage && (
          <p className="mt-4 text-sm text-amber-800">Add at least one channel, or customers will have no way to order.</p>
        )}
      </Card>

      <Card title="Home page text">
        <div className="grid gap-5">
          <Field label="Hero title" error={errors.heroTitle}>
            <TextInput value={s.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
          </Field>
          <Field label="Hero subtitle" error={errors.heroSubtitle}>
            <TextArea value={s.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} />
          </Field>
          <Field label="Announcement bar" error={errors.announcement} hint="Leave empty to hide">
            <TextInput value={s.announcement} onChange={(e) => set("announcement", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card
        title="Delivery zones"
        actions={
          <Button type="button" variant="secondary" onClick={() => set("deliveryZones", [...s.deliveryZones, { name: "", area: "", feeBdt: 0, eta: "" }])}>
            Add zone
          </Button>
        }
      >
        <div className="space-y-3">
          {s.deliveryZones.map((zone, i) => (
            <div key={i} className="grid items-end gap-3 md:grid-cols-[1fr_2fr_100px_120px_auto]">
              <Field label="Zone" error={errors[`deliveryZones.${i}.name`]}>
                <TextInput value={zone.name} onChange={(e) => setZone(i, { name: e.target.value })} />
              </Field>
              <Field label="Areas">
                <TextInput value={zone.area} onChange={(e) => setZone(i, { area: e.target.value })} />
              </Field>
              <Field label="Fee (BDT)">
                <TextInput type="number" value={zone.feeBdt} onChange={(e) => setZone(i, { feeBdt: Number(e.target.value) })} />
              </Field>
              <Field label="Time">
                <TextInput value={zone.eta} onChange={(e) => setZone(i, { eta: e.target.value })} />
              </Field>
              <Button type="button" variant="ghost" onClick={() => set("deliveryZones", s.deliveryZones.filter((_, j) => j !== i))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="FAQ"
        actions={
          <Button type="button" variant="secondary" onClick={() => set("faq", [...s.faq, { question: "", answer: "" }])}>
            Add question
          </Button>
        }
      >
        <div className="space-y-5">
          {s.faq.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex gap-3">
                <TextInput value={item.question} onChange={(e) => setFaq(i, { question: e.target.value })} placeholder="Question" />
                <Button type="button" variant="ghost" onClick={() => set("faq", s.faq.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              </div>
              <TextArea value={item.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} placeholder="Answer" rows={2} />
              {(errors[`faq.${i}.question`] || errors[`faq.${i}.answer`]) && (
                <p className="text-xs text-red-700">{errors[`faq.${i}.question`] ?? errors[`faq.${i}.answer`]}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-6 flex justify-end border-t border-brand-border bg-brand-bone/95 px-6 py-4 backdrop-blur">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? "Saving" : "Save settings"}
        </Button>
      </div>
    </div>
  )
}
