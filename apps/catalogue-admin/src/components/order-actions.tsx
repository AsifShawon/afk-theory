"use client"

import { useState, useTransition } from "react"
import { ORDER_STATUS_LABEL, ORDER_STATUSES, statusHasEmail, type OrderStatus } from "@dtc/catalogue-core/orders"
import { anonymiseOrder, resendOrderEmails, updateOrderStatus } from "@/app/actions/orders"
import type { ActionResult } from "@/lib/action-result"
import { Button, Card, Field, Notice, Select } from "./ui"

export function OrderActions({
  id,
  status,
  hasEmail,
  emailStatus,
  anonymised,
  emailProblem,
}: {
  id: string
  status: OrderStatus
  hasEmail: boolean
  emailStatus: "pending" | "sent" | "failed"
  anonymised: boolean
  emailProblem: string | null
}) {
  const [next, setNext] = useState<OrderStatus>(status)
  const [notify, setNotify] = useState(true)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [pending, start] = useTransition()

  const run = (action: () => Promise<ActionResult>) => start(async () => setResult(await action()))
  const canNotify = hasEmail && statusHasEmail(next) && next !== status

  return (
    <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      {result && <Notice tone={result.ok ? "success" : "error"}>{result.ok ? result.message ?? "Saved" : result.error}</Notice>}

      <Card title="Status">
        <div className="space-y-4">
          <Field label="Order status">
            <Select value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          {canNotify && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-1" />
              <span>
                Email the customer about this change
                {emailProblem && <span className="block text-xs text-amber-700">{emailProblem}</span>}
              </span>
            </label>
          )}
          <Button disabled={pending || next === status} onClick={() => run(() => updateOrderStatus({ id, status: next, notify: canNotify && notify }))} className="w-full">
            {pending ? "Saving..." : "Save status"}
          </Button>
        </div>
      </Card>

      <Card title="Paperwork">
        <div className="grid gap-2">
          <a href={`/orders/${id}/slip`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-base border border-brand-border bg-white text-sm font-semibold hover:border-brand-graphite">
            Print courier slip
          </a>
          {!anonymised && (
            <Button variant="secondary" disabled={pending} onClick={() => run(() => resendOrderEmails(id))}>
              {emailStatus === "sent" ? "Send order emails again" : "Resend order emails"}
            </Button>
          )}
        </div>
      </Card>

      {!anonymised && (
        <Card title="Privacy">
          <p className="mb-3 text-sm text-brand-muted">Removes the name, phone, email, address and note. Items and totals stay for your records. This cannot be undone.</p>
          <Button
            variant="danger"
            disabled={pending}
            className="w-full"
            onClick={() => {
              if (window.confirm("Remove this customer's personal details for good?")) run(() => anonymiseOrder(id))
            }}
          >
            Remove personal details
          </Button>
        </Card>
      )}
    </div>
  )
}
