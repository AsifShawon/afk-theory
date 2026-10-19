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
    <section className="py-16 sm:py-24 bg-brand-surface border-b border-brand-border/80 text-center">
      <div className="editorial-container max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-brand-primary bg-brand-accent px-2.5 py-0.5 inline-block">
            DROP ACCESS
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-primary uppercase tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted max-w-lg mx-auto leading-relaxed font-sans">
            {description}
          </p>
        </div>

        {isSubscribed ? (
          <div className="p-4 bg-brand-secondary border border-brand-border text-brand-primary text-xs font-heading font-bold max-w-md mx-auto flex items-center justify-center gap-2.5 shadow-xs">
            <CheckIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <span>You are confirmed on the AFK Drop Registry. Watch your inbox before public drops.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <EnvelopeIcon className="w-4 h-4 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-brand-border text-xs font-heading text-brand-primary placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-primary shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-brand-primary text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? "Enrolling..." : "JOIN REGISTRY"}
            </button>
          </form>
        )}

        <p className="text-[10px] text-brand-muted uppercase tracking-wider font-heading">
          Zero spam. Unsubscribe at any time. Read our Privacy Policy.
        </p>
      </div>
    </section>
  )
}
