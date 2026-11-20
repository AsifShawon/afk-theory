"use client"

import { useState, useTransition } from "react"
import { clsx } from "clsx"
import { publishSite } from "@/app/actions/publish"
import type { PublishStatus } from "@/lib/data"

function timeAgo(iso: string | null): string {
  if (!iso) return "never"
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return new Date(iso).toLocaleDateString()
}

export function PublishButton({ status }: { status: PublishStatus }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const publish = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await publishSite()
      setMessage(result.ok ? { ok: true, text: result.message ?? "Publishing" } : { ok: false, text: result.error })
    })
  }

  return (
    <div className="relative flex items-center gap-3">
      <span className="hidden text-right text-[11px] leading-tight text-brand-muted-light md:block">
        Published {timeAgo(status.publishedAt)}
        <br />
        {status.hasUnpublishedChanges ? <span className="text-brand-accent">Unpublished changes</span> : "Up to date"}
      </span>
      <button
        onClick={publish}
        disabled={pending}
        className={clsx(
          "h-10 rounded-base px-5 text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-60",
          status.hasUnpublishedChanges ? "bg-brand-accent text-brand-graphite hover:bg-brand-accent-hover" : "bg-brand-graphite-light text-brand-bone hover:bg-brand-olive"
        )}
      >
        {pending ? "Publishing" : "Publish"}
      </button>
      {message && (
        <div
          role="status"
          className={clsx(
            "absolute right-0 top-12 w-80 rounded-base border p-3 text-xs shadow-mega",
            message.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {message.text}
          <button className="ml-2 underline" onClick={() => setMessage(null)}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}
