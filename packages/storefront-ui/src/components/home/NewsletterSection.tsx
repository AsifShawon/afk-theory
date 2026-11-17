"use client"

import React, { useState } from "react"
import { CheckIcon, EnvelopeIcon } from "../icons"

export interface NewsletterSectionProps {
  title?: string
  description?: string
  onSubscribe?: (email: string) => Promise<{ success: boolean; message?: string }>
}

export function NewsletterSection({
  title = "GET ON THE DROP REGISTRY",
  description = "Get notified the second new drops and limited restocks release in Bangladesh. Offline by choice. Zero spam.",
  onSubscribe,
}: NewsletterSectionProps) {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) return

    setIsLoading(true)
    try {
      if (onSubscribe) {
        await onSubscribe(email)
      }
      setIsSubscribed(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-16 sm:py-24 bg-band text-band-ink text-center">
      <div className="editorial-container max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-accent bg-band-ink px-2.5 py-0.5 inline-block">
            DROP ACCESS
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-band-ink uppercase tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-band-ink/70 max-w-lg mx-auto leading-relaxed font-sans">
            {description}
          </p>
        </div>

        {isSubscribed ? (
          <div className="p-4 bg-band-ink text-bone text-xs font-heading font-bold max-w-md mx-auto flex items-center justify-center gap-2.5">
            <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
            <span>You are confirmed on the AFK Drop Registry. Watch your inbox before public drops.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <EnvelopeIcon className="w-4 h-4 text-band-ink/50 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-band-ink/30 text-xs font-heading text-band-ink placeholder:text-band-ink/50 focus:outline-none focus:border-band-ink focus:bg-white/80"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-band-ink hover:bg-band-ink/85 text-bone text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? "Enrolling..." : "JOIN REGISTRY"}
            </button>
          </form>
        )}

        <p className="text-[10px] text-band-ink/60 uppercase tracking-wider font-heading">
          Zero spam. Unsubscribe at any time. Read our Privacy Policy.
        </p>
      </div>
    </section>
  )
}
